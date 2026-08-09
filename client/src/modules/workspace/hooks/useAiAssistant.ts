import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../../auth/authStore';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const useAiAssistant = () => {
  const { nodes, executionLogs } = useWorkflowStore();
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const buildContext = () => {
    let context = "Nodes in pipeline:\n";
    nodes.forEach((node) => {
      const params = node.data.parameters?.map((p: any) => `${p.name}=${p.default}`).join(', ');
      context += `- ${node.data.title} (${node.data.category}) | Params: ${params || 'None'}\n`;
    });
    if (executionLogs.length > 0) {
      context += "\nRecent Execution Logs:\n" + executionLogs.slice(-5).join('\n');
    }
    return context;
  };

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isThinking) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, context: buildContext() })
      });

      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();

      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsThinking(false);
    }
  };

  return { messages, sendMessage, isThinking };
};