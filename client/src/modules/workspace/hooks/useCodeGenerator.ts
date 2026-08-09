import { Node } from 'reactflow';
import { useWorkflowStore } from '../store/workflowStore';
import { MLNodeData } from '../config/nodeRegistry';

// Helper function to generate code for a single node
function getNodeCode(node: Node<MLNodeData>): string {
  const op = node.data.title; 
  // FIX: Read filePath from parameters array instead of node.data.filePath
  const filePathParam = node.data.parameters.find((p: any) => p.name === 'filePath');
  const filePath = filePathParam ? filePathParam.default : null;
  const customCode = node.data.customCode;

  if (customCode) {
    return `# Custom Code for ${op}\n${customCode}\n\n`;
  }

  switch(op) {
    // 1. Data Loading
    case 'Load CSV':
      if (filePath && filePath !== 'data.csv') {
        return `# Load CSV\ndf = pd.read_csv(r'${filePath}')\n\n`;
      } else {
        return `# Load Data (Generating Synthetic Messy Dataset: 1000 rows)\nnp.random.seed(42)\ndf = pd.DataFrame({\n    'age': np.random.normal(40, 10, 1000).tolist() + [200, -50, 300],\n    'income': np.random.normal(50000, 15000, 1003).tolist(),\n    'city': np.random.choice(['NY', 'LA', 'SF', 'CHI'], 1003).tolist(),\n    'target': np.random.choice([0, 1], 1003).tolist()\n})\n# Inject missing values and duplicates to make it messy\ndf.loc[df.sample(100).index, 'income'] = np.nan\ndf = pd.concat([df, df.sample(50)], ignore_index=True)\n\n`;
      }
    case 'Load JSON':
      if (filePath && filePath !== 'data.json') {
        return `# Load JSON\ndf = pd.read_json(r'${filePath}')\n\n`;
      } else {
        return `# Load JSON (Mock)\ndf = pd.DataFrame({'col1': [1, 2, 3], 'col2': [4, 5, 6]})\n\n`;
      }
    case 'Load Database':
      return `# Load DB\nengine = sqlalchemy.create_engine('postgresql://user:pass@host:5432/db')\ndf = pd.read_sql_table('table_name', engine)\n\n`;
    case 'Sample Dataset':
      return `# Load Sample Dataset\nfrom sklearn.datasets import make_classification\nX, y = make_classification(n_samples=1000, n_features=4, n_informative=2, n_redundant=0, random_state=42)\ndf = pd.DataFrame(X, columns=['feat1', 'feat2', 'feat3', 'feat4'])\ndf['target'] = y\nprint(f"Loaded sample dataset with shape: {df.shape}")\n\n`;

    // 2. EDA & Inspection
    case 'View Info': return `# EDA: Info\nprint(df.info())\n\n`;
    case 'View Stats': return `# EDA: Stats\nprint(df.describe())\n\n`;
    case 'Missing Value Report': return `# EDA: Missing Values\nprint(df.isnull().sum())\n\n`;
    case 'Data Preview': return `# EDA: Data Preview\nprint(df.head())\n\n`;

    // 3. Data Cleaning
    case 'Drop Duplicates': return `# Cleaning: Drop Duplicates\nprint(f"Shape before duplicates: {df.shape}")\ndf = df.drop_duplicates()\nprint(f"Shape after duplicates: {df.shape}")\n\n`;
    case 'Drop Nulls': return `# Cleaning: Drop Nulls\nprint(f"Shape before nulls: {df.shape}")\ndf = df.dropna()\nprint(f"Shape after nulls: {df.shape}")\n\n`;
    case 'Fill Missing Values': return `# Cleaning: Fill Missing Values\nfor col in df.select_dtypes(include=np.number).columns:\n    df[col] = df[col].fillna(df[col].mean())\nfor col in df.select_dtypes(include='object').columns:\n    df[col] = df[col].fillna(df[col].mode()[0])\nprint("Missing values filled successfully.")\n\n`;
    case 'Cap Outliers (IQR)': return `# Cleaning: Cap Outliers (IQR Method)\nnumeric_cols = df.select_dtypes(include=np.number).columns\nfor col in numeric_cols:\n    if col != 'target':\n        Q1 = df[col].quantile(0.25)\n        Q3 = df[col].quantile(0.75)\n        IQR = Q3 - Q1\n        lower_bound = Q1 - 1.5 * IQR\n        upper_bound = Q3 + 1.5 * IQR\n        df[col] = np.clip(df[col], lower_bound, upper_bound)\nprint("Outliers capped successfully.")\n\n`;

    // 4. Feature Engineering
    case 'Datetime Features': return `# Feature Eng: Datetime Features\nprint("Datetime features extracted (uncomment if date column exists).")\n\n`;
    case 'Log Transform': return `# Transform: Log Transform (on numeric columns)\nnumeric_cols = df.select_dtypes(include=np.number).columns\nfor col in numeric_cols:\n    if col != 'target':\n        df[col] = np.log1p(df[col])\nprint("Log transform applied successfully.")\n\n`;
    case 'One-Hot Encode': return `# Transform: One-Hot Encode\ndf = pd.get_dummies(df, drop_first=True)\nprint("One-hot encoding applied successfully.")\n\n`;
    case 'Target Encode': return `# Transform: Target Encoding (for categorical columns)\ncat_cols = df.select_dtypes(include='object').columns\nfor col in cat_cols:\n    df[col] = df.groupby(col)['target'].transform('mean')\nprint("Target encoding applied successfully.")\n\n`;
    case 'Feature Selection': return `# Feature Eng: Feature Selection (SelectKBest)\nfrom sklearn.feature_selection import SelectKBest, f_classif\nX_temp = df.drop('target', axis=1)\ny_temp = df['target']\nselector = SelectKBest(f_classif, k=min(5, X_temp.shape[1]))\nX_new = selector.fit_transform(X_temp, y_temp)\nselected_cols = X_temp.columns[selector.get_support()]\ndf = df[list(selected_cols) + ['target']]\nprint(f"Selected features: {selected_cols.tolist()}")\n\n`;

    // 5. Split & Prep
    case 'Train/Test Split': return `# Train/Test Split\nX = df.drop('target', axis=1)\ny = df['target']\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\nprint(f"Train size: {X_train.shape}, Test size: {X_test.shape}")\n\n`;
    case 'SMOTE Imbalance': return `# SMOTE Imbalance\nfrom imblearn.over_sampling import SMOTE\nsmote = SMOTE(random_state=42)\nX_train, y_train = smote.fit_resample(X_train, y_train)\nprint(f"Train size after SMOTE: {X_train.shape}")\n\n`;
    case 'Column Transformer': return `# Preprocess: Column Transformer (Mock)\nfrom sklearn.preprocessing import StandardScaler\nscaler = StandardScaler()\nX_train = scaler.fit_transform(X_train)\nX_test = scaler.transform(X_test)\nprint("Data scaled and preprocessed.")\n\n`;

    // 6. Modeling
    case 'Train Random Forest': return `# Model: Random Forest\nmodel = RandomForestClassifier(random_state=42)\nmodel.fit(X_train, y_train)\nprint("Random Forest model trained successfully.")\n\n`;
    case 'Train XGBoost': return `# Model: XGBoost\nmodel = XGBClassifier(use_label_encoder=False, eval_metric='logloss')\nmodel.fit(X_train, y_train)\nprint("XGBoost model trained successfully.")\n\n`;
    case 'Train Logistic Reg': return `# Model: Logistic Regression\nfrom sklearn.linear_model import LogisticRegression\nmodel = LogisticRegression()\nmodel.fit(X_train, y_train)\nprint("Logistic Regression model trained successfully.")\n\n`;
    case 'Train Linear Reg': return `# Model: Linear Regression\nfrom sklearn.linear_model import LinearRegression\nmodel = LinearRegression()\nmodel.fit(X_train, y_train)\nprint("Linear Regression model trained successfully.")\n\n`;

    // 7. Evaluation (PHASE 8 UPDATED)
    case 'Accuracy/Precision':
      return `# Evaluation: Metrics
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import json
predictions = model.predict(X_test)
acc = accuracy_score(y_test, predictions)
prec = precision_score(y_test, predictions, average='weighted', zero_division=0)
rec = recall_score(y_test, predictions, average='weighted', zero_division=0)
f1 = f1_score(y_test, predictions, average='weighted', zero_division=0)
cm = confusion_matrix(y_test, predictions).tolist()

print(f"Accuracy: {acc:.4f}")
print(f"Precision: {prec:.4f}")
print(f"Recall: {rec:.4f}")
print(f"F1 Score: {f1:.4f}")

metrics_payload = {
    "accuracy": float(acc),
    "precision": float(prec),
    "recall": float(rec),
    "f1": float(f1),
    "confusion_matrix": cm
}
print("__MLPIPE_METRICS__::" + json.dumps(metrics_payload))
\n`;
    case 'Confusion Matrix':
      return `# Evaluation: Confusion Matrix\nfrom sklearn.metrics import confusion_matrix\nimport matplotlib.pyplot as plt\nimport seaborn as sns\ncm = confusion_matrix(y_test, predictions)\nsns.heatmap(cm, annot=True, fmt='d')\nplt.title('Confusion Matrix')\nplt.show()\n\n`;
    case 'ROC-AUC':
      return `# Evaluation: ROC-AUC
from sklearn.metrics import roc_auc_score
import json
try:
    roc_auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    print(f"ROC-AUC Score: {roc_auc:.4f}")
    
    metrics_payload = {"roc_auc": float(roc_auc)}
    print("__MLPIPE_METRICS__::" + json.dumps(metrics_payload))
except Exception as e:
    print(f"ROC-AUC calculation failed: {e}")
\n`;

    // 8. Explainability
    case 'SHAP Explainability': return `# Explainability: SHAP\nimport shap\nexplainer = shap.TreeExplainer(model)\nshap_values = explainer.shap_values(X_test)\nshap.summary_plot(shap_values, X_test)\n\n`;
    case 'Feature Importance': return `# Explainability: Feature Importance\nimport matplotlib.pyplot as plt\nimport numpy as np\nimportances = model.feature_importances_\nindices = np.argsort(importances)[::-1]\nplt.figure()\nplt.title("Feature Importances")\nplt.bar(range(X_train.shape[1]), importances[indices], align="center")\nplt.show()\n\n`;

    // 9. Tuning
    case 'Grid Search': return `# Tuning: Grid Search\nfrom sklearn.model_selection import GridSearchCV\nparam_grid = {'n_estimators': [50, 100], 'max_depth': [None, 10]}\ngrid_search = GridSearchCV(model, param_grid, cv=3)\ngrid_search.fit(X_train, y_train)\nmodel = grid_search.best_estimator_\nprint(f"Best params: {grid_search.best_params_}")\n\n`;
    case 'Optuna Tune': return `# Tuning: Optuna\nimport optuna\ndef objective(trial):\n    n_estimators = trial.suggest_int('n_estimators', 50, 200)\n    max_depth = trial.suggest_int('max_depth', 2, 32)\n    model_temp = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)\n    model_temp.fit(X_train, y_train)\n    return accuracy_score(y_test, model_temp.predict(X_test))\nstudy = optuna.create_study(direction='maximize')\nstudy.optimize(objective, n_trials=5)\nprint(f"Best trial score: {study.best_value}")\n\n`;

    // 10. Deployment
    case 'Save Pipeline (.pkl)': return `# Save Pipeline\nimport joblib\njoblib.dump(model, 'model.pkl')\nprint("Model saved to model.pkl")\n\n`;
    case 'Deploy FastAPI': return `# Deploy FastAPI (Mock)\nprint("FastAPI deployment code generated. Run 'uvicorn api:app' to serve.")\n\n`;

    default: return `# ${op}\nprint("Executing ${op}...")\n\n`;
  }
}

