'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatInterfaceProps {
    onHighlightMetric?: (metric: string | null) => void;
}

export function ChatInterface({ onHighlightMetric }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I am your Journey Explainer. Ask me about the patient\'s history, treatment trends, or specific events.',
            timestamp: Date.now(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/agent/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent: 'journey_explainer',
                    task: userMessage.content,
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();

            // Handle Agent Response
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message || 'I processed your request.',
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, aiMessage]);

            // Handle Actions (Highlighting)
            if (data.chartConfig?.highlightMetric && onHighlightMetric) {
                onHighlightMetric(data.chartConfig.highlightMetric);
            } else if (onHighlightMetric) {
                onHighlightMetric(null); // Clear highlight if not specified
            }

        } catch (error) {
            console.error('Chat Error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Sorry, I encountered an error processing your request.',
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-xl w-[350px]">
            <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-800">Journey Assistant</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex gap-3 max-w-[90%]",
                            msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            msg.role === 'user' ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                        )}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                            "p-3 rounded-lg text-sm",
                            msg.role === 'user'
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-slate-100 text-slate-800 rounded-tl-none"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="bg-slate-100 p-3 rounded-lg rounded-tl-none flex items-center">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-slate-50">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about the patient..."
                        className="flex-1 bg-white"
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
