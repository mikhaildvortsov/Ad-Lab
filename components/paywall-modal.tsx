'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, CreditCard, Smartphone, QrCode, X, RefreshCw, AlertTriangle, CheckCircle, LogIn } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocale } from '@/lib/use-locale';
import { useTranslation } from '@/lib/translations';

interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; // Для зачеркнутой цены
  features: string[];
  improvements: number;
  popular?: boolean;
}

const getPlans = (t: (key: string) => string): Plan[] => [
  {
    id: 'week',
    name: t('paywallModal.plans.week.name'),
    price: 1990,
    features: [
      t('paywallModal.plans.week.features.0'),
      t('paywallModal.plans.week.features.1'),
      t('paywallModal.plans.week.features.2'),
      t('paywallModal.plans.week.features.3')
    ],
    improvements: -1
  },
  {
    id: 'month',
    name: t('paywallModal.plans.month.name'),
    price: 2990,
    originalPrice: 6990,
    features: [
      t('paywallModal.plans.month.features.0'),
      t('paywallModal.plans.month.features.1'),
      t('paywallModal.plans.month.features.2'),
      t('paywallModal.plans.month.features.3'),
      t('paywallModal.plans.month.features.4')
    ],
    improvements: -1,
    popular: true
  },
  {
    id: 'quarter',
    name: t('paywallModal.plans.quarter.name'),
    price: 9990,
    features: [
      t('paywallModal.plans.quarter.features.0'),
      t('paywallModal.plans.quarter.features.1'),
      t('paywallModal.plans.quarter.features.2'),
      t('paywallModal.plans.quarter.features.3'),
      t('paywallModal.plans.quarter.features.4')
    ],
    improvements: -1
  }
];

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  improvedText?: string;
  originalText?: string;
  onPaymentSuccess?: () => void;
}

