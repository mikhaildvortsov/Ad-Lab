'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Trash2, Copy, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInstruction } from '@/lib/ai-instructions';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export const ChatInterface = forwardRef(function ChatInterface(props: { open: boolean; onOpenChange: (open: boolean) => void }, ref) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [instructionType, setInstructionType] = useState<'marketing' | 'copywriting' | 'audience' | 'creative' | 'analytics' | 'dkcp' | 'creative_script'>('marketing');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    clearMessages: () => setMessages([]),
  }));

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input.trim(),
          instructionType: instructionType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Произошла ошибка. Попробуйте ещё раз.',
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Произошла ошибка. Попробуйте ещё раз.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = () => setMessages([]);

  const copyMessage = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0">
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <DialogTitle asChild>
            <span style={{ display: 'none' }}>Чат с Gemini Flash</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Select value={instructionType} onValueChange={(value: any) => setInstructionType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Выберите режим" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">Маркетинг</SelectItem>
                <SelectItem value="copywriting">Копирайтинг</SelectItem>
                <SelectItem value="audience">Аудитория</SelectItem>
                <SelectItem value="creative">Креатив</SelectItem>
                <SelectItem value="analytics">Аналитика</SelectItem>
                <SelectItem value="dkcp">ДКЦП Анализ</SelectItem>
                <SelectItem value="creative_script">Создание Креативов</SelectItem>
              </SelectContent>
            </Select>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={handleClear} title="Удалить диалог">
                <Trash2 className="h-5 w-5 text-red-500" />
              </Button>
            )}
          </div>
        </div>
        <Card className="w-full h-[600px] flex flex-col border-none shadow-none">
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Чат с Gemini Flash</p>
                  <p className="text-sm mt-2">Задайте любой вопрос AI-ассистенту</p>
                                      <div className="mt-4 space-y-2">
                      <p className="text-xs">Попробуйте:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="text-xs">
                          "Анализируй рекламный скрипт"
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          "Помоги с ДКЦП анализом"
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          "Создай креатив"
                        </Badge>
                      </div>
                    </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0">
                          <Bot className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          {message.role === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-50 hover:opacity-100"
                              onClick={() => copyMessage(message.content)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0">
                          <User className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <Bot className="h-6 w-6 text-blue-500" />
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Gemini Flash думает...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Задайте вопрос Gemini Flash..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}); 