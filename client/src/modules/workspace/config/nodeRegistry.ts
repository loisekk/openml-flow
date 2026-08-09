// client/src/modules/workspace/config/nodeRegistry.ts

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
  dependencies?: string[]; // <-- ADDED FOR PACKAGE MANAGEMENT
  status?: 'idle' | 'running' | 'success' | 'error';
  progress?: number;
  customCode?: string;
  filePath?: string;
}

// Helper updated to accept dependencies
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
  ]),
  loadDatabase: node('Load Database', 'Data Loading', '🗄️', '#3B82F6', 'Load data via SQL connection', [], ['DataFrame']),
  loadAPI: node('Load REST API', 'Data Loading', '🌐', '#3B82F6', 'Fetch data from web API', [], ['DataFrame']),
  sampleDataset: node('Sample Dataset', 'Data Loading', '🎲', '#3B82F6', 'Generate synthetic mock data', [], ['DataFrame']),

  // --- EDA & INSPECTION (Cyan) ---
  viewInfo: node('View Info', 'EDA & Inspection', 'ℹ️', '#06B6D4', 'Display DataFrame schema & memory', ['DataFrame'], ['DataFrame']),
  viewStats: node('View Stats', 'EDA & Inspection', '📊', '#06B6D4', 'Show descriptive statistics', ['DataFrame'], ['DataFrame']),
  missingValues: node('Missing Values', 'EDA & Inspection', '❓', '#06B6D4', 'Analyze missing data count', ['DataFrame'], ['DataFrame']),
  targetDist: node('Target Distribution', 'EDA & Inspection', '🎯', '#06B6D4', 'Check target variable balance', ['DataFrame'], ['DataFrame']),
  corrMatrix: node('Correlation Matrix', 'EDA & Inspection', '🧩', '#06B6D4', 'Compute feature correlations', ['DataFrame'], ['DataFrame']),
  outlierIQR: node('Outlier Analysis (IQR)', 'EDA & Inspection', '📉', '#06B6D4', 'Detect outliers via IQR method', ['DataFrame'], ['DataFrame']),

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
  datetimeFeatures: node('Datetime Features', 'Feature Engineering', '📅', '#A855F7', 'Extract year, month, day from dates', ['DataFrame'], ['DataFrame']),
  polynomial: node('Polynomial Features', 'Feature Engineering', '✨', '#A855F7', 'Create polynomial interaction terms', ['DataFrame'], ['DataFrame']),

  // --- SPLIT & VALIDATION (Amber) ---
  trainTestSplit: node('Train/Test Split', 'Split & Validation', '✂️', '#F59E0B', 'Split data into train and test sets', ['DataFrame'], ['Train', 'Test'], [
    { name: 'testSize', label: 'Test Size', type: 'number', default: 0.2 },
    { name: 'randomState', label: 'Random State', type: 'number', default: 42 }
  ]),
  stratifiedSplit: node('Stratified Split', 'Split & Validation', '⚖️', '#F59E0B', 'Split preserving target ratio', ['DataFrame'], ['Train', 'Test']),
  kFold: node('K-Fold CV', 'Split & Validation', '🔄', '#F59E0B', 'Cross-validation splitting strategy', ['DataFrame'], ['CV Scores']),

  // --- IMBALANCE (Violet) ---
  smote: node('SMOTE', 'Imbalance', '➕', '#8B5CF6', 'Synthetic Minority Over-sampling', ['Train'], ['Train'], [], ['imbalanced-learn']), // <-- ADDED DEPENDENCY
  adasyn: node('ADASYN', 'Imbalance', '➕', '#8B5CF6', 'Adaptive Synthetic Sampling', ['Train'], ['Train']),
  classWeight: node('Class Weight', 'Imbalance', '⚖️', '#8B5CF6', 'Balance via algorithmic weights', ['Train'], ['Train']),

  // --- PREPROCESSING (Indigo) ---
  standardScaler: node('Standard Scaler', 'Preprocessing', '📐', '#6366F1', 'Standardize features (mean=0, var=1)', ['Train', 'Test'], ['Train', 'Test']),
  minmaxScaler: node('MinMax Scaler', 'Preprocessing', '📏', '#6366F1', 'Scale features to [0, 1] range', ['Train', 'Test'], ['Train', 'Test']),
  robustScaler: node('Robust Scaler', 'Preprocessing', '🛡️', '#6366F1', 'Scale using median and quantiles', ['Train', 'Test'], ['Train', 'Test']),

  // --- MODELS (Orange) ---
  logisticReg: node('Logistic Regression', 'Models', '📈', '#FF7A00', 'Linear classification model', ['Train'], ['Model']),
  randomForest: node('Random Forest', 'Models', '🌲', '#FF7A00', 'Ensemble of decision trees', ['Train'], ['Model'], [
    { name: 'nEstimators', label: 'N Estimators', type: 'number', default: 100 },
    { name: 'maxDepth', label: 'Max Depth', type: 'number', default: null },
    { name: 'criterion', label: 'Criterion', type: 'select', default: 'gini', options: ['gini', 'entropy'] }
  ]),
  xgboost: node('XGBoost', 'Models', '⚡', '#FF7A00', 'Extreme Gradient Boosting', ['Train'], ['Model'], [
    { name: 'learningRate', label: 'Learning Rate', type: 'number', default: 0.1 },
    { name: 'maxDepth', label: 'Max Depth', type: 'number', default: 6 }
  ], ['xgboost']), // <-- ADDED DEPENDENCY
  lightgbm: node('LightGBM', 'Models', '💡', '#FF7A00', 'Fast gradient boosting framework', ['Train'], ['Model']),
  svm: node('SVM', 'Models', '🎯', '#FF7A00', 'Support Vector Machine classifier', ['Train'], ['Model']),
  knn: node('KNN', 'Models', '🗺️', '#FF7A00', 'K-Nearest Neighbors classifier', ['Train'], ['Model'], [
    { name: 'nNeighbors', label: 'N Neighbors', type: 'number', default: 5 }
  ]),

  // --- HYPERPARAMETER TUNING (Pink) ---
  gridSearch: node('Grid Search', 'Hyperparameter Tuning', '🔍', '#EC4899', 'Exhaustive parameter search', ['Model', 'Train'], ['Model']),
  optuna: node('Optuna', 'Hyperparameter Tuning', '🧪', '#EC4899', 'Bayesian hyperparameter optimization', ['Model', 'Train'], ['Model'], [], ['optuna']), // <-- ADDED DEPENDENCY

  // --- EXPLAINABILITY (Sky) ---
  shap: node('SHAP Values', 'Explainability', '💡', '#22D3EE', 'SHapley Additive exPlanations', ['Model', 'Test'], ['Plot'], [], ['shap']), // <-- ADDED DEPENDENCY
  featureImp: node('Feature Importance', 'Explainability', '📊', '#22D3EE', 'Tree-based feature importance', ['Model', 'Test'], ['Plot']),

  // --- EVALUATION (Magenta) ---
  accuracyMetrics: node('Accuracy/Precision', 'Evaluation', '✅', '#D946EF', 'Classification report metrics', ['Model', 'Test'], ['Metrics']),
  confusionMatrix: node('Confusion Matrix', 'Evaluation', '🔲', '#D946EF', 'Visualize TP/FP/TN/FN matrix', ['Model', 'Test'], ['Plot']),
  rocCurve: node('ROC Curve', 'Evaluation', '📉', '#D946EF', 'Receiver Operating Characteristic', ['Model', 'Test'], ['Plot']),

  // --- MODEL MANAGEMENT (Green) ---
  saveModel: node('Save Pipeline (.pkl)', 'Model Management', '💾', '#22C55E', 'Persist trained model to disk', ['Model'], ['File']),
  mlflowLog: node('MLflow Log', 'Model Management', '📦', '#22C55E', 'Log model and metrics to MLflow', ['Model', 'Metrics'], ['Run ID']),

  // --- DEPLOYMENT (Green) ---
  deployFastAPI: node('Generate FastAPI', 'Deployment', '🚀', '#22C55E', 'Serve model as REST API', ['Model'], ['API']),
  exportPipeline: node('Export Python', 'Deployment', '🐍', '#22C55E', 'Download full pipeline script', ['Model'], ['File']),
};

// Flatten registry for sidebar rendering
export const nodeCategories = Object.values(nodeRegistry).reduce((acc, node) => {
  if (!acc[node.category]) acc[node.category] = [];
  acc[node.category].push(node);
  return acc;
}, {} as Record<string, MLNodeData[]>);