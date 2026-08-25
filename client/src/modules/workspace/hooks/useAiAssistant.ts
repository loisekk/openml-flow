// client/src/modules/workspace/hooks/useAiAssistant.ts
import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../../auth/authStore';
import { nodeRegistry } from '../config/nodeRegistry';
import { getNextChainPosition } from '../utils/nodeLayout';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const BUILD_INTENT = /\b(build|create|generate|make|design|set\s?up)\b[\s\S]*\b(workflow|pipeline)\b/i;
const NOTE_INTENT = /\b(add|create|insert)\b[\s\S]*\bnote\b/i;

export const useAiAssistant = () => {
  const { nodes, edges, executionLogs } = useWorkflowStore();
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const buildContext = () => {
    let context = 'Nodes in pipeline:\n';
    nodes.forEach((node) => {
      const params = node.data.parameters?.map((p: any) => `${p.name}=${p.default}`).join(', ');
      context += `- ${node.data.title} (${node.data.category}) | Params: ${params || 'None'}\n`;
    });
    if (executionLogs.length > 0) {
      context += '\nRecent Execution Logs:\n' + executionLogs.slice(-5).join('\n');
    }
    return context;
  };

  /** Ask the AI to DESIGN a workflow from the uploaded dataset (server profiles it). */
  const requestWorkflowBuild = async (prompt: string): Promise<string> => {
    const res = await fetch('/api/ai/build-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return `I couldn't design a workflow: ${data.detail ?? `HTTP ${res.status}`}. Make sure you've uploaded a dataset and have an active AI provider.`;
    }
    useWorkflowStore.getState().setAiProposal({
      summary: data.summary ?? 'AI-designed workflow',
      nodes: Array.isArray(data.nodes) ? data.nodes : [],
      edges: Array.isArray(data.edges) ? data.edges : [],
      notes: Array.isArray(data.notes) ? data.notes : [],
    });
    return `I've analyzed your dataset and designed a ${data.nodes?.length ?? 0}-node workflow${data.notes?.length ? ` with ${data.notes.length} documentation note${data.notes.length > 1 ? 's' : ''}` : ''}. Review it in the proposal panel — click **Apply** to add it to the canvas, or Cancel to discard.`;
  };

  /** Ask the AI a normal question, then (optionally) drop the answer in as a note node. */
  const chat = async (prompt: string, asNote: boolean): Promise<string> => {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ prompt, context: buildContext() }),
    });
    if (!res.ok) throw new Error('AI request failed');
    const data = await res.json();

    if (asNote && data.response) {
      const noteDef = nodeRegistry['note'];
      if (noteDef) {
        const position = getNextChainPosition(useWorkflowStore.getState().nodes);
        useWorkflowStore.getState().addNode(
          { ...noteDef, noteText: String(data.response).substring(0, 600) },
          position
        );
        return `${data.response}\n\n📝 *Added as a note on your canvas.*`;
      }
    }
    return data.response;
  };

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isThinking) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      let reply: string;
      if (BUILD_INTENT.test(prompt)) {
        reply = await requestWorkflowBuild(prompt);
      } else {
        reply = await chat(prompt, NOTE_INTENT.test(prompt));
      }
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (error: any) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsThinking(false);
    }
  };

  return { messages, sendMessage, isThinking };
};