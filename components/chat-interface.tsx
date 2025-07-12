'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Trash2, Copy, Settings, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PaywallModal } from '@/components/paywall-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getInstruction, getAvailableNiches, type NicheType } from '@/lib/ai-instructions';
import { useLocale } from '@/lib/use-locale';
import { useTranslation } from '@/lib/translations';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export const ChatInterface = forwardRef<any, { open: boolean; onOpenChange: (open: boolean) => void }>(
  (props, ref) => {
    const { locale } = useLocale();
    const { t } = useTranslation(locale);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [instructionType, setInstructionType] = useState<'marketing' | 'copywriting' | 'audience' | 'creative' | 'analytics' | 'dkcp' | 'creative_script' | 'goal_reformulation' | 'conversion_analysis'>('marketing');
      const [selectedNiche, setSelectedNiche] = useState<NicheType | 'all'>('all');
  const [showPaywall, setShowPaywall] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [lastAssistantMessage, setLastAssistantMessage] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      clearMessages: () => setMessages([])
    }));

    useEffect(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, [messages]);

    const sendMessage = async () => {
      if (!input.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        content: input.trim(),
        role: 'user',
        timestamp: new Date(),
      };

      const currentInput = input.trim(); // Сохраняем input перед очисткой
      setMessages(prev => [...prev, userMessage]);
      setLastUserMessage(currentInput);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: currentInput,
            instructionType: instructionType,
            niche: selectedNiche !== 'all' ? selectedNiche : undefined,
            locale: locale,
            sessionId: sessionId
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
          setLastAssistantMessage(data.response);
          
          // Показываем paywall после получения ответа
          // Проверяем, что это был запрос на улучшение текста (простая проверка)
          const isTextImprovement = currentInput.toLowerCase().includes('улучш') || 
                                   currentInput.toLowerCase().includes('измени') ||
                                   currentInput.toLowerCase().includes('прокач') ||
                                   currentInput.toLowerCase().includes('анализ') ||
                                   currentInput.toLowerCase().includes('скрипт');
          
          if (isTextImprovement && data.response.length > 100) {
            // Небольшая задержка для лучшего UX
            setTimeout(() => {
              setShowPaywall(true);
            }, 1500);
          }
        } else {
          let errorContent = 'Произошла ошибка. Попробуйте ещё раз.';
          
          // Специальная обработка для rate limit ошибок
          if (response.status === 429 && data.type === 'rate_limit') {
            errorContent = `⚠️ ${data.error}\n\nЛимиты защищают от злоупотребления API и экономят ваши токены.`;
          } else if (data.error) {
            errorContent = data.error;
          }

          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: errorContent,
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

    const handlePaymentSuccess = () => {
      // После успешной оплаты показываем полный результат
      if (lastAssistantMessage) {
        const successMessage: Message = {
          id: Date.now().toString(),
          content: '🎉 Спасибо за подписку! Теперь у вас есть доступ ко всем функциям. Вот полный результат вашего запроса:\n\n' + lastAssistantMessage,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);
      }
      setShowPaywall(false);
    };

    return (
      <>
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
          <DialogContent className="max-w-4xl w-full p-0 h-[90vh] sm:h-auto">
            <div className="flex flex-col h-full max-h-[80vh]">
              <DialogTitle className="sr-only">AI Чат</DialogTitle>
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center gap-3">
                  <Bot className="h-6 w-6" />
                  <div>
                    <h2 className="text-lg font-semibold">AI Помощник</h2>
                    <p className="text-blue-100 text-sm">
                      {selectedNiche !== 'all' ? `Специализация: ${selectedNiche}` : 'Универсальный помощник'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleClear}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Settings */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      <Settings className="h-3 w-3 inline mr-1" />
                      Режим работы
                    </label>
                    <Select value={instructionType} onValueChange={(value) => setInstructionType(value as any)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">🎯 Маркетинг</SelectItem>
                        <SelectItem value="copywriting">✍️ Копирайтинг</SelectItem>
                        <SelectItem value="audience">👥 Аудитория</SelectItem>
                        <SelectItem value="creative">🎨 Креатив</SelectItem>
                        <SelectItem value="analytics">📊 Аналитика</SelectItem>
                        <SelectItem value="dkcp">🏛️ ДКЦП Анализ</SelectItem>
                        <SelectItem value="creative_script">📝 Создание Креативов</SelectItem>
                        <SelectItem value="goal_reformulation">{t('chatInterface.goalReformulationMode')}</SelectItem>
                        <SelectItem value="conversion_analysis">📈 Анализ конверсии</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      <Target className="h-3 w-3 inline mr-1" />
                      Ниша
                    </label>
                    <Select value={selectedNiche} onValueChange={(value) => setSelectedNiche(value as NicheType | 'all')}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все ниши</SelectItem>
                        {getAvailableNiches().map((niche) => (
                          <SelectItem key={niche.value} value={niche.value}>
                            {niche.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">{t('chatInterface.welcomeTitle')}</h3>
                    <p className="text-sm mb-4">
                      {t('chatInterface.welcomeDescription')}
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs">{t('chatInterface.tryExamples')}</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 sm:h-7 px-3 sm:px-2"
                          onClick={() => setInput("Анализируй рекламный скрипт")}
                        >
                          "Анализируй рекламный скрипт"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 sm:h-7 px-3 sm:px-2"
                          onClick={() => setInput("Помоги с ДКЦП анализом")}
                        >
                          "Помоги с ДКЦП анализом"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 sm:h-7 px-3 sm:px-2"
                          onClick={() => setInput("Создай креатив")}
                        >
                          "Создай креатив"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8 sm:h-7 px-3 sm:px-2"
                          onClick={() => setInput(t('chatInterface.goalReformulationExample') + ": " + t('goalReformulation.exampleBeforeText'))}
                        >
                          "{t('chatInterface.goalReformulationExample')}"
                        </Button>
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
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        
                        <Card className={`max-w-[80%] ${
                          message.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm whitespace-pre-wrap flex-1">
                                {message.content}
                              </p>
                              {message.role === 'assistant' && (
                                <Button
                                  onClick={() => copyMessage(message.content)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-gray-200"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div className="text-xs opacity-70 mt-2">
                              {message.timestamp.toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </CardContent>
                        </Card>
                        
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <Card className="bg-gray-50 border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-gray-600">{t('chatInterface.processing')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('chatInterface.placeholder')}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    size="sm"
                    className="px-4"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Paywall Modal */}
        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          originalText={lastUserMessage}
          improvedText={lastAssistantMessage}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </>
    );
  }
);

ChatInterface.displayName = 'ChatInterface'; 