export function PaywallModal({ 
  open, 
  onOpenChange, 
  improvedText, 
  originalText,
  onPaymentSuccess 
}: PaywallModalProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { t } = useTranslation(locale);
  const { user, isAuthenticated, loading, login } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sbp'>('sbp');
  const [sbpLoading, setSbpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sbpPaymentData, setSbpPaymentData] = useState<{
    qrCode: string;
    qrUrl: string;
    paymentId: string;
    orderId: string;
    amount: number;
    expiresAt: string;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  const plans = getPlans(t);

  // Debug authentication state
  useEffect(() => {
    console.log('PaywallModal auth state:', { user, isAuthenticated, loading });
  }, [user, isAuthenticated, loading]);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setError(null);
    
    // Ждем загрузки данных аутентификации
    if (loading) {
      setError(t('paywallModal.payment.error.checking'));
      return;
    }
    
    // Проверяем аутентификацию перед переходом к оплате
    if (!isAuthenticated) {
      setError(t('paywallModal.payment.error.authRequired'));
      return;
    }
    
    setShowPayment(true);
    // Сбрасываем SBP данные при выборе нового плана
    setSbpPaymentData(null);
    setPaymentStatus(null);
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (paymentMethod === 'sbp') {
        await handleSBPPayment();
      } else {
        await handleCardPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(t('paywallModal.payment.error.paymentCreation'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSBPPayment = async () => {
    if (!selectedPlan) return;

    setSbpLoading(true);
    setError(null);
    
    try {
      // Создаем платеж через API
      const response = await fetch('/api/payments/sbp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amount: selectedPlan.price
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setSbpPaymentData({
          qrCode: data.qrCode,
          qrUrl: data.qrUrl,
          paymentId: data.paymentId,
          orderId: data.orderId,
          amount: data.amount,
          expiresAt: data.expiresAt
        });

        setPaymentStatus('pending');

        // Начинаем периодическую проверку статуса платежа
        checkPaymentStatus(data.paymentId);
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('SBP payment error:', error);
      const errorMessage = error.message || t('paywallModal.payment.error.sbpPayment');
      setError(errorMessage);
    } finally {
      setSbpLoading(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 60; // 10 минут проверки (каждые 10 секунд)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const response = await fetch(`/api/payments/sbp?paymentId=${paymentId}`);
        const data = await response.json();

        if (data.success) {
          if (data.status === 'completed') {
            // Платеж успешно завершен
            setPaymentStatus('completed');
            setCheckingStatus(false);
            
            // Уведомляем о успешной оплате
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            
            // Автоматически закрываем модал через 3 секунды
            setTimeout(() => {
              onOpenChange(false);
              resetModal();
            }, 3000);
            
            return;
          } else if (data.status === 'failed') {
            setPaymentStatus('failed');
            setError(t('paywallModal.payment.error.paymentFailed'));
            setCheckingStatus(false);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Продолжаем проверку через 10 секунд
          setTimeout(checkStatus, 10000);
        } else {
          // Превышено время ожидания
          setError(t('paywallModal.payment.error.paymentTimeout'));
          setCheckingStatus(false);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        attempts++;
        setCheckingStatus(false);
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        } else {
          setError(t('paywallModal.payment.error.statusCheck'));
        }
      }
    };

    // Начинаем первую проверку через 5 секунд
    setTimeout(checkStatus, 5000);
  };

  const handleCardPayment = async () => {
    // Здесь будет интеграция с платежной системой для карт
    console.log('Processing card payment for plan:', selectedPlan);
    setError(t('paywallModal.payment.error.cardPayment'));
  };

  const resetModal = () => {
    setShowPayment(false);
    setSelectedPlan(null);
    setSbpPaymentData(null);
    setPaymentStatus(null);
    setError(null);
    setIsLoading(false);
    setSbpLoading(false);
    setCheckingStatus(false);
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return locale === 'en' ? 'Expired' : 'Истекло';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (showPayment && selectedPlan) {
    return (
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) resetModal();
        onOpenChange(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {t('paywallModal.payment.title').replace('{planName}', selectedPlan.name)}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => resetModal()}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center justify-center gap-2">
                {selectedPlan.originalPrice && (
                  <span className="text-gray-500 line-through text-sm">₽{selectedPlan.originalPrice}</span>
                )}
                <span className="text-lg font-semibold">₽{selectedPlan.price}</span>
                {selectedPlan.originalPrice && (
                  <span className="inline-flex items-center rounded-full border-transparent bg-red-600 text-white px-2.5 py-0.5 text-xs font-semibold">
                    {t('paywallModal.payment.discount').replace('{percent}', Math.round((1 - selectedPlan.price / selectedPlan.originalPrice) * 100).toString())}
                  </span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'card' | 'sbp')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sbp" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                {locale === 'en' ? 'SBP' : 'СБП'}
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-2" disabled>
                <CreditCard className="h-4 w-4" />
                {locale === 'en' ? 'Card (soon)' : 'Карта (скоро)'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sbp" className="space-y-4">
              {paymentStatus === 'completed' ? (
                // Успешная оплата
                <div className="text-center space-y-4">
                  <div className="bg-green-50 rounded-lg p-6">
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-3" />
                    <h3 className="text-lg font-medium text-green-800 mb-2">{t('paywallModal.payment.sbp.success.title')}</h3>
                    <p className="text-sm text-green-600">
                      {t('paywallModal.payment.sbp.success.description').replace('{planName}', selectedPlan.name)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('paywallModal.payment.sbp.success.autoClose')}
                  </p>
                </div>
              ) : !sbpPaymentData ? (
                // Начальное состояние - кнопка создания платежа
                <div className="text-center space-y-4">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <Smartphone className="h-16 w-16 mx-auto text-blue-500 mb-3" />
                    <h3 className="text-lg font-medium mb-2">{t('paywallModal.payment.sbp.title')}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('paywallModal.payment.sbp.description')}
                    </p>
                    <p className="font-medium text-lg">{t('paywallModal.payment.sbp.amount').replace('{amount}', selectedPlan.price.toString())}</p>
                  </div>
                  
                  <Button 
                    onClick={handleSBPPayment}
                    disabled={sbpLoading}
                    className="w-full h-12 text-base"
                  >
                    {sbpLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('paywallModal.payment.sbp.creating')}
                      </>
                    ) : (
                      t('paywallModal.payment.sbp.createPayment')
                    )}
                  </Button>
                  
                  <div className="text-xs text-gray-500">
                    {t('paywallModal.payment.sbp.afterCreation')}
                  </div>
                </div>
              ) : (
                // Состояние с QR-кодом
                <div className="text-center space-y-4">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                    {sbpPaymentData.qrCode ? (
                      <img 
                        src={sbpPaymentData.qrCode} 
                        alt={t('paywallModal.payment.sbp.qrCodeAlt')}
                        className="h-48 w-48 mx-auto mb-3 border border-gray-100 rounded-lg"
                      />
                    ) : (
                      <div className="h-48 w-48 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                        <QrCode className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                    <p className="text-sm text-gray-600">{t('paywallModal.payment.sbp.qrCodeAlt')}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('paywallModal.payment.sbp.qrCodeDescription')}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {t('paywallModal.payment.sbp.orderNumber').replace('{orderId}', sbpPaymentData.orderId.slice(-8))}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="font-medium">{t('paywallModal.payment.sbp.amount').replace('{amount}', sbpPaymentData.amount.toString())}</p>
                    
                    <div className="text-sm text-gray-600">
                      {t('paywallModal.payment.sbp.timeRemaining').replace('{time}', formatTimeRemaining(sbpPaymentData.expiresAt))}
                    </div>
                    
                    {sbpPaymentData.qrUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(sbpPaymentData.qrUrl, '_blank')}
                        className="w-full"
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        {t('paywallModal.payment.sbp.openInBank')}
                      </Button>
                    )}
                    
                    <div className={`border rounded-lg p-3 ${
                      paymentStatus === 'failed' 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-2 text-sm">
                        {checkingStatus ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                        ) : paymentStatus === 'failed' ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <span className={
                          paymentStatus === 'failed' 
                            ? 'text-red-800' 
                            : 'text-blue-800'
                        }>
                          {paymentStatus === 'failed' 
                            ? t('paywallModal.payment.sbp.status.error') 
                            : checkingStatus 
                              ? t('paywallModal.payment.sbp.status.checking') 
                              : t('paywallModal.payment.sbp.status.waiting')
                          }
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => setSbpPaymentData(null)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-gray-500"
                    >
                      {t('paywallModal.payment.sbp.createNew')}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="card" className="space-y-4">
              <div className="text-center p-6 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>{t('paywallModal.payment.card.unavailable')}</p>
                <p className="text-sm mt-2">{t('paywallModal.payment.card.useSbp')}</p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="text-xs text-gray-500 text-center">
            {t('paywallModal.payment.security')}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-center">
            {originalText && improvedText 
              ? t('paywallModal.main.titleWithResult')
              : t('paywallModal.main.titleDefault')
            }
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {originalText && improvedText 
              ? t('paywallModal.main.descriptionWithResult')
              : t('paywallModal.main.descriptionDefault')
            }
          </DialogDescription>
        </DialogHeader>

        {/* Authentication Warning */}
        {!loading && !isAuthenticated && (
          <Alert className="border-blue-200 bg-blue-50 py-2">
            <LogIn className="h-3 w-3 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs">
              {t('paywallModal.main.authWarning')}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview Results */}
        {originalText && improvedText && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-xs text-gray-700 mb-1">{t('paywallModal.main.originalText')}</h4>
              <div className="text-xs bg-white p-2 rounded border max-h-20 overflow-y-auto">
                {originalText}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-xs text-gray-700 mb-1">{t('paywallModal.main.improvedText')}</h4>
              <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200 max-h-20 overflow-y-auto relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white flex items-end justify-center pb-1">
                  <span className="inline-flex items-center rounded-full border-transparent bg-blue-600 text-white px-2.5 py-0.5 text-xs font-semibold">
                    {t('paywallModal.main.availableAfterPayment')}
                  </span>
                </div>
                <div className="blur-sm">
                  {improvedText?.substring(0, 100)}...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Что включено во все планы */}
        {(!originalText || !improvedText) && (
          <div className="mb-4">
            <div className="bg-gray-50 rounded-lg p-3 mx-auto">
              <h3 className="text-sm font-semibold mb-2 text-center">{t('paywallModal.main.whatsIncluded')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                  {t('paywallModal.main.features.algorithms')}
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                  {t('paywallModal.main.features.security')}
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                  {t('paywallModal.main.features.support')}
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                  {t('paywallModal.main.features.updates')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full border-transparent bg-blue-500 text-white px-2.5 py-0.5 text-xs font-semibold">
                      {t('paywallModal.main.popular')}
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-4">
                  <CardTitle className="text-xl mb-1">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    {plan.originalPrice && (
                      <div className="text-base line-through text-gray-400">
                        ₽{plan.originalPrice}
                      </div>
                    )}
                    <div className="text-3xl font-bold text-gray-900">
                      ₽{plan.price}
                      <span className="text-sm font-normal text-gray-500">/мес</span>
                    </div>
                    {plan.originalPrice && (
                      <div className="text-sm text-green-600 font-medium">
                        {t('paywallModal.main.savings').replace('{amount}', (plan.originalPrice - plan.price).toString())}
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {plan.improvements === -1 
                      ? t('paywallModal.main.unlimitedImprovements') 
                      : t('paywallModal.main.improvementsPerMonth').replace('{count}', plan.improvements.toString())
                    }
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="text-center flex-1 flex flex-col justify-between p-3">
                  <ul className="space-y-2 mb-4 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-left">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {loading ? (
                    <Button 
                      disabled
                      className="w-full h-11 text-base"
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      {t('paywallModal.main.checking')}
                    </Button>
                  ) : !isAuthenticated ? (
                    <Button 
                      onClick={login}
                      variant="outline"
                      className="w-full h-11 text-base border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      {t('paywallModal.main.loginToPay')}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full h-11 text-base ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    >
                      {t('paywallModal.main.selectPlan')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 