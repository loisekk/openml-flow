# server/ai_workflow_builder.py
"""
AI Workflow Builder — profiles the user's latest uploaded dataset, asks the
active AI provider for a workflow plan as strict JSON, then VALIDATES that
plan server-side before it ever reaches the frontend preview modal.

The AI NEVER mutates the canvas directly: it only proposes. The user applies.
"""

import os
import json
import glob

from openai import OpenAI
from ai_gateway import AIGatewayError, _map_provider_error

UPLOADS_DIR = "uploads"

# Whitelist of node keys the AI may use. 'use' guides the model's choices.
CATALOG = [
    {"key": "loadCSV",          "title": "Load CSV",              "use": "always first — loads the dataset"},
    {"key": "missingValues",    "title": "Missing Values",       "use": "ONLY if the profile shows missing values"},
    {"key": "fillMean",         "title": "Fill Missing (Mean)",   "use": "fill numeric missing values with the mean"},
    {"key": "dropNulls",        "title": "Drop Nulls",            "use": "ONLY if missing data is rare (<5% rows)"},
    {"key": "fixDataTypes",     "title": "Fix Data Types",        "use": "coerce columns to numeric/datetime when needed"},
    {"key": "corrMatrix",       "title": "Correlation Matrix",   "use": "EDA — feature correlation heatmap"},
    {"key": "histogram",        "title": "Histogram",            "use": "EDA — distribution of one column"},
    {"key": "oneHotEncode",     "title": "One-Hot Encode",       "use": "encode low-cardinality categorical features"},
    {"key": "labelEncode",      "title": "Label Encode",         "use": "encode high-cardinality categoricals / target labels"},
    {"key": "datetimeFeatures", "title": "Datetime Features",   "use": "ONLY if the profile shows a date column"},
    {"key": "trainTestSplit",   "title": "Train/Test Split",    "use": "ALWAYS present and ALWAYS before models; set targetColumn + taskType from the profile"},
    {"key": "smote",            "title": "SMOTE",               "use": "ONLY for imbalanced CLASSIFICATION, after the split"},
    {"key": "standardScaler",   "title": "Standard Scaler",     "use": "helps KNN/SVM/Logistic; skip for tree models"},
    {"key": "randomForest",     "title": "Random Forest",       "use": "strong default model for both classification and regression"},
    {"key": "xgboost",          "title": "XGBoost",             "use": "powerful gradient boosting alternative"},
    {"key": "logisticReg",      "title": "Logistic Regression", "use": "binary classification baseline"},
    {"key": "linearReg",        "title": "Linear Regression",   "use": "regression baseline"},
    {"key": "gridSearch",       "title": "Grid Search",         "use": "optional hyperparameter tuning"},
    {"key": "featureImp",       "title": "Feature Importance",  "use": "explainability for tree models"},
    {"key": "accuracyMetrics",  "title": "Accuracy/Precision",   "use": "final evaluation after the model"},
    {"key": "saveModel",        "title": "Save Pipeline (.pkl)", "use": "persist the trained model"},
    {"key": "deployFastAPI",    "title": "Generate FastAPI",     "use": "serve the model as a REST API"},
    {"key": "note",             "title": "Note",                "use": "documentation notes; use for important decisions"},
]

CATALOG_KEYS = {entry["key"] for entry in CATALOG}

TARGET_HINTS = {"target", "y", "label", "class", "churn", "is_churn", "defaulted", "fraud", "outcome"}


def profile_latest_dataset() -> dict:
    """REAL analysis of the newest uploaded CSV — the AI never guesses data shape."""
    csv_files = glob.glob(os.path.join(UPLOADS_DIR, "*.csv"))
    if not csv_files:
        raise AIGatewayError(
            "No dataset found — upload a CSV via a Load CSV node "
            "(or the Datasets page) before asking me to build a workflow."
        )
    latest = max(csv_files, key=os.path.getmtime)

    try:
        import pandas as pd
        df = pd.read_csv(latest)
    except Exception as e:
        raise AIGatewayError(f"Could not read '{os.path.basename(latest)}': {e}") from e

    columns = []
    for col in df.columns:
        series = df[col]
        try:
            samples = [str(v) for v in series.dropna().unique()[:3]]
        except Exception:
            samples = []
        columns.append({
            "name": str(col),
            "dtype": str(series.dtype),
            "missing_pct": round(float(series.isnull().mean() * 100), 1),
            "nunique": int(series.nunique(dropna=True)),
            "sample_values": samples,
        })

    hinted = next((c["name"] for c in columns if c["name"].strip().lower() in TARGET_HINTS), None)
    guessed_target = hinted or (columns[-1]["name"] if columns else None)

    target_col = next((c for c in columns if c["name"] == guessed_target), None)
    is_classification = bool(
        target_col and (
            target_col["dtype"] in ("object", "category", "bool")
            or target_col["nunique"] <= 20
        )
    )

    imbalance_note = None
    if is_classification and df[guessed_target].nunique() == 2:
        counts = df[guessed_target].value_counts(normalize=True)
        minority = float(counts.min())
        if minority < 0.25:
            imbalance_note = f"minority class is only {round(minority * 100, 1)}% — consider SMOTE"

    return {
        "file": os.path.basename(latest),
        "rows": int(len(df)),
        "columns": columns,
        "guessed_target": guessed_target,
        "task_guess": "classification" if is_classification else "regression",
        "imbalance_note": imbalance_note,
    }


