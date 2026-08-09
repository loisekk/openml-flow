// client/src/modules/dashboard/useDashboardStore.ts
import { create } from 'zustand';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Draft' | 'Failed';
  updatedAt: string;
  executions: number;
  successRate: number;
}

interface DashboardState {
  workflows: Workflow[];
  createWorkflow: (name?: string) => string; // Returns ID for routing
  deleteWorkflow: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  workflows: [
    { id: 'wf-001', name: 'Customer Churn Pipeline', description: 'Predicts customer churn using Random Forest.', status: 'Active', updatedAt: '2 mins ago', executions: 24, successRate: 94 },
    { id: 'wf-002', name: 'House Price Prediction', description: 'Regression model for California housing.', status: 'Draft', updatedAt: '5 hours ago', executions: 0, successRate: 0 },
    { id: 'wf-003', name: 'Fraud Detection', description: 'XGBoost imbalanced classification.', status: 'Failed', updatedAt: '1 day ago', executions: 12, successRate: 88 },
  ],
  
  createWorkflow: (name) => {
    const newId = `wf-${Math.random().toString(36).substr(2, 9)}`;
    const newWorkflow: Workflow = {
      id: newId,
      name: name || 'Untitled Workflow',
      description: 'New ML pipeline',
      status: 'Draft',
      updatedAt: 'Just now',
      executions: 0,
      successRate: 0
    };
    set((state) => ({ workflows: [newWorkflow, ...state.workflows] }));
    return newId;
  },
  
  deleteWorkflow: (id) => {
    set((state) => ({ workflows: state.workflows.filter((wf) => wf.id !== id) }));
  }
}));