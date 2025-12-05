import React, { useState, useEffect, useRef } from 'react';

interface ConversationMessage {
  question: string;
  answer: string;
}

interface ChartInsightPanelProps {
  chartName: string;
  answer: string | null;
  error: string | null;
  isLoading: boolean;
  conversation: ConversationMessage[];
  onSubmit: (question: string) => void;
  onSave?: () => void;
}

export function ChartInsightPanel({
  chartName,
  answer,
  error,
  isLoading,
  conversation,
  onSubmit,
  onSave,
}: ChartInsightPanelProps) {
  const [question, setQuestion] = useState('');
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, answer, isLoading]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed && !isLoading) {
      onSubmit(trimmed);
      setQuestion('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, but allow Shift+Enter for new lines
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const trimmed = question.trim();
      if (trimmed && !isLoading) {
        onSubmit(trimmed);
        setQuestion('');
      }
    }
  };

  return (
    <div
      className="chart-insight-panel"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      role="region"
      aria-label={`Insight questions for ${chartName}`}
    >
      <div className="chart-insight-header">
        <p className="chart-insight-label">
          {conversation.length === 0 ? 'Ask a question about this chart' : 'Continue the conversation'}
        </p>
        {onSave && conversation.length > 0 && (
          <button
            type="button"
            className="chart-insight-save-btn"
            onClick={onSave}
            title="Save chart and conversation"
          >
            💾 Save
          </button>
        )}
      </div>

      {conversation.length > 0 && (
        <div className="chart-insight-conversation">
          {conversation.map((msg, idx) => (
            <div key={`${msg.question}-${idx}`} className="chart-insight-message">
              <div className="chart-insight-question">
                <strong>Q:</strong> {msg.question}
              </div>
              <div className="chart-insight-answer-text">
                <strong>A:</strong> {msg.answer}
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        className="chart-insight-form"
        onSubmit={handleSubmit}
      >
        <textarea
          rows={4}
          placeholder={conversation.length === 0 
            ? "e.g. Why does the rent line cross the mortgage line in year 6?"
            : "Ask a follow-up question..."}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || question.trim().length === 0}>
          {isLoading ? 'Asking...' : conversation.length === 0 ? 'Ask AI' : 'Continue'}
        </button>
      </form>
      {error && <p className="chart-insight-error">{error}</p>}
      {(answer || isLoading) && conversation.length === 0 && (
        <div className="chart-insight-answer">
          <strong>Insight:</strong>
          <p>
            {answer || ''}
            {isLoading && <span className="chart-insight-cursor">▋</span>}
          </p>
        </div>
      )}
      <div ref={conversationEndRef} />
    </div>
  );
}

