'use client';

import { Brain, Loader2, Send, User2Icon } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { useDocumentStore } from '../store/documentStore';

interface MessageOut {
  role?: string;
  content?: string;
  sources?: number[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources: number[];
}

export default function DashboardPage() {
  const [question, setQuestion] = useState('');
  const { selectedDoc } = useDocumentStore();
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!selectedDoc) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      setLoadingMessages(true);

      try {
        const token = localStorage.getItem('token');

        const res = await fetch(
          `http://localhost:8000/api/documents/${selectedDoc.id}/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          setMessages([]);
          return;
        }

        const data: MessageOut[] = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedDoc]);

  if (!selectedDoc) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#888787] text-sm">
        Select a document from the sidebar to start chatting
      </div>
    );
  }

  const sendQuestion = async () => {
    if (!selectedDoc || !question.trim()) return;

    const token = localStorage.getItem('token');

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: question,
        sources: [],
      },
      {
        role: 'assistant',
        content: '',
        sources: [],
      },
    ]);

    const currentQuestion = question;
    setQuestion('');

    const response = await fetch('http://127.0.0.1:8000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        document_id: selectedDoc.id,
        question: currentQuestion,
      }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);

      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;

        const data = line.replace('data: ', '');

        if (data === '[DONE]') return;

        const parsed = JSON.parse(data);

        if (parsed.token) {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              ...copy[copy.length - 1],
              content: copy[copy.length - 1].content + parsed.token,
            };
            return copy;
          });
        }

        if (parsed.sources) {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              ...copy[copy.length - 1],
              sources: parsed.sources,
            };
            return copy;
          });
        }
      }
    }
  };

  return (
    <div className="flex flex-1 h-full">
      <div className="w-1/2 border-r border-[#242424] bg-black">PDF</div>
      <div className="flex w-1/2 flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loadingMessages ? (
            <Loader2 className="animate-spin" />
          ) : messages.length === 0 ? (
            <p className="text-[#888787]">Ask your first question.</p>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-1 items-center ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role == 'user' ? <User2Icon /> : <Brain />}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3  ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#181818] text-white'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-[#242424] p-4 w-full flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full rounded-md border border-[#242424] bg-[#111] p-3 text-white outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendQuestion();
              }
            }}
          />
          <button
            className="p-4 rounded-md bg-blue-300"
            onClick={sendQuestion}
            disabled={sending}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
