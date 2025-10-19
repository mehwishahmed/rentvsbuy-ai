// src/components/chat/ChatMessage.tsx

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
  }
  
  export function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === 'user';
    
    return (
      <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          {content}
        </div>
      </div>
    );
  }