'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Trash2, Target, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DKCPAnalysis } from '@/components/dkcp-analysis';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isDKCP?: boolean;
  analysisType?: 'dkcp' | 'general';
}

export const ChatInterface = forwardRef(function ChatInterface(props: { open: boolean; onOpenChange: (open: boolean) => void }, ref) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDKCPAnalysis, setShowDKCPAnalysis] = useState(false);
  const [dkcpAnalysis, setDkcpAnalysis] = useState<any>(null);
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
      // Prepare conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input.trim(),
          conversationHistory 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date(),
          isDKCP: data.isDKCP,
          analysisType: data.analysisType
        };
        setMessages(prev => [...prev, assistantMessage]);

        // If it's a DKCP analysis, try to parse and display it
        if (data.isDKCP && data.response) {
          try {
            const parsedAnalysis = parseDKCPResponse(data.response);
            if (parsedAnalysis) {
              setDkcpAnalysis(parsedAnalysis);
              setShowDKCPAnalysis(true);
            }
          } catch (error) {
            console.log('Could not parse DKCP response as structured data');
          }
        }
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

  const parseDKCPResponse = (response: string): any => {
    // Simple parsing logic - in a real implementation, you might want more sophisticated parsing
    const analysis: any = {};
    
    // Extract activity
    const activityMatch = response.match(/Activity Description\s*\n(.*?)(?=\n\n|\n###|\n##)/);
    if (activityMatch) {
      analysis.activity = activityMatch[1].trim();
    }

    // Extract score if present
    const scoreMatch = response.match(/Score:\s*(\d+)/);
    if (scoreMatch) {
      analysis.score = parseInt(scoreMatch[1]);
    }

    // Extract conflicts
    const conflictsMatch = response.match(/Key Motivational Conflicts\s*\n(.*?)(?=\n\n|\n###|\n##)/);
    if (conflictsMatch) {
      const conflictsText = conflictsMatch[1];
      const conflictLines = conflictsText.split('\n').filter(line => line.trim());
      analysis.conflicts = conflictLines.map((line, index) => ({
        id: `KMC${index + 1}`,
        description: line.trim(),
        driver: 'Driver', // Simplified
        barrier: 'Barrier' // Simplified
      }));
    }

    return Object.keys(analysis).length > 0 ? analysis : null;
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
    <>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <DialogTitle asChild>
              <span style={{ display: 'none' }}>Чат с Cypher Alpha</span>
            </DialogTitle>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={handleClear} title="Удалить диалог">
                <Trash2 className="h-5 w-5 text-red-500" />
              </Button>
            )}
          </div>
          <Card className="w-full h-[600px] flex flex-col border-none shadow-none">
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Чат с Cypher Alpha</p>
                    <p className="text-sm mt-2">Задайте любой вопрос AI-ассистенту</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs">Попробуйте:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="text-xs">
                          "Проанализируй рекламный скрипт"
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          "Помоги с DKCP анализом"
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          "Улучши креатив"
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
                          {message.isDKCP && (
                            <div className="mt-2 flex items-center gap-2">
                              <Target className="h-4 w-4 text-orange-500" />
                              <Badge variant="secondary" className="text-xs">
                                DKCP Analysis
                              </Badge>
                            </div>
                          )}
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
                            <span>Cypher Alpha думает...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Задайте вопрос Cypher Alpha..."
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

      {/* DKCP Analysis Modal */}
      {showDKCPAnalysis && dkcpAnalysis && (
        <Dialog open={showDKCPAnalysis} onOpenChange={setShowDKCPAnalysis}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DKCPAnalysis 
              analysis={dkcpAnalysis} 
              onClose={() => setShowDKCPAnalysis(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}); 