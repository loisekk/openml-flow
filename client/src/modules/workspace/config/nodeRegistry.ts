// client/src/modules/workspace/config/nodeRegistry.ts

import type { Node } from 'reactflow';

export interface NodeParameter {
  name: string;
  label: string;
  type: 'string' | 'number' | 'select' | 'boolean';
  default: any;
  options?: string[];
}

export interface MLNodeData {
  title: string;
  category: string;
  icon: string;
  color: string;
  description: string;
  inputs: string[];
  outputs: string[];
  parameters: NodeParameter[];
  dependencies?: string[];
  status?: 'idle' | 'running' | 'success' | 'error';
  progress?: number;
  customCode?: string;
  filePath?: string;
}

const node = (
  title: string,
  category: string,
  icon: string,
  color: string,
  description: string,
  inputs: string[],
  outputs: string[],
  parameters: NodeParameter[] = [],
  dependencies: string[] = []
): MLNodeData => ({
  title, category, icon, color, description, inputs, outputs, parameters, dependencies
});

export const nodeRegistry: Record<string, MLNodeData> = {
  // --- DATA LOADING (Blue) ---
  loadCSV: node('Load CSV', 'Data Loading', '📄', '#3B82F6', 'Load dataset from CSV file', [], ['DataFrame'], [
    { name: 'filePath', label: 'File Path', type: 'string', default: 'data.csv' }
  ]),
  loadJSON: node('Load JSON', 'Data Loading', '📜', '#3B82F6', 'Load dataset from JSON file', [], ['DataFrame'], [
    { name: 'filePath', label: 'File Path', type: 'string', default: 'data.json' }
  ]),
  loadExcel: node('Load Excel', 'Data Loading', '📗', '#3B82F6', 'Load dataset from Excel sheet', [], ['DataFrame'], [
    { name: 'filePath', label: 'File Path', type: 'string', default: 'data.xlsx' },
    { name: 'sheetName', label: 'Sheet Name', type: 'string', default: 'Sheet1' }
  ], ['openpyxl']),
  loadDatabase: node('Load Database', 'Data Loading', '🗄️', '#3B82F6', 'Load data via SQL connection', [], ['DataFrame'], [], ['sqlalchemy']),
  loadAPI: node('Load REST API', 'Data Loading', '🌐', '#3B82F6', 'Fetch data from web API', [], ['DataFrame'], [
    { name: 'apiUrl', label: 'API URL', type: 'string', default: 'https://jsonplaceholder.typicode.com/users' }
  ], ['requests']),
  sampleDataset: node('Sample Dataset', 'Data Loading', '🎲', '#3B82F6', 'Generate synthetic mock data', [], ['DataFrame']),

  // --- EDA & INSPECTION (Cyan) ---
  viewInfo: node('View Info', 'EDA & Inspection', 'ℹ️', '#06B6D4', 'Display DataFrame schema & memory', ['DataFrame'], ['DataFrame']),
  viewStats: node('View Stats', 'EDA & Inspection', '📊', '#06B6D4', 'Show descriptive statistics', ['DataFrame'], ['DataFrame']),
  missingValues: node('Missing Values', 'EDA & Inspection', '❓', '#06B6D4', 'Analyze missing data count', ['DataFrame'], ['DataFrame']),
  targetDist: node('Target Distribution', 'EDA & Inspection', '🎯', '#06B6D4', 'Check target variable balance', ['DataFrame'], ['DataFrame']),
  corrMatrix: node('Correlation Matrix', 'EDA & Inspection', '🧩', '#06B6D4', 'Compute feature correlations', ['DataFrame'], ['DataFrame']),
  outlierIQR: node('Outlier Analysis (IQR)', 'EDA & Inspection', '📉', '#06B6D4', 'Detect outliers via IQR method', ['DataFrame'], ['DataFrame']),
  histogram: node('Histogram', 'EDA & Inspection', '📊', '#06B6D4', 'Plot value distribution of a column', ['DataFrame'], ['DataFrame'], [
    { name: 'columnName', label: 'Column (auto = target)', type: 'string', default: 'auto' },
    { name: 'bins', label: 'Bins', type: 'number', default: 20 }
  ]),
  scatterPlot: node('Scatter Plot', 'EDA & Inspection', '🔬', '#06B6D4', 'Plot two columns against each other', ['DataFrame'], ['DataFrame'], [
    { name: 'xColumn', label: 'X Column (blank = auto)', type: 'string', default: '' },
    { name: 'yColumn', label: 'Y Column (blank = target)', type: 'string', default: '' }
  ]),

  // --- DATA CLEANING (Teal) ---
  dropDuplicates: node('Drop Duplicates', 'Data Cleaning', '🧹', '#14B8A6', 'Remove duplicate rows', ['DataFrame'], ['DataFrame']),
  dropNulls: node('Drop Nulls', 'Data Cleaning', '🧹', '#14B8A6', 'Remove rows with missing values', ['DataFrame'], ['DataFrame']),
  fillMean: node('Fill Missing (Mean)', 'Data Cleaning', '🩹', '#14B8A6', 'Impute missing with column mean', ['DataFrame'], ['DataFrame']),
  fillMedian: node('Fill Missing (Median)', 'Data Cleaning', '🩹', '#14B8A6', 'Impute missing with column median', ['DataFrame'], ['DataFrame']),
  fixDataTypes: node('Fix Data Types', 'Data Cleaning', '🔧', '#14B8A6', 'Convert column data types', ['DataFrame'], ['DataFrame']),
  capOutliers: node('Cap Outliers (IQR)', 'Data Cleaning', '✂️', '#14B8A6', 'Clip outlier values to IQR bounds', ['DataFrame'], ['DataFrame']),

  // --- FEATURE ENGINEERING (Purple) ---
  oneHotEncode: node('One-Hot Encode', 'Feature Engineering', '🔤', '#A855F7', 'Encode categoricals into binary cols', ['DataFrame'], ['DataFrame']),
  labelEncode: node('Label Encode', 'Feature Engineering', '🔢', '#A855F7', 'Ordinal encoding for categories', ['DataFrame'], ['DataFrame']),
  logTransform: node('Log Transform', 'Feature Engineering', '📈', '#A855F7', 'Apply log1p to reduce skewness', ['DataFrame'], ['DataFrame']),
  datetimeFeatures: node('Datetime Features', 'Feature Engineering', '📅', '#A855F7', 'Extract year, month, day from dates', ['DataFrame'], ['DataFrame'], [
    { name: 'dateColumn', label: 'Date Column', type: 'string', default: 'date' }
  ]),
  polynomial: node('Polynomial Features', 'Feature Engineering', '✨', '#A855F7', 'Create polynomial interaction terms', ['DataFrame'], ['DataFrame'], [
    { name: 'degree', label: 'Degree', type: 'number', default: 2 }
  ]),
  featureSelection: node('Feature Selection', 'Feature Engineering', '🎯', '#A855F7', 'Select top features (SelectKBest)', ['DataFrame'], ['DataFrame'], [
    { name: 'k', label: 'K Features', type: 'number', default: 5 }
  ]),

  // --- SPLIT & VALIDATION (Amber) ---
  trainTestSplit: node('Train/Test Split', 'Split & Validation', '✂️', '#F59E0B', 'Split data into train and test sets', ['DataFrame'], ['Train', 'Test'], [
    { name: 'targetColumn', label: 'Target Column (y)', type: 'string', default: 'target' },
    { name: 'taskType', label: 'Task Type', type: 'select', default: 'auto', options: ['auto', 'classification', 'regression'] },
    { name: 'testSize', label: 'Test Size', type: 'number', default: 0.2 },
    { name: 'randomState', label: 'Random State', type: 'number', default: 42 }
  ]),
  stratifiedSplit: node('Stratified Split', 'Split & Validation', '⚖️', '#F59E0B', 'Split preserving target ratio', ['DataFrame'], ['Train', 'Test'], [
    { name: 'targetColumn', label: 'Target Column (y)', type: 'string', default: 'target' },
    { name: 'taskType', label: 'Task Type', type: 'select', default: 'auto', options: ['auto', 'classification', 'regression'] },
    { name: 'testSize', label: 'Test Size', type: 'number', default: 0.2 },
    { name: 'randomState', label: 'Random State', type: 'number', default: 42 }
  ]),
  kFold: node('K-Fold CV', 'Split & Validation', '🔄', '#F59E0B', 'Cross-validation splitting strategy', ['DataFrame'], ['CV Scores'], [
    { name: 'nSplits', label: 'N Splits', type: 'number', default: 5 }
  ]),

  // --- IMBALANCE (Violet) ---
  smote: node('SMOTE', 'Imbalance', '➕', '#8B5CF6', 'Synthetic Minority Over-sampling', ['Train'], ['Train'], [], ['imbalanced-learn']),
  adasyn: node('ADASYN', 'Imbalance', '➕', '#8B5CF6', 'Adaptive Synthetic Sampling', ['Train'], ['Train'], [], ['imbalanced-learn']),
  classWeight: node('Class Weight', 'Imbalance', '⚖️', '#8B5CF6', 'Balance via algorithmic weights', ['Train'], ['Train']),

  // --- PREPROCESSING (Indigo) ---
  standardScaler: node('Standard Scaler', 'Preprocessing', '📐', '#6366F1', 'Standardize features (mean=0, var=1)', ['Train', 'Test'], ['Train', 'Test']),
  minmaxScaler: node('MinMax Scaler', 'Preprocessing', '📏', '#6366F1', 'Scale features to [0, 1] range', ['Train', 'Test'], ['Train', 'Test']),
  robustScaler: node('Robust Scaler', 'Preprocessing', '🛡️', '#6366F1', 'Scale using median and quantiles', ['Train', 'Test'], ['Train', 'Test']),

  // --- MODELS (Orange) ---
  logisticReg: node('Logistic Regression', 'Models', '📈', '#FF7A00', 'Linear classification model', ['Train'], ['Model']),
  linearReg: node('Linear Regression', 'Models', '📏', '#FF7A00', 'Linear regression for numeric targets', ['Train'], ['Model']),
  randomForest: node('Random Forest', 'Models', '🌲', '#FF7A00', 'Ensemble of decision trees (auto: classifier/regressor)', ['Train'], ['Model'], [
    { name: 'nEstimators', label: 'N Estimators', type: 'number', default: 100 },
    { name: 'maxDepth', label: 'Max Depth (blank = none)', type: 'number', default: null },
    { name: 'criterion', label: 'Criterion (classification)', type: 'select', default: 'gini', options: ['gini', 'entropy'] }
  ]),
  xgboost: node('XGBoost', 'Models', '⚡', '#FF7A00', 'Extreme Gradient Boosting', ['Train'], ['Model'], [
    { name: 'learningRate', label: 'Learning Rate', type: 'number', default: 0.1 },
    { name: 'maxDepth', label: 'Max Depth', type: 'number', default: 6 }
  ], ['xgboost']),
  lightgbm: node('LightGBM', 'Models', '💡', '#FF7A00', 'Fast gradient boosting framework', ['Train'], ['Model'], [
    { name: 'nEstimators', label: 'N Estimators', type: 'number', default: 100 },
    { name: 'numLeaves', label: 'Num Leaves', type: 'number', default: 31 }
  ], ['lightgbm']),
  svm: node('SVM', 'Models', '🎯', '#FF7A00', 'Support Vector Machine', ['Train'], ['Model'], [
    { name: 'kernel', label: 'Kernel', type: 'select', default: 'rbf', options: ['rbf', 'linear', 'poly', 'sigmoid'] },
    { name: 'c', label: 'C (regularization)', type: 'number', default: 1.0 }
  ]),
  knn: node('KNN', 'Models', '🗺️', '#FF7A00', 'K-Nearest Neighbors', ['Train'], ['Model'], [
    { name: 'nNeighbors', label: 'N Neighbors', type: 'number', default: 5 }
  ]),

  // --- HYPERPARAMETER TUNING (Pink) ---
  gridSearch: node('Grid Search', 'Hyperparameter Tuning', '🔍', '#EC4899', 'Exhaustive parameter search', ['Model', 'Train'], ['Model']),
  optuna: node('Optuna', 'Hyperparameter Tuning', '🧪', '#EC4899', 'Bayesian hyperparameter optimization', ['Model', 'Train'], ['Model'], [], ['optuna']),

  // --- EXPLAINABILITY (Sky) ---
  shap: node('SHAP Values', 'Explainability', '💡', '#22D3EE', 'SHapley Additive exPlanations', ['Model', 'Test'], ['Plot'], [], ['shap']),
  featureImp: node('Feature Importance', 'Explainability', '📊', '#22D3EE', 'Tree-based feature importance', ['Model', 'Test'], ['Plot']),

  // --- EVALUATION (Magenta) ---
  accuracyMetrics: node('Accuracy/Precision', 'Evaluation', '✅', '#D946EF', 'Metrics (classification + regression)', ['Model', 'Test'], ['Metrics']),
  confusionMatrix: node('Confusion Matrix', 'Evaluation', '🔲', '#D946EF', 'Visualize TP/FP/TN/FN matrix', ['Model', 'Test'], ['Plot']),
  rocCurve: node('ROC Curve', 'Evaluation', '📉', '#D946EF', 'Receiver Operating Characteristic', ['Model', 'Test'], ['Plot']),

  // --- MODEL MANAGEMENT (Green) ---
  saveModel: node('Save Pipeline (.pkl)', 'Model Management', '💾', '#22C55E', 'Persist trained model to disk', ['Model'], ['File']),
  mlflowLog: node('MLflow Log', 'Model Management', '📦', '#22C55E', 'Log model and metrics to MLflow', ['Model', 'Metrics'], ['Run ID'], [], ['mlflow']),

  // --- DEPLOYMENT (Green) ---
  deployFastAPI: node('Generate FastAPI', 'Deployment', '🚀', '#22C55E', 'Serve model as REST API', ['Model'], ['API']),
  exportPipeline: node('Export Python', 'Deployment', '🐍', '#22C55E', 'Export final dataset / pipeline output', ['Model'], ['File']),
};

