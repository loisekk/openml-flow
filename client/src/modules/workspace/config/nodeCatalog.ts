// client/src/modules/workspace/nodeCatalog.ts

// 1. Define the strict data shape for your premium ML Nodes
export interface MLNodeData {
  // UI Fields (for WorkflowNode.tsx)
  title: string;
  subtitle?: string;
  categoryColor: string;
  icon?: string;
  
  // Categorization (for NodePanel.tsx)
  category: string;
  
  // Graph Fields (for React Flow & Validation)
  hasInput: boolean;
  inputType?: string;
  hasOutput: boolean;
  outputType?: string;
  
  // Execution & Code Gen Fields
  filePath?: string;
  customCode?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  execTime?: number;
  inputShape?: string;
  outputShape?: string;
}

// 2. Define the catalog structure for adding new nodes
interface CatalogEntry {
  type: string; // React Flow node type (e.g., 'mlNode')
  data: MLNodeData;
}

export const nodeCatalog: Record<string, CatalogEntry> = {
  // 1. Data Loading
  'Load CSV': { type: 'mlNode', data: { title: 'Load CSV', subtitle: 'DataFrame', categoryColor: '#64B5F6', icon: '📄', category: '1. Data Loading', hasInput: false, hasOutput: true, outputType: 'DataFrame' } },
  'Load JSON': { type: 'mlNode', data: { title: 'Load JSON', subtitle: 'DataFrame', categoryColor: '#64B5F6', icon: '📄', category: '1. Data Loading', hasInput: false, hasOutput: true, outputType: 'DataFrame' } },
  'Load Database': { type: 'mlNode', data: { title: 'Load Database', subtitle: 'DataFrame', categoryColor: '#64B5F6', icon: '🗄️', category: '1. Data Loading', hasInput: false, hasOutput: true, outputType: 'DataFrame' } },
  'Sample Dataset': { type: 'mlNode', data: { title: 'Sample Dataset', subtitle: 'DataFrame', categoryColor: '#64B5F6', icon: '🎲', category: '1. Data Loading', hasInput: false, hasOutput: true, outputType: 'DataFrame' } },
  
  // 2. Data Inspection (EDA)
  'View Info': { type: 'mlNode', data: { title: 'View Info', subtitle: 'Info', categoryColor: '#A3FF5A', icon: 'ℹ️', category: '2. EDA & Inspection', hasInput: true, inputType: 'DataFrame', hasOutput: false } },
  'View Stats': { type: 'mlNode', data: { title: 'View Stats', subtitle: 'Stats', categoryColor: '#A3FF5A', icon: '📊', category: '2. EDA & Inspection', hasInput: true, inputType: 'DataFrame', hasOutput: false } },
  'Missing Value Report': { type: 'mlNode', data: { title: 'Missing Values', subtitle: 'Report', categoryColor: '#A3FF5A', icon: '🔍', category: '2. EDA & Inspection', hasInput: true, inputType: 'DataFrame', hasOutput: false } },
  'Data Preview': { type: 'mlNode', data: { title: 'Data Preview', subtitle: 'DataFrame', categoryColor: '#A3FF5A', icon: '👁️', category: '2. EDA & Inspection', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },

  // 3. Data Cleaning
  'Drop Duplicates': { type: 'mlNode', data: { title: 'Drop Duplicates', subtitle: 'DataFrame', categoryColor: '#FFA931', icon: '🧹', category: '3. Data Cleaning', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },
  'Drop Nulls': { type: 'mlNode', data: { title: 'Drop Nulls', subtitle: 'DataFrame', categoryColor: '#FFA931', icon: '🧹', category: '3. Data Cleaning', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },
  'Fill Missing Values': { type: 'mlNode', data: { title: 'Fill Missing', subtitle: 'DataFrame', categoryColor: '#FFA931', icon: '🩹', category: '3. Data Cleaning', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },
  'Cap Outliers (IQR)': { type: 'mlNode', data: { title: 'Cap Outliers', subtitle: 'DataFrame', categoryColor: '#FFA931', icon: '✂️', category: '3. Data Cleaning', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },

  // 4. Feature Engineering
  'Datetime Features': { type: 'mlNode', data: { title: 'Datetime Features', subtitle: 'DataFrame', categoryColor: '#B39DDB', icon: '📅', category: '4. Feature Eng', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },
  'Log Transform': { type: 'mlNode', data: { title: 'Log Transform', subtitle: 'DataFrame', categoryColor: '#B39DDB', icon: '📈', category: '4. Feature Eng', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },
  'One-Hot Encode': { type: 'mlNode', data: { title: 'One-Hot Encode', subtitle: 'DataFrame', categoryColor: '#B39DDB', icon: '🔥', category: '4. Feature Eng', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },
  'Target Encode': { type: 'mlNode', data: { title: 'Target Encode', subtitle: 'DataFrame', categoryColor: '#B39DDB', icon: '🎯', category: '4. Feature Eng', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },
  'Feature Selection': { type: 'mlNode', data: { title: 'Feature Selection', subtitle: 'DataFrame', categoryColor: '#B39DDB', icon: '⬇️', category: '4. Feature Eng', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'DataFrame' } },

  // 5. Split & Prep
  'Train/Test Split': { type: 'mlNode', data: { title: 'Train/Test Split', subtitle: 'Train/Test', categoryColor: '#4FC3F7', icon: '🔀', category: '5. Split & Prep', hasInput: true, inputType: 'DataFrame', hasOutput: true, outputType: 'Train/Test' } },
  'SMOTE Imbalance': { type: 'mlNode', data: { title: 'SMOTE', subtitle: 'Train/Test', categoryColor: '#4FC3F7', icon: '⚖️', category: '5. Split & Prep', hasInput: true, inputType: 'Train/Test', hasOutput: true, outputType: 'Train/Test' } },
  'Column Transformer': { type: 'mlNode', data: { title: 'Preprocess', subtitle: 'Preprocessed', categoryColor: '#4FC3F7', icon: '⚙️', category: '5. Split & Prep', hasInput: true, inputType: 'Train/Test', hasOutput: true, outputType: 'Preprocessed' } },

  // 6. Modeling
  'Train Random Forest': { type: 'mlNode', data: { title: 'Random Forest', subtitle: 'Model', categoryColor: '#ff8c1a', icon: '🌲', category: '6. Modeling', hasInput: true, inputType: 'Preprocessed', hasOutput: true, outputType: 'Model' } },
  'Train XGBoost': { type: 'mlNode', data: { title: 'XGBoost', subtitle: 'Model', categoryColor: '#ff8c1a', icon: '🚀', category: '6. Modeling', hasInput: true, inputType: 'Preprocessed', hasOutput: true, outputType: 'Model' } },
  'Train Logistic Reg': { type: 'mlNode', data: { title: 'Logistic Reg', subtitle: 'Model', categoryColor: '#ff8c1a', icon: '📈', category: '6. Modeling', hasInput: true, inputType: 'Preprocessed', hasOutput: true, outputType: 'Model' } },
  'Train Linear Reg': { type: 'mlNode', data: { title: 'Linear Reg', subtitle: 'Model', categoryColor: '#ff8c1a', icon: '📈', category: '6. Modeling', hasInput: true, inputType: 'Preprocessed', hasOutput: true, outputType: 'Model' } },

  // 7. Evaluation
  'Accuracy/Precision': { type: 'mlNode', data: { title: 'Accuracy', subtitle: 'Metrics', categoryColor: '#00b884', icon: '✅', category: '7. Evaluation', hasInput: true, inputType: 'Model', hasOutput: false } },
  'Confusion Matrix': { type: 'mlNode', data: { title: 'Confusion Matrix', subtitle: 'Plot', categoryColor: '#00b884', icon: '🔲', category: '7. Evaluation', hasInput: true, inputType: 'Model', hasOutput: false } },
  'ROC-AUC': { type: 'mlNode', data: { title: 'ROC-AUC', subtitle: 'Plot', categoryColor: '#00b884', icon: '📉', category: '7. Evaluation', hasInput: true, inputType: 'Model', hasOutput: false } },

  // 8. Explainability
  'SHAP Explainability': { type: 'mlNode', data: { title: 'SHAP', subtitle: 'Plot', categoryColor: '#ff2d8c', icon: '💡', category: '8. Explainability', hasInput: true, inputType: 'Model', hasOutput: false } },
  'Feature Importance': { type: 'mlNode', data: { title: 'Feature Importance', subtitle: 'Plot', categoryColor: '#ff2d8c', icon: '⭐', category: '8. Explainability', hasInput: true, inputType: 'Model', hasOutput: false } },

  // 9. Tuning
  'Grid Search': { type: 'mlNode', data: { title: 'Grid Search', subtitle: 'Model', categoryColor: '#ce93e8', icon: '🔲', category: '9. Tuning', hasInput: true, inputType: 'Model', hasOutput: true, outputType: 'Model' } },
  'Optuna Tune': { type: 'mlNode', data: { title: 'Optuna Tune', subtitle: 'Model', categoryColor: '#ce93e8', icon: '🎵', category: '9. Tuning', hasInput: true, inputType: 'Model', hasOutput: true, outputType: 'Model' } },

  // 10. Deployment
  'Save Pipeline (.pkl)': { type: 'mlNode', data: { title: 'Save Pipeline', subtitle: 'File', categoryColor: '#fafafa', icon: '💾', category: '10. Deployment', hasInput: true, inputType: 'Model', hasOutput: false } },
  'Deploy FastAPI': { type: 'mlNode', data: { title: 'Deploy FastAPI', subtitle: 'API', categoryColor: '#fafafa', icon: '🚀', category: '10. Deployment', hasInput: true, inputType: 'Model', hasOutput: false } },
};