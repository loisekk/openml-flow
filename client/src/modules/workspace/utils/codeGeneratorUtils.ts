// client/src/modules/workspace/utils/codeGeneratorUtils.ts
//
// SINGLE SOURCE OF TRUTH for all Python code generation.
//
// Consumers:
//   • hooks/useCodeGenerator.ts → buildWorkflowScript()   (full workflow, reactive)
//   • NodeStudio / executor     → generateSingleNodeCode() (single node, on click)
//
// Contains ZERO React code so it can be called from event handlers or tests.
//
// CHANGELOG (this revision):
//   • Feature Importance now emits a native __MLPIPE_CHART__ bar chart — the old
//     version still used matplotlib AFTER its import was removed (NameError risk).
//   • Added 'Histogram' and 'Scatter Plot' EDA nodes (JSON chart protocol, zero deps).
//   • Target Distribution + Correlation Matrix emit themed charts (kept from prev rev).
//   • dataCaptureBlock: missing/dtypes captured BEFORE NaN-fill; datetime → str;
//     default=str JSON safety net.
//   • resolveTargetTask uses pd.api.types.is_numeric_dtype (catches datetime/category).
//   • Class Weight wired into RF / LightGBM / SVM / Logistic Regression.
//   • Guards: Grid Search (non-tree), Feature Selection (0 features), Polynomial (0 features).
//   • Per-node __MLPIPE_NODE__ beacons for live canvas status.

import { Node, Edge } from 'reactflow';
import { MLNodeData, NodeParameter, normalizeTitle } from '../config/nodeRegistry';
import { useWorkflowStore } from '../store/workflowStore';
import { topologicalSort, getExecutionChain } from './graphUtils';

// Re-export for backwards compatibility (canonical home: nodeRegistry.ts)
export { normalizeTitle };

/* ═══════════════════════════ helpers ═══════════════════════════ */

const getParam = (node: Node<MLNodeData>, name: string, fallback: any = null): any => {
  const p = node.data.parameters?.find((param: NodeParameter) => param.name === name);
  if (p && p.default !== null && p.default !== undefined && p.default !== '') return p.default;
  return fallback;
};

