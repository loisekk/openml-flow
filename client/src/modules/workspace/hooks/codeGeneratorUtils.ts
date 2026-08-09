import { Node } from 'reactflow';
import { MLNodeData } from '../config/nodeRegistry';

// Helper function to generate code for a single node
export function generateSingleNodeCode(node: Node<MLNodeData>): string {
  if (!node) return "# Select a node";
  
  const op = node.data.title; 
  // FIX: Read filePath from parameters array instead of node.data.filePath
  const filePathParam = node.data.parameters.find((p: any) => p.name === 'filePath');
  const filePath = filePathParam ? filePathParam.default : null;
  const customCode = node.data.customCode;

  if (customCode) {
    return `# Custom Code for ${op}\n${customCode}\n\n`;
  }

  switch(op) {
    case 'Load CSV':
      if (filePath && filePath !== 'data.csv') {
        return `# Load CSV\ndf = pd.read_csv(r'${filePath}')\n\n`;
      } else {
        return `# Load Data (Generating Synthetic Messy Dataset: 1000 rows)\nnp.random.seed(42)\ndf = pd.DataFrame({\n    'age': np.random.normal(40, 10, 1000).tolist() + [200, -50, 300],\n    'income': np.random.normal(50000, 15000, 1003).tolist(),\n    'city': np.random.choice(['NY', 'LA', 'SF', 'CHI'], 1003).tolist(),\n    'target': np.random.choice([0, 1], 1003).tolist()\n})\ndf.loc[df.sample(100).index, 'income'] = np.nan\ndf = pd.concat([df, df.sample(50)], ignore_index=True)\n\n`;
      }
    default:
      return `# ${op}\nprint("Executing ${op}...")\n\n`;
  }
}