// The hook that React components will use
export function useCodeGenerator(): string {
  const nodes = useWorkflowStore((state) => state.nodes);

  if (nodes.length === 0) return "# Add nodes to generate code";

  const imports = new Set<string>(['import pandas as pd', 'import numpy as np']);
  let body = '';

  nodes.forEach((node) => {
    const typedNode = node as Node<MLNodeData>;
    const codeBlock = getNodeCode(typedNode);
    body += codeBlock;

    if (typedNode.data.title === 'Load Database') imports.add('import sqlalchemy');
    if (typedNode.data.title === 'Train/Test Split') imports.add('from sklearn.model_selection import train_test_split');
    if (typedNode.data.title === 'Train Random Forest') imports.add('from sklearn.ensemble import RandomForestClassifier');
    if (typedNode.data.title === 'Train XGBoost') imports.add('from xgboost import XGBClassifier');
  });

  body += `print("\\nPipeline steps completed.")\n\n`;
  
  // PHASE 7: DATA CAPTURE BLOCK
  body += `import json\n`;
  body += `try:\n`;
  body += `    if 'df' in locals():\n`;
  body += `        df_clean = df.replace([np.inf, -np.inf], np.nan).fillna("NaN")\n`;
  body += `        data_payload = {\n`;
  body += `            "columns": df_clean.columns.tolist(),\n`;
  body += `            "dtypes": [str(t) for t in df_clean.dtypes],\n`;
  body += `            "head": df_clean.head(50).values.tolist(),\n`;
  body += `            "shape": list(df_clean.shape),\n`;
  body += `            "missing": df_clean.isnull().sum().tolist()\n`;
  body += `        }\n`;
  body += `        print("__MLPIPE_DATA__::" + json.dumps(data_payload))\n`;
  body += `except Exception as e:\n`;
  body += `    print(f"Failed to capture data preview: {e}")\n`;

  return `# Auto-generated by open-mlpipe Visual Studio\n${Array.from(imports).join('\n')}\n\n${body}`;
}