def _extract_json(text: str) -> dict:
    """Pull the first '{' … last '}' span out of an LLM reply and parse it."""
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise AIGatewayError("AI returned no JSON plan — try rephrasing the request or switching models.")
    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError:
        raise AIGatewayError("AI returned malformed JSON — try again or switch models.")


def _validate_plan(plan: dict) -> dict:
    """Server-side guardrails: whitelist keys, sane edges, acyclic, bounded."""
    raw_nodes = plan.get("nodes") or []

    # 1. Nodes: whitelist + cap
    nodes = [
        {
            "key": n.get("key"),
            **({"params": n["params"]} if isinstance(n.get("params"), dict) else {}),
            **({"reason": str(n["reason"])[:300]} if n.get("reason") else {}),
            **({"note": str(n["note"])[:600]} if n.get("note") else {}),
        }
        for n in raw_nodes
        if isinstance(n, dict) and n.get("key") in CATALOG_KEYS
    ][:25]
    if not nodes:
        raise AIGatewayError("The AI proposed zero known nodes — try rephrasing your request.")

    n_count = len(nodes)

    # 2. Edges: only valid index pairs within range, no self-loops
    edges = [
        [int(a), int(b)]
        for a, b in (e for e in (plan.get("edges") or []) if isinstance(e, (list, tuple)) and len(e) == 2)
        if isinstance(a, (int, float)) and isinstance(b, (int, float))
        and 0 <= int(a) < n_count and 0 <= int(b) < n_count and int(a) != int(b)
    ]

    # 3. Cycle rejection (Kahn's). If cyclic → replace with a linear chain.
    adj = {i: [] for i in range(n_count)}
    indeg = [0] * n_count
    for a, b in edges:
        adj[a].append(b)
        indeg[b] += 1
    queue = [i for i in range(n_count) if indeg[i] == 0]
    seen = 0
    while queue:
        cur = queue.pop()
        seen += 1
        for nxt in adj[cur]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                queue.append(nxt)
    if seen < n_count:
        edges = [[i, i + 1] for i in range(n_count - 1)]
    elif not edges:
        edges = [[i, i + 1] for i in range(n_count - 1)]

    # 4. Notes: only attach to existing node indices, bounded text
    notes = [
        {"attach": int(nt["attach"]), "text": str(nt.get("text", ""))[:600]}
        for nt in (plan.get("notes") or [])
        if isinstance(nt, dict) and isinstance(nt.get("attach"), (int, float))
        and 0 <= int(nt["attach"]) < n_count and str(nt.get("text", "")).strip()
    ][:10]

    summary = str(plan.get("summary") or "AI-designed workflow.")[:500]
    return {"summary": summary, "nodes": nodes, "edges": edges, "notes": notes}


def build_workflow_from_prompt(provider_row, user_prompt: str) -> dict:
    """Profile → LLM plan (strict JSON) → validate → return the proposal dict."""
    profile = profile_latest_dataset()

    catalog_lines = "\n".join(f"- {e['key']} ({e['title']}): {e['use']}" for e in CATALOG)

    # Explicitly inject the guessed target + task so the AI doesn't have to
    # read the profile JSON and guess which field maps to which parameter.
    target = profile["guessed_target"]
    task = profile["task_guess"]

    system_prompt = (
        "You are a senior ML engineer designing workflows for OpenML Flow, a visual ML pipeline builder.\n\n"
        f"DATASET PROFILE (real analysis — trust it completely):\n{json.dumps(profile, indent=2)}\n\n"
        f"AVAILABLE NODE KEYS:\n{catalog_lines}\n\n"
        "RULES:\n"
        "(1) ONLY include nodes this dataset actually needs — no missing-value nodes if there are "
        "no missing values; no datetime features without a date column; no SMOTE unless classification "
        "AND imbalanced.\n"
        f"(2) The chain starts with loadCSV. Order: load → EDA/clean → encode → trainTestSplit "
        f'(prefill its params: targetColumn="{target}", taskType="{task}") → imbalance/scaling AFTER '
        "the split → model → evaluation → save/deploy.\n"
        "(3) Every node's params MUST be a JSON object (use {} when none).\n"
        "(4) Give every node a short 'reason'; add 1-3 helpful 'notes'.\n"
        "(5) Respond with ONLY this JSON shape — no prose:\n"
        '{"summary": str, "nodes": [{"key": str, "params": {}, "reason": str, "note": str?}], '
        '"edges": [[from_index, to_index]], "notes": [{"attach": node_index, "text": str}]}\n'
        "Use at most 15 nodes."
    )

    base_url = (provider_row["base_url"] or "").strip()
    api_key = (provider_row["api_key"] or "").strip()
    model = (provider_row["model"] or "").strip()

    try:
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=90)
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=2000,
        )
        raw = response.choices[0].message.content or ""
    except AIGatewayError:
        raise
    except Exception as e:
        raise AIGatewayError(_map_provider_error(e, base_url, model)) from e

    return _validate_plan(_extract_json(raw))