/** Safe Python string literal (normalizes backslashes, escapes single quotes). */
const pyStr = (v: any): string =>
  "'" + String(v).replace(/\\/g, '/').replace(/'/g, "\\'") + "'";

const pyNum = (v: any, fallback: number): string => {
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : String(fallback);
};

/** null/blank → Python None, otherwise the number. */
const pyNumOrNull = (v: any): string => {
  if (v === null || v === undefined || v === '') return 'None';
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : 'None';
};

/** Injects class_weight into a model constructor call iff a Class Weight node ran upstream. */
const PY_CLASS_WEIGHT = "class_weight=CLASS_WEIGHT if 'CLASS_WEIGHT' in globals() else None";

/* ═══════════════════ per-node Python imports ═══════════════════ */

const MATPLOTLIB = 'import matplotlib\nmatplotlib.use("Agg")\nimport matplotlib.pyplot as plt';

const NODE_IMPORTS: Record<string, string[]> = {
  'Load Database': ['import sqlalchemy'],
  'Load REST API': ['import requests'],
  'Train/Test Split': ['from sklearn.model_selection import train_test_split'],
  'Stratified Split': ['from sklearn.model_selection import train_test_split'],
  'K-Fold CV': ['from sklearn.model_selection import KFold, cross_val_score'],
  'SMOTE': ['from imblearn.over_sampling import SMOTE'],
  'ADASYN': ['from imblearn.over_sampling import ADASYN'],
  'Standard Scaler': ['from sklearn.preprocessing import StandardScaler'],
  'MinMax Scaler': ['from sklearn.preprocessing import MinMaxScaler'],
  'Robust Scaler': ['from sklearn.preprocessing import RobustScaler'],
  'Label Encode': ['from sklearn.preprocessing import LabelEncoder'],
  'Polynomial Features': ['from sklearn.preprocessing import PolynomialFeatures'],
  'Feature Selection': ['from sklearn.feature_selection import SelectKBest, f_classif, f_regression'],
  'Random Forest': ['from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor'],
  'XGBoost': ['from xgboost import XGBClassifier, XGBRegressor'],
  'LightGBM': ['from lightgbm import LGBMClassifier, LGBMRegressor'],
  'SVM': ['from sklearn.svm import SVC, SVR'],
  'KNN': ['from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor'],
  'Logistic Regression': ['from sklearn.linear_model import LogisticRegression'],
  'Linear Regression': ['from sklearn.linear_model import LinearRegression'],
  'Grid Search': ['from sklearn.model_selection import GridSearchCV'],
  'Optuna': ['import optuna', 'from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor'],
  'SHAP Values': ['import shap', MATPLOTLIB],
  'Feature Importance': [], // native __MLPIPE_CHART__ protocol — no matplotlib needed
  'Accuracy/Precision': ['from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, r2_score, mean_absolute_error, mean_squared_error'],
  'Confusion Matrix': ['from sklearn.metrics import confusion_matrix', MATPLOTLIB],
  'ROC Curve': ['from sklearn.metrics import roc_auc_score, roc_curve', MATPLOTLIB],
  'Save Pipeline (.pkl)': ['import joblib'],
};

/* ═══════════════════ shared Python guards ═══════════════════ */

const DF_GUARD = `if 'df' not in globals():
    raise RuntimeError("No DataFrame found. Connect this node downstream of a data loading node (e.g. Load CSV).")
`;

const SPLIT_GUARD = `if 'X_train' not in globals():
    raise RuntimeError("This node needs train/test data. Add a 'Train/Test Split' node before it in the pipeline.")
`;

const MODEL_GUARD = `if 'model' not in globals():
    raise RuntimeError("This node needs a trained model. Connect it after a model node (e.g. Random Forest).")
`;

const XY_GUARD = `if 'X' not in globals() or 'y' not in globals():
    raise RuntimeError("This node needs X and y. Add a 'Train/Test Split' node before it.")
`;

/** Emitted by split nodes: validates target, builds X/y, resolves TASK_TYPE from 'auto'. */
const resolveTargetTask = (nodeTitle: string): string => `${DF_GUARD}if TARGET_COLUMN not in df.columns:
    raise ValueError(
        f"Target column '{TARGET_COLUMN}' not found in dataframe. Available: {list(df.columns)}. "
        f"Fix: open the '${nodeTitle}' node and set the 'Target Column' parameter."
    )
X = df.drop(columns=[TARGET_COLUMN])
y = df[TARGET_COLUMN]
_bad_cols = [c for c in X.columns if not pd.api.types.is_numeric_dtype(X[c])]
if _bad_cols:
    raise ValueError(
        f"Non-numeric columns still present: {_bad_cols}. "
        f"Add 'One-Hot Encode' (for text) or 'Datetime Features' (for dates) before this node."
    )
if TASK_TYPE == 'auto':
    _is_cls = (y.dtype == object) or (str(y.dtype) == 'category') or (y.nunique() <= 20)
    TASK_TYPE = 'classification' if _is_cls else 'regression'
print(f"Target: '{TARGET_COLUMN}' | Task: {TASK_TYPE}")
`;

/* ═══════════════════ per-node code templates ═══════════════════ */

export function buildNodeCode(node: Node<MLNodeData>): string {
  const title = node.data.title;
  const op = normalizeTitle(title); // legacy titles → current titles

  if (node.data.customCode && node.data.customCode.trim().length > 0) {
    return `# --- ${title} (custom code) ---\n${node.data.customCode}\n\n`;
  }

  switch (op) {
    /* ───────── 1. DATA LOADING ───────── */
    case 'Load CSV': {
      const fp = getParam(node, 'filePath');
      if (fp && fp !== 'data.csv') {
        return `# --- Load CSV ---
df = pd.read_csv(${pyStr(fp)})
print(f"Loaded CSV: {df.shape[0]} rows x {df.shape[1]} columns")

`;
      }
      return `# --- Load CSV (no file set: generating synthetic messy dataset) ---
np.random.seed(42)
df = pd.DataFrame({
    'age': np.random.normal(40, 10, 1000).tolist() + [200, -50, 300],
    'income': np.random.normal(50000, 15000, 1003).tolist(),
    'city': np.random.choice(['NY', 'LA', 'SF', 'CHI'], 1003).tolist(),
    'target': np.random.choice([0, 1], 1003).tolist()
})
df.loc[df.sample(100).index, 'income'] = np.nan
df = pd.concat([df, df.sample(50)], ignore_index=True)
print(f"Synthetic dataset generated: {df.shape[0]} rows")

`;
    }

    case 'Load JSON': {
      const fp = getParam(node, 'filePath');
      if (fp && fp !== 'data.json') {
        return `# --- Load JSON ---
df = pd.read_json(${pyStr(fp)})
print(f"Loaded JSON: {df.shape[0]} rows x {df.shape[1]} columns")

`;
      }
      return `# --- Load JSON (mock) ---
df = pd.DataFrame({'col1': [1, 2, 3], 'col2': [4, 5, 6]})
print("Mock JSON data loaded.")

`;
    }

    case 'Load Excel': {
      const fp = getParam(node, 'filePath');
      const sheet = getParam(node, 'sheetName', 'Sheet1');
      if (fp && fp !== 'data.xlsx') {
        return `# --- Load Excel ---
df = pd.read_excel(${pyStr(fp)}, sheet_name=${pyStr(sheet)})
print(f"Loaded Excel sheet ${pyStr(sheet)}: {df.shape[0]} rows")

`;
      }
      return `# --- Load Excel (no file set) ---
raise RuntimeError("Set the 'File Path' parameter on this Load Excel node.")

`;
    }

    case 'Load Database':
      return `# --- Load Database ---
DATABASE_URL = 'postgresql://user:pass@host:5432/db'
TABLE_NAME = 'table_name'
try:
    engine = sqlalchemy.create_engine(DATABASE_URL)
    df = pd.read_sql_table(TABLE_NAME, engine)
    print(f"Loaded {df.shape[0]} rows from table '{TABLE_NAME}'")
except Exception as e:
    raise RuntimeError(f"Database load failed: {e}. Edit DATABASE_URL / TABLE_NAME in this node's Code tab.")

`;

    case 'Load REST API': {
      const url = getParam(node, 'apiUrl', 'https://jsonplaceholder.typicode.com/users');
      return `# --- Load REST API ---
API_URL = ${pyStr(url)}
response = requests.get(API_URL, timeout=30)
response.raise_for_status()
df = pd.json_normalize(response.json())
print(f"Fetched {df.shape[0]} records from API")

`;
    }

    case 'Sample Dataset':
      return `# --- Sample Dataset (synthetic classification) ---
from sklearn.datasets import make_classification
X_synth, y_synth = make_classification(n_samples=1000, n_features=4, n_informative=2, n_redundant=0, random_state=42)
df = pd.DataFrame(X_synth, columns=['feat1', 'feat2', 'feat3', 'feat4'])
df['target'] = y_synth
print(f"Sample dataset loaded: {df.shape[0]} rows")

`;

    /* ───────── 2. EDA & INSPECTION ───────── */
    case 'View Info':
      return `${DF_GUARD}# --- EDA: Info ---
df.info()

`;

    case 'View Stats':
      return `${DF_GUARD}# --- EDA: Stats ---
print(df.describe())

`;

    case 'Missing Values':
      return `${DF_GUARD}# --- EDA: Missing Values Report ---
missing = df.isnull().sum()
missing = missing[missing > 0]
if missing.empty:
    print("No missing values found.")
else:
    print(missing)
    print(f"Columns with missing values: {len(missing)} / {df.shape[1]}")

`;

    case 'Data Preview': // legacy node kept alive for old saved workflows
      return `${DF_GUARD}# --- EDA: Data Preview ---
print(df.head())

`;

    case 'Target Distribution':
      return `${DF_GUARD}# --- EDA: Target Distribution ---
if TARGET_COLUMN in df.columns:
    _vc = df[TARGET_COLUMN].value_counts().head(15)
    print("__MLPIPE_CHART__::" + json.dumps({
        "type": "bar",
        "title": "Distribution of " + str(TARGET_COLUMN),
        "categories": [str(i) for i in _vc.index.tolist()],
        "values": [int(v) for v in _vc.values.tolist()]
    }))
    print(_vc)
else:
    print(f"Target '{TARGET_COLUMN}' not in columns. Available: {list(df.columns)}")

`;

    case 'Correlation Matrix':
      return `${DF_GUARD}# --- EDA: Correlation Matrix ---
_corr = df.corr(numeric_only=True)
_corr_cols = [str(c) for c in _corr.columns.tolist()]
if len(_corr_cols) > 50:
    print(f"Note: heatmap shows first 50 of {len(_corr_cols)} columns. Full matrix printed below.")
    _corr_view = _corr.iloc[:50, :50]
    _corr_cols = [str(c) for c in _corr_view.columns.tolist()]
else:
    _corr_view = _corr
print("__MLPIPE_CHART__::" + json.dumps({
    "type": "heatmap",
    "title": "Correlation Matrix",
    "columns": _corr_cols,
    "matrix": [[(None if np.isnan(v) else round(float(v), 3)) for v in _row] for _row in _corr_view.values.tolist()]
}))
print(_corr)

`;

    case 'Outlier Analysis (IQR)':
      return `${DF_GUARD}# --- EDA: Outlier Analysis (IQR) ---
_outlier_cols = [c for c in df.select_dtypes(include=np.number).columns if c != TARGET_COLUMN]
_total_outliers = 0
for col in _outlier_cols:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    count = ((df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)).sum()
    if count > 0:
        print(f"  {col}: {count} outliers ({count / len(df) * 100:.1f}%)")
        _total_outliers += count
print(f"Total outliers detected: {_total_outliers} across {len(_outlier_cols)} numeric columns")

`;

    case 'Histogram': {
      const colParam = getParam(node, 'columnName', 'auto');
      const bins = getParam(node, 'bins', 20);
      const colExpr = colParam && colParam !== 'auto' ? pyStr(colParam) : 'None';
      return `${DF_GUARD}# --- EDA: Histogram ---
HIST_COL = ${colExpr}
HIST_BINS = ${pyNum(bins, 20)}
# Auto mode: prefer the target column; fall back to first numeric column
if HIST_COL is None:
    HIST_COL = TARGET_COLUMN if TARGET_COLUMN in df.columns else None
if HIST_COL is None:
    _num_cols = [c for c in df.select_dtypes(include=np.number).columns]
    HIST_COL = _num_cols[0] if _num_cols else None
if HIST_COL is None:
    print("No numeric column found to plot a histogram.")
elif HIST_COL not in df.columns:
    print(f"Column '{HIST_COL}' not found. Available: {list(df.columns)}")
else:
    _series = pd.to_numeric(df[HIST_COL], errors='coerce').dropna()
    if _series.empty:
        print(f"Column '{HIST_COL}' has no numeric values to plot.")
    else:
        _counts, _edges = np.histogram(_series, bins=HIST_BINS)
        _labels = [f"{_edges[i]:.4g} to {_edges[i+1]:.4g}" for i in range(len(_counts))]
        print("__MLPIPE_CHART__::" + json.dumps({
            "type": "histogram",
            "title": "Distribution of " + str(HIST_COL),
            "column": str(HIST_COL),
            "categories": _labels,
            "values": [int(c) for c in _counts.tolist()]
        }))
        print(_series.describe())

`;
    }

    case 'Scatter Plot': {
      const xCol = getParam(node, 'xColumn', null);
      const yCol = getParam(node, 'yColumn', null);
      const xExpr = xCol ? pyStr(xCol) : 'None';
      const yExpr = yCol ? pyStr(yCol) : 'None';
      return `${DF_GUARD}# --- EDA: Scatter Plot ---
X_COL = ${xExpr}
Y_COL = ${yExpr}
_num_cols = [c for c in df.select_dtypes(include=np.number).columns if c != TARGET_COLUMN]
if Y_COL is None:
    Y_COL = TARGET_COLUMN if TARGET_COLUMN in df.columns else (_num_cols[-1] if _num_cols else None)
if X_COL is None:
    X_COL = _num_cols[0] if _num_cols else None
if X_COL and Y_COL and X_COL in df.columns and Y_COL in df.columns:
    _pts = df[[X_COL, Y_COL]].apply(pd.to_numeric, errors='coerce').dropna()
    if len(_pts) > 2000:
        _pts = _pts.sample(2000, random_state=42)
    print("__MLPIPE_CHART__::" + json.dumps({
        "type": "scatter",
        "title": str(Y_COL) + " vs " + str(X_COL),
        "xColumn": str(X_COL),
        "yColumn": str(Y_COL),
        "points": [[round(float(a), 6), round(float(b), 6)] for a, b in zip(_pts[X_COL], _pts[Y_COL])]
    }))
    print(f"Plotted {len(_pts)} points ({X_COL} vs {Y_COL}).")
else:
    _missing = [c for c in [X_COL, Y_COL] if c and c not in df.columns]
    print(f"Columns not found: {_missing}. Available: {list(df.columns)}")

`;
    }

    /* ───────── 3. DATA CLEANING ───────── */
    case 'Drop Duplicates':
      return `${DF_GUARD}# --- Cleaning: Drop Duplicates ---
print(f"Shape before duplicates: {df.shape}")
df = df.drop_duplicates()
print(f"Shape after duplicates: {df.shape}")

`;

    case 'Drop Nulls':
      return `${DF_GUARD}# --- Cleaning: Drop Nulls ---
print(f"Shape before nulls: {df.shape}")
df = df.dropna()
print(f"Shape after nulls: {df.shape}")

`;

    case 'Fill Missing (Mean)':
      return `${DF_GUARD}# --- Cleaning: Fill Missing (Mean + Mode) ---
for col in df.select_dtypes(include=np.number).columns:
    if df[col].isnull().any():
        df[col] = df[col].fillna(df[col].mean())
for col in df.select_dtypes(include='object').columns:
    if df[col].isnull().any():
        _mode = df[col].mode()
        df[col] = df[col].fillna(_mode[0] if not _mode.empty else 'Unknown')
print("Missing values filled (numeric: mean, categorical: mode).")

`;

    case 'Fill Missing (Median)':
      return `${DF_GUARD}# --- Cleaning: Fill Missing (Median + Mode) ---
for col in df.select_dtypes(include=np.number).columns:
    if df[col].isnull().any():
        df[col] = df[col].fillna(df[col].median())
for col in df.select_dtypes(include='object').columns:
    if df[col].isnull().any():
        _mode = df[col].mode()
        df[col] = df[col].fillna(_mode[0] if not _mode.empty else 'Unknown')
print("Missing values filled (numeric: median, categorical: mode).")

`;

    case 'Fix Data Types':
      return `${DF_GUARD}# --- Cleaning: Fix Data Types ---
for col in df.select_dtypes(include='object').columns:
    converted = pd.to_numeric(df[col], errors='coerce')
    if converted.notna().sum() >= df[col].notna().sum() * 0.95:
        df[col] = converted
        print(f"  Converted '{col}' to numeric")
print(df.dtypes)

`;

    case 'Cap Outliers (IQR)':
      return `${DF_GUARD}# --- Cleaning: Cap Outliers (IQR) ---
numeric_cols = [c for c in df.select_dtypes(include=np.number).columns if c != TARGET_COLUMN]
for col in numeric_cols:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    df[col] = np.clip(df[col], Q1 - 1.5 * IQR, Q3 + 1.5 * IQR)
print(f"Outliers capped in {len(numeric_cols)} columns (target excluded).")

`;

    /* ───────── 4. FEATURE ENGINEERING ───────── */
    case 'One-Hot Encode':
      return `${DF_GUARD}# --- Transform: One-Hot Encode ---
encode_cols = [c for c in df.select_dtypes(include='object').columns if c != TARGET_COLUMN]
skipped = [c for c in encode_cols if df[c].nunique() > 50]
encode_cols = [c for c in encode_cols if df[c].nunique() <= 50]
if skipped:
    print(f"Skipped high-cardinality columns (>50 unique values): {skipped}")
if encode_cols:
    df = pd.get_dummies(df, columns=encode_cols, drop_first=True)
    print(f"One-hot encoded {len(encode_cols)} columns: {encode_cols}")
else:
    print("No categorical columns to encode.")

`;

    case 'Label Encode':
      return `${DF_GUARD}# --- Transform: Label Encode ---
encode_cols = [c for c in df.select_dtypes(include='object').columns if c != TARGET_COLUMN]
for col in encode_cols:
    df[col] = LabelEncoder().fit_transform(df[col].astype(str))
print(f"Label encoded {len(encode_cols)} columns: {encode_cols}")

`;

    case 'Target Encode': // legacy node kept alive for old saved workflows
      return `${DF_GUARD}# --- Transform: Target Encode ---
if TARGET_COLUMN not in df.columns:
    raise ValueError(f"Target column '{TARGET_COLUMN}' not found. Available: {list(df.columns)}")
cat_cols = [c for c in df.select_dtypes(include='object').columns if c != TARGET_COLUMN]
for col in cat_cols:
    df[col] = df.groupby(col)[TARGET_COLUMN].transform('mean')
print(f"Target encoded {len(cat_cols)} columns: {cat_cols}")

`;

    case 'Log Transform':
      return `${DF_GUARD}# --- Transform: Log Transform ---
numeric_cols = [c for c in df.select_dtypes(include=np.number).columns if c != TARGET_COLUMN]
_transformed = 0
for col in numeric_cols:
    if (df[col] >= 0).all():
        df[col] = np.log1p(df[col])
        _transformed += 1
print(f"Log1p applied to {_transformed}/{len(numeric_cols)} numeric columns (negative-valued columns skipped; target excluded).")

`;

    case 'Datetime Features': {
      const dateCol = getParam(node, 'dateColumn', 'date');
      return `${DF_GUARD}# --- Feature Eng: Datetime Features ---
DATE_COL = ${pyStr(dateCol)}
if DATE_COL in df.columns:
    df[DATE_COL] = pd.to_datetime(df[DATE_COL], errors='coerce')
    for part in ['year', 'month', 'day', 'dayofweek']:
        df[DATE_COL + '_' + part] = getattr(df[DATE_COL].dt, part)
    df = df.drop(columns=[DATE_COL])
    print(f"Extracted datetime features from '{DATE_COL}': year, month, day, dayofweek")
else:
    print(f"Warning: date column '{DATE_COL}' not found. Set the 'Date Column' parameter. Available: {list(df.columns)}")

`;
    }

    case 'Polynomial Features': {
      const degree = getParam(node, 'degree', 2);
      return `${DF_GUARD}# --- Feature Eng: Polynomial Features ---
POLY_DEGREE = ${pyNum(degree, 2)}
feature_cols = [c for c in df.select_dtypes(include=np.number).columns if c != TARGET_COLUMN]
if not feature_cols:
    raise ValueError("No numeric feature columns found for polynomial expansion.")
poly = PolynomialFeatures(degree=POLY_DEGREE, include_bias=False)
poly_arr = poly.fit_transform(df[feature_cols])
poly_names = ['poly_' + str(n) for n in poly.get_feature_names_out(feature_cols)]
df = pd.concat([df.drop(columns=feature_cols), pd.DataFrame(poly_arr, columns=poly_names, index=df.index)], axis=1)
print(f"Created {len(poly_names)} polynomial features (degree {POLY_DEGREE}).")

`;
    }

    case 'Feature Selection': {
      const k = getParam(node, 'k', 5);
      return `${DF_GUARD}# --- Feature Eng: Feature Selection (SelectKBest) ---
if TARGET_COLUMN not in df.columns:
    raise ValueError(f"Target column '{TARGET_COLUMN}' not found. Available: {list(df.columns)}")
_y = df[TARGET_COLUMN]
_is_cls = (_y.dtype == object) or (str(_y.dtype) == 'category') or (_y.nunique() <= 20)
_score_fn = f_classif if _is_cls else f_regression
feature_cols = [c for c in df.select_dtypes(include=np.number).columns if c != TARGET_COLUMN]
if not feature_cols:
    raise ValueError("No numeric feature columns found to select from.")
k = min(${pyNum(k, 5)}, len(feature_cols))
selector = SelectKBest(_score_fn, k=k)
selector.fit(df[feature_cols], _y)
selected = [c for c, s in zip(feature_cols, selector.get_support()) if s]
df = df[selected + [TARGET_COLUMN]]
print(f"Selected {len(selected)}/{len(feature_cols)} features: {selected}")

`;
    }

    /* ───────── 5. SPLIT & VALIDATION ───────── */
    case 'Train/Test Split': {
      const testSize = getParam(node, 'testSize', 0.2);
      const randomState = getParam(node, 'randomState', 42);
      return `${resolveTargetTask(title)}# --- Train/Test Split ---
TEST_SIZE = ${pyNum(testSize, 0.2)}
RANDOM_STATE = ${pyNum(randomState, 42)}
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE)
print(f"Split done -> Train: {X_train.shape[0]} rows | Test: {X_test.shape[0]} rows")

`;
    }

    case 'Stratified Split': {
      const testSize = getParam(node, 'testSize', 0.2);
      const randomState = getParam(node, 'randomState', 42);
      return `${resolveTargetTask(title)}# --- Stratified Split ---
TEST_SIZE = ${pyNum(testSize, 0.2)}
RANDOM_STATE = ${pyNum(randomState, 42)}
if TASK_TYPE == 'classification':
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y)
    print("Stratified split done (target ratio preserved).")
else:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE)
    print("Warning: stratify requires a classification target. Used a regular split.")

`;
    }

    case 'K-Fold CV': {
      const nSplits = getParam(node, 'nSplits', 5);
      return `${MODEL_GUARD}${XY_GUARD}# --- K-Fold Cross Validation ---
kf = KFold(n_splits=${pyNum(nSplits, 5)}, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=kf)
print(f"K-Fold scores: {np.round(scores, 4)}")
print(f"Mean score: {scores.mean():.4f} (+/- {scores.std():.4f})")

`;
    }

    /* ───────── 6. IMBALANCE ───────── */
    case 'SMOTE':
      return `${SPLIT_GUARD}# --- SMOTE ---
if TASK_TYPE != 'classification':
    raise RuntimeError("SMOTE only works for classification tasks.")
X_train, y_train = SMOTE(random_state=42).fit_resample(X_train, y_train)
print(f"Train size after SMOTE: {X_train.shape[0]} rows")

`;

    case 'ADASYN':
      return `${SPLIT_GUARD}# --- ADASYN ---
if TASK_TYPE != 'classification':
    raise RuntimeError("ADASYN only works for classification tasks.")
X_train, y_train = ADASYN(random_state=42).fit_resample(X_train, y_train)
print(f"Train size after ADASYN: {X_train.shape[0]} rows")

`;

    case 'Class Weight':
      return `# --- Class Weight ---
CLASS_WEIGHT = 'balanced'
print("CLASS_WEIGHT = 'balanced'. It will be applied automatically by: Random Forest, LightGBM, SVM, Logistic Regression (classification).")

`;

    /* ───────── 7. PREPROCESSING ───────── */
    case 'Standard Scaler':
      return `${SPLIT_GUARD}# --- Standard Scaler ---
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)
print("Features scaled with StandardScaler (mean=0, var=1).")

`;

    case 'MinMax Scaler':
      return `${SPLIT_GUARD}# --- MinMax Scaler ---
scaler = MinMaxScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)
print("Features scaled to [0, 1] range.")

`;

    case 'Robust Scaler':
      return `${SPLIT_GUARD}# --- Robust Scaler ---
scaler = RobustScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)
print("Features scaled with RobustScaler (median/IQR).")

`;

    /* ───────── 8. MODELS (task-type aware) ───────── */
    case 'Random Forest': {
      const nEst = getParam(node, 'nEstimators', 100);
      const maxDepth = pyNumOrNull(getParam(node, 'maxDepth', null));
      const criterion = getParam(node, 'criterion', 'gini');
      return `${SPLIT_GUARD}# --- Model: Random Forest ---
if TASK_TYPE == 'classification':
    model = RandomForestClassifier(n_estimators=${pyNum(nEst, 100)}, criterion=${pyStr(criterion)}, max_depth=${maxDepth}, ${PY_CLASS_WEIGHT}, random_state=42)
else:
    model = RandomForestRegressor(n_estimators=${pyNum(nEst, 100)}, max_depth=${maxDepth}, random_state=42)
model.fit(X_train, y_train)
print(f"Random Forest ({TASK_TYPE}) trained on {X_train.shape[0]} samples.")

`;
    }

    case 'XGBoost': {
      const lr = getParam(node, 'learningRate', 0.1);
      const maxDepth = pyNumOrNull(getParam(node, 'maxDepth', 6));
      return `${SPLIT_GUARD}# --- Model: XGBoost ---
if TASK_TYPE == 'classification':
    model = XGBClassifier(learning_rate=${pyNum(lr, 0.1)}, max_depth=${maxDepth}, eval_metric='logloss', random_state=42)
else:
    model = XGBRegressor(learning_rate=${pyNum(lr, 0.1)}, max_depth=${maxDepth}, random_state=42)
model.fit(X_train, y_train)
print(f"XGBoost ({TASK_TYPE}) trained on {X_train.shape[0]} samples.")

`;
    }

    case 'LightGBM': {
      const nEst = getParam(node, 'nEstimators', 100);
      const numLeaves = getParam(node, 'numLeaves', 31);
      return `${SPLIT_GUARD}# --- Model: LightGBM ---
if TASK_TYPE == 'classification':
    model = LGBMClassifier(n_estimators=${pyNum(nEst, 100)}, num_leaves=${pyNum(numLeaves, 31)}, ${PY_CLASS_WEIGHT}, verbose=-1, random_state=42)
else:
    model = LGBMRegressor(n_estimators=${pyNum(nEst, 100)}, num_leaves=${pyNum(numLeaves, 31)}, verbose=-1, random_state=42)
model.fit(X_train, y_train)
print(f"LightGBM ({TASK_TYPE}) trained on {X_train.shape[0]} samples.")

`;
    }

    case 'SVM': {
      const kernel = getParam(node, 'kernel', 'rbf');
      const c = getParam(node, 'c', 1.0);
      return `${SPLIT_GUARD}# --- Model: SVM ---
if TASK_TYPE == 'classification':
    model = SVC(kernel=${pyStr(kernel)}, C=${pyNum(c, 1.0)}, ${PY_CLASS_WEIGHT}, random_state=42)
else:
    model = SVR(kernel=${pyStr(kernel)}, C=${pyNum(c, 1.0)})
model.fit(X_train, y_train)
print(f"SVM ({TASK_TYPE}) trained.")

`;
    }

    case 'KNN': {
      const n = getParam(node, 'nNeighbors', 5);
      return `${SPLIT_GUARD}# --- Model: KNN ---
if TASK_TYPE == 'classification':
    model = KNeighborsClassifier(n_neighbors=${pyNum(n, 5)})
else:
    model = KNeighborsRegressor(n_neighbors=${pyNum(n, 5)})
model.fit(X_train, y_train)
print(f"KNN ({TASK_TYPE}) trained.")

`;
    }

    case 'Logistic Regression':
      return `${SPLIT_GUARD}# --- Model: Logistic Regression ---
if TASK_TYPE != 'classification':
    raise RuntimeError("Logistic Regression is for classification. For a numeric target use the 'Linear Regression' node.")
model = LogisticRegression(max_iter=1000, ${PY_CLASS_WEIGHT})
model.fit(X_train, y_train)
print("Logistic Regression trained.")

`;

    case 'Linear Regression':
      return `${SPLIT_GUARD}# --- Model: Linear Regression ---
if TASK_TYPE != 'regression':
    raise RuntimeError("Linear Regression is for numeric targets. For classification use the 'Logistic Regression' node.")
model = LinearRegression()
model.fit(X_train, y_train)
print("Linear Regression trained.")

`;

    /* ───────── 9. TUNING ───────── */
    case 'Grid Search':
      return `${SPLIT_GUARD}${MODEL_GUARD}# --- Tuning: Grid Search ---
if not hasattr(model, 'n_estimators'):
    raise RuntimeError("The default Grid Search grid (n_estimators/max_depth) fits tree ensembles (Random Forest/XGBoost/LightGBM). For other models, open this node's Code tab and edit param_grid.")
param_grid = {'n_estimators': [50, 100], 'max_depth': [None, 10]}
grid_search = GridSearchCV(model, param_grid, cv=3, n_jobs=-1)
grid_search.fit(X_train, y_train)
model = grid_search.best_estimator_
print(f"Best params: {grid_search.best_params_}")

`;

    case 'Optuna':
      return `${SPLIT_GUARD}# --- Tuning: Optuna ---
optuna.logging.set_verbosity(optuna.logging.WARNING)
def _objective(trial):
    n_est = trial.suggest_int('n_estimators', 50, 200)
    depth = trial.suggest_int('max_depth', 2, 32)
    if TASK_TYPE == 'classification':
        m = RandomForestClassifier(n_estimators=n_est, max_depth=depth, random_state=42)
    else:
        m = RandomForestRegressor(n_estimators=n_est, max_depth=depth, random_state=42)
    m.fit(X_train, y_train)
    return m.score(X_test, y_test)
study = optuna.create_study(direction='maximize')
study.optimize(_objective, n_trials=5)
print(f"Optuna best score: {study.best_value:.4f} | params: {study.best_params}")

`;

    /* ───────── 10. EXPLAINABILITY ───────── */
    case 'SHAP Values':
      return `${MODEL_GUARD}# --- Explainability: SHAP ---
try:
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test)
    plt.figure()
    shap.summary_plot(shap_values, X_test, show=False)
    plt.savefig('shap_summary.png', dpi=100, bbox_inches='tight')
    plt.close()
    print("SHAP summary saved to shap_summary.png")
except Exception as e:
    print(f"SHAP failed (tree models work best): {e}")

`;

    case 'Feature Importance':
      return `${MODEL_GUARD}# --- Explainability: Feature Importance ---
try:
    importances = model.feature_importances_
except AttributeError:
    raise RuntimeError("This model has no 'feature_importances_' (Linear/Logistic don't). Use a tree model like Random Forest.")
feat_names = list(X_train.columns) if hasattr(X_train, 'columns') else [f'feature_{i}' for i in range(X_train.shape[1])]
_pairs = sorted(zip(feat_names, importances), key=lambda t: t[1], reverse=True)[:15][::-1]
print("__MLPIPE_CHART__::" + json.dumps({
    "type": "bar",
    "title": "Feature Importance (top 15)",
    "categories": [str(p[0]) for p in _pairs],
    "values": [round(float(p[1]), 4) for p in _pairs]
}))
for name, imp in sorted(zip(feat_names, importances), key=lambda t: t[1], reverse=True)[:10]:
    print(f"  {name}: {imp:.4f}")

`;

    /* ───────── 11. EVALUATION (task-type aware) ───────── */
    case 'Accuracy/Precision':
      return `${MODEL_GUARD}${SPLIT_GUARD}# --- Evaluation: Metrics ---
predictions = model.predict(X_test)
if TASK_TYPE == 'classification':
    acc = accuracy_score(y_test, predictions)
    prec = precision_score(y_test, predictions, average='weighted', zero_division=0)
    rec = recall_score(y_test, predictions, average='weighted', zero_division=0)
    f1 = f1_score(y_test, predictions, average='weighted', zero_division=0)
    cm = confusion_matrix(y_test, predictions).tolist()
    print(f"Accuracy: {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f}")
    metrics_payload = {"accuracy": float(acc), "precision": float(prec), "recall": float(rec), "f1": float(f1), "confusion_matrix": cm, "task_type": TASK_TYPE}
else:
    r2 = r2_score(y_test, predictions)
    mae = mean_absolute_error(y_test, predictions)
    rmse = float(np.sqrt(mean_squared_error(y_test, predictions)))
    print(f"R2: {r2:.4f} | MAE: {mae:.4f} | RMSE: {rmse:.4f}")
    metrics_payload = {"r2": float(r2), "mae": float(mae), "rmse": rmse, "task_type": TASK_TYPE}
print("__MLPIPE_METRICS__::" + json.dumps(metrics_payload, default=str))

`;

    case 'Confusion Matrix':
      return `${MODEL_GUARD}${SPLIT_GUARD}# --- Evaluation: Confusion Matrix ---
if TASK_TYPE != 'classification':
    raise RuntimeError("Confusion Matrix is for classification. For regression use the 'Accuracy/Precision' node.")
cm = confusion_matrix(y_test, model.predict(X_test))
plt.figure(figsize=(8, 6))
plt.imshow(cm, cmap='Blues')
plt.colorbar()
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('Actual')
_thresh = cm.max() / 2
for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        plt.text(j, i, str(cm[i, j]), ha='center', color='white' if cm[i, j] > _thresh else 'black')
plt.tight_layout()
plt.savefig('confusion_matrix.png', dpi=100)
plt.close()
print("Confusion matrix saved to confusion_matrix.png")
print("__MLPIPE_METRICS__::" + json.dumps({"confusion_matrix": cm.tolist()}, default=str))

`;

    case 'ROC Curve':
      return `${MODEL_GUARD}${SPLIT_GUARD}# --- Evaluation: ROC Curve ---
if TASK_TYPE != 'classification':
    raise RuntimeError("ROC Curve is for classification only.")
try:
    y_proba = model.predict_proba(X_test)[:, 1]
    roc_auc = roc_auc_score(y_test, y_proba)
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    plt.figure()
    plt.plot(fpr, tpr, label=f'ROC (AUC = {roc_auc:.4f})')
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve')
    plt.legend()
    plt.savefig('roc_curve.png', dpi=100)
    plt.close()
    print(f"ROC-AUC: {roc_auc:.4f} (saved roc_curve.png)")
    print("__MLPIPE_METRICS__::" + json.dumps({"roc_auc": float(roc_auc)}, default=str))
except Exception as e:
    print(f"ROC-AUC failed (needs binary classification): {e}")

`;

    /* ───────── 12. MODEL MANAGEMENT & DEPLOYMENT ───────── */
    case 'Save Pipeline (.pkl)':
      return `${MODEL_GUARD}# --- Save Pipeline ---
artifact = {'model': model, 'target_column': TARGET_COLUMN, 'task_type': TASK_TYPE}
if hasattr(X_train, 'columns'):
    artifact['feature_columns'] = list(X_train.columns)
joblib.dump(artifact, 'model.pkl')
print("Model saved to model.pkl (with target/task metadata).")

`;

    case 'MLflow Log':
      return `${MODEL_GUARD}# --- MLflow Logging ---
try:
    import mlflow.sklearn
    with mlflow.start_run(run_name='openml-flow-pipeline'):
        mlflow.log_param('target_column', TARGET_COLUMN)
        mlflow.log_param('task_type', TASK_TYPE)
        mlflow.sklearn.log_model(model, 'model')
        print(f"MLflow run complete. Run ID: {mlflow.active_run().info.run_id}")
except ImportError:
    raise RuntimeError("mlflow is not installed. Go to Settings -> Environment and install 'mlflow'.")

`;

    case 'Generate FastAPI':
      return `${MODEL_GUARD}# --- Deployment: Generate FastAPI ---
api_code = '''
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(title="OpenML Flow Model API")
bundle = joblib.load("model.pkl")
model = bundle["model"]
feature_columns = bundle.get("feature_columns")

class PredictRequest(BaseModel):
    rows: list[dict]

@app.post("/predict")
def predict(req: PredictRequest):
    df = pd.DataFrame(req.rows)
    if feature_columns:
        df = df.reindex(columns=feature_columns, fill_value=0)
    preds = model.predict(df)
    return {"predictions": [float(p) if isinstance(p, (int, float)) else str(p) for p in preds]}
'''
with open('model_api.py', 'w') as f:
    f.write(api_code)
print("Generated model_api.py. Run it with: uvicorn model_api:app --port 8000")

`;

    case 'Export Python':
      return `${DF_GUARD}# --- Export Final Dataset ---
df.to_csv('pipeline_output.csv', index=False)
print(f"Final dataset exported to pipeline_output.csv ({df.shape[0]} rows x {df.shape[1]} cols)")

`;

    default:
      return `# --- ${title} (no code template registered) ---
print("Executing ${title}...")

`;
  }
}

/* ═══════════════════ script assembly ═══════════════════ */

export interface BuildScriptOptions {
  note?: string;
}

const dataCaptureBlock = (): string => `# --- Final Data Preview Capture (used by the UI Data tab) ---
try:
    if 'df' in globals():
        df_clean = df.copy()
        for _c in df_clean.columns:
            if pd.api.types.is_datetime64_any_dtype(df_clean[_c]):
                df_clean[_c] = df_clean[_c].astype(str)
        _dtypes = [str(t) for t in df_clean.dtypes]
        _missing = df_clean.isnull().sum().tolist()
        df_clean = df_clean.replace([np.inf, -np.inf], np.nan)
        df_clean = df_clean.astype(object).where(df_clean.notna(), "NaN")
        data_payload = {
            "columns": df_clean.columns.tolist(),
            "dtypes": _dtypes,
            "head": df_clean.head(50).values.tolist(),
            "shape": list(df_clean.shape),
            "missing": _missing
        }
        print("__MLPIPE_DATA__::" + json.dumps(data_payload, default=str))
except Exception as e:
    print(f"Failed to capture data preview: {e}")

print("Pipeline finished.")
`;

/** Builds a complete, executable Python script from an ALREADY topologically-sorted node list. */
export function buildScript(orderedNodes: Node<MLNodeData>[], options: BuildScriptOptions = {}): string {
  if (orderedNodes.length === 0) return '# Add nodes to generate code';

  // 1. Aggregate imports (base + per-node; legacy titles normalized first)
  const imports = new Set<string>(['import pandas as pd', 'import numpy as np', 'import json']);
  orderedNodes.forEach((n) => {
    (NODE_IMPORTS[normalizeTitle(n.data.title)] ?? []).forEach((imp) => imports.add(imp));
  });

  // 2. Resolve TARGET_COLUMN / TASK_TYPE from the first node that defines them
  let targetCol = 'target';
  let taskType = 'auto';
  for (const n of orderedNodes) {
    const t = getParam(n, 'targetColumn');
    if (t) { targetCol = String(t); break; }
  }
  for (const n of orderedNodes) {
    const t = getParam(n, 'taskType');
    if (t && t !== 'auto') { taskType = String(t); break; }
  }

  // 3. Build body with numbered section headers + live status beacons
  let body = '';
  orderedNodes.forEach((n, i) => {
    body += `# ===== [${i + 1}/${orderedNodes.length}] ${n.data.title} =====\n`;
    body += `print("__MLPIPE_NODE__::" + json.dumps({"id": ${pyStr(n.id)}, "title": ${pyStr(n.data.title)}}))\n`;
    body += buildNodeCode(n);
  });

  // 4. Assemble
  const header = `# Auto-generated by OpenML Flow\n${options.note ? `# ${options.note}\n` : ''}`;
  const config = `# --- Pipeline Config ---\nTARGET_COLUMN = ${pyStr(targetCol)}\nTASK_TYPE = ${pyStr(taskType)}  # 'auto' | 'classification' | 'regression'\n\n`;

  return `${header}\n${Array.from(imports).join('\n')}\n\n\n${config}${body}${dataCaptureBlock()}`;
}

/* ═══════════════════ public entry points ═══════════════════ */

/** FULL workflow script (topologically sorted). Used by the useCodeGenerator hook. */
export function buildWorkflowScript(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) return '# Add nodes to generate code';
  const ordered = topologicalSort(nodes, edges) as Node<MLNodeData>[];
  return buildScript(ordered, { note: 'Full workflow (topological order)' });
}

/** Script for running ONE node plus its entire upstream chain (fixes the df/pd NameError bug). */
export function generateNodeChainScript(targetNodeId: string, nodes: Node[], edges: Edge[]): string {
  const chain = getExecutionChain(targetNodeId, nodes, edges) as Node<MLNodeData>[];
  if (chain.length === 0) return '# Node not found';
  const target = chain[chain.length - 1];
  const upstream = chain.length - 1;
  const note = upstream > 0
    ? `Single-node run: "${target.data.title}" (auto-includes ${upstream} upstream node${upstream > 1 ? 's' : ''})`
    : `Single-node run: "${target.data.title}" (no upstream nodes connected)`;
  return buildScript(chain, { note });
}

/**
 * Backwards-compatible wrapper — SAME signature as your old util.
 * Reads the latest graph from the store at call time (safe inside stale closures).
 */
export function generateSingleNodeCode(node: Node<MLNodeData>): string {
  if (!node) return '# Select a node';
  const { nodes, edges } = useWorkflowStore.getState();
  return generateNodeChainScript(node.id, nodes, edges);
}