// src/components/chat/ChatMessage.tsx

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
  }
  
  export function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === 'user';
    
    // Handle "Pro tip:" styling
    const formatContent = (text: string) => {
      return text.split('\n').map((line, index) => {
        if (line.includes('Pro tip:')) {
          const parts = line.split('Pro tip:');
          return (
            <div key={index}>
              {parts[0]}
              <span className="pro-tip">Pro tip:</span>
              {parts[1]}
            </div>
          );
        }
        return <div key={index}>{line}</div>;
      });
    };
    
    return (
      <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          {formatContent(content)}
        </div>
      </div>
    );
  }