// Flatten registry for sidebar rendering
export const nodeCategories = Object.values(nodeRegistry).reduce((acc, node) => {
  if (!acc[node.category]) acc[node.category] = [];
  acc[node.category].push(node);
  return acc;
}, {} as Record<string, MLNodeData[]>);

/* ══════════════════════════════════════════════════════════════════
   LEGACY TITLE ALIASES + NODE HYDRATION (auto-upgrade of old workflows)

   • TITLE_ALIASES / normalizeTitle(): maps retired node titles
     (saved in old SQLite workflows) to current registry titles.
     This is the CANONICAL map — the code generator imports it too,
     so execution and the UI always agree.

   • hydrateNodesFromRegistry(): runs when a workflow is loaded.
     - Fills in params that are missing on saved nodes (user-set
       values are preserved; only MISSING params get registry defaults)
     - Keeps params the registry no longer defines (nothing is lost)
     - Upgrades legacy titles/icons/colors to current registry values
     - Returns the SAME node object references when nothing changed
       (no needless re-renders / autosave churn)
   ══════════════════════════════════════════════════════════════════ */

export const TITLE_ALIASES: Record<string, string> = {
  'Missing Value Report': 'Missing Values',
  'Fill Missing Values': 'Fill Missing (Mean)',
  'Train Random Forest': 'Random Forest',
  'Train XGBoost': 'XGBoost',
  'Train Logistic Reg': 'Logistic Regression',
  'Train Linear Reg': 'Linear Regression',
  'SMOTE Imbalance': 'SMOTE',
  'Column Transformer': 'Standard Scaler',
  'ROC-AUC': 'ROC Curve',
  'SHAP Explainability': 'SHAP Values',
  'Optuna Tune': 'Optuna',
  'Deploy FastAPI': 'Generate FastAPI',
};

export function normalizeTitle(title: string): string {
  return TITLE_ALIASES[title] ?? title;
}

export function hydrateNodesFromRegistry(nodes: Node[]): Node[] {
  const registryByTitle = new Map(Object.values(nodeRegistry).map((n) => [n.title, n]));

  return nodes.map((node) => {
    const data = node.data as MLNodeData;
    const entry = registryByTitle.get(normalizeTitle(data.title));
    if (!entry) return node; // custom / unknown node — leave untouched

    const existing: NodeParameter[] = Array.isArray(data.parameters) ? data.parameters : [];

    // 1. Merge parameters: registry definition wins for label/type/options,
    //    the node's SAVED value wins for `default` (that's where
    //    updateNodeParameters stores user input).
    let paramsChanged = false;
    const merged: NodeParameter[] = entry.parameters.map((regParam) => {
      const saved = existing.find((ep) => ep.name === regParam.name);
      if (!saved) {
        paramsChanged = true; // registry param missing on this saved node
        return { ...regParam };
      }
      if (saved.label !== regParam.label || saved.type !== regParam.type || saved.options !== regParam.options) {
        paramsChanged = true;
      }
      return { ...regParam, default: saved.default };
    });

    // Keep any params the registry no longer defines (custom/legacy) — nothing is lost.
    const extras = existing.filter((ep) => !entry.parameters.some((p) => p.name === ep.name));
    if (extras.length > 0) paramsChanged = true;
    const parameters = extras.length > 0 ? [...merged, ...extras] : merged;

    // 2. Presentation refresh: legacy titles/icons/colors upgrade to current values.
    const presentationChanged =
      data.title !== entry.title ||
      data.icon !== entry.icon ||
      data.color !== entry.color ||
      data.category !== entry.category ||
      data.description !== entry.description;

    if (!paramsChanged && !presentationChanged) return node; // already in sync

    return {
      ...node,
      data: {
        ...node.data,
        title: entry.title,
        category: entry.category,
        icon: entry.icon,
        color: entry.color,
        description: entry.description,
        parameters,
      },
    };
  });
}