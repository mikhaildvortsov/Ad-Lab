'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, CreditCard, Smartphone, X, RefreshCw, AlertTriangle, CheckCircle, LogIn } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocale } from '@/lib/use-locale';
import { useTranslation } from '@/lib/translations';
interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number; 
  features: string[];
  improvements: number;
  popular?: boolean;
}
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'tribute'>('tribute');
  const [tributeLoading, setTributeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [tributePaymentData, setTributePaymentData] = useState<{
    paymentUrl: string;
    tributeUrl: string;
    paymentId: string;
    orderId: string;
    amount: number;
    expiresAt: string;
    serverTime: string;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const response = await fetch('/api/plans');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPlans(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };
    if (open) {
      fetchPlans();
    }
  }, [open]);
  useEffect(() => {
    if (open && isAuthenticated && !csrfToken) {
      const fetchCsrfToken = async () => {
        try {
          const response = await fetch('/api/csrf-token');
          if (response.ok) {
            const data = await response.json();
            setCsrfToken(data.csrfToken);
          }
        } catch (error) {
          console.error('Failed to get CSRF token:', error);
        }
      };
      fetchCsrfToken();
    }
  }, [open, isAuthenticated, csrfToken]);
  useEffect(() => {
    console.log('PaywallModal auth state:', { user, isAuthenticated, loading });
  }, [user, isAuthenticated, loading]);
  const getPlanName = (planId: string) => {
    try {
      const translationKey = `paywallModal.plans.${planId}.name`;
      const translation = t(translationKey);
      if (translation === translationKey) {
        const fallbackNames: Record<string, string> = {
          'week': 'Неделя',
          'month': 'Месяц', 
          'quarter': 'Три месяца'
        };
        return fallbackNames[planId] || planId;
      }
      return translation;
    } catch (error) {
      console.error('Error getting plan name:', error);
      const fallbackNames: Record<string, string> = {
        'week': 'Неделя',
        'month': 'Месяц',
        'quarter': 'Три месяца'
      };
      return fallbackNames[planId] || planId;
    }
  };
  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setError(null);
    if (loading) {
      setError(t('paywallModal.payment.error.checking'));
      return;
    }
    if (!isAuthenticated) {
      setError(t('paywallModal.payment.error.authRequired'));
      return;
    }
    setShowPayment(true);
    setTributePaymentData(null);
    setPaymentStatus(null);
  };
  const handlePayment = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);
    setError(null);
    try {
      if (paymentMethod === 'tribute') {
        await handleTributePayment();
      } else {
        await handleCardPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(t('paywallModal.payment.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };
  const handleTributePayment = async () => {
    if (!selectedPlan) return;
    if (!csrfToken) {
      setError('Отсутствует токен безопасности. Попробуйте перезагрузить страницу.');
      return;
    }
    setTributeLoading(true);
    setError(null);
    try {
      console.log('Creating Tribute payment with data:', {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.price
      });
      const response = await fetch('/api/payments/tribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amount: selectedPlan.price
        }),
      });
      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);
      let data;
      try {
        const responseText = await response.text();
        console.log('API Response text:', responseText);
        if (!responseText) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }
      console.log('Parsed API Response:', data);
      if (!response.ok) {
        throw new Error(data?.error || `HTTP error! status: ${response.status}`);
      }
      if (data?.success) {
        setTributePaymentData({
          paymentUrl: data.paymentUrl,
          tributeUrl: data.tributeUrl,
          paymentId: data.paymentId,
          orderId: data.orderId,
          amount: data.amount,
          expiresAt: data.expiresAt,
          serverTime: data.serverTime
        });
        setPaymentStatus('pending');
        checkPaymentStatus(data.paymentId);
      } else {
        throw new Error(data?.error || 'Failed to create payment');
      }
    } catch (error: any) {
      console.error('Tribute payment error:', error);
      const errorMessage = error.message || 'Произошла ошибка при создании платежа';
      setError(errorMessage);
    } finally {
      setTributeLoading(false);
    }
  };
  const checkPaymentStatus = async (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 60; 
    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const response = await fetch(`/api/payments/tribute?paymentId=${paymentId}`, {
          headers: {
            'X-CSRF-Token': csrfToken || '',
          }
        });
        const data = await response.json();
        if (data.success) {
          const status = data.status;
          if (status === 'completed') {
            setPaymentStatus('completed');
            setCheckingStatus(false);
            setTimeout(() => {
              resetModal();
              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
            }, 5000);
            return;
          } else if (status === 'failed') {
            setPaymentStatus('failed');
            setError(t('paywallModal.payment.error.tributePayment'));
            setCheckingStatus(false);
            return;
          }
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setPaymentStatus('failed');
          setError(t('paywallModal.payment.error.timeout'));
          setCheckingStatus(false);
        }
      } catch (error) {
        console.error('Status check error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setPaymentStatus('failed');
          setError(t('paywallModal.payment.error.timeout'));
          setCheckingStatus(false);
        }
      }
    };
    setTimeout(checkStatus, 3000);
  };
  const handleCardPayment = async () => {
    setError(t('paywallModal.payment.card.useTribute'));
  };
  const resetModal = () => {
    setSelectedPlan(null);
    setShowPayment(false);
    setPaymentMethod('tribute');
    setError(null);
    setCsrfToken(null);
    setTributePaymentData(null);
    setPaymentStatus(null);
    setCheckingStatus(false);
    setTributeLoading(false);
    setPaymentExpired(false);
  };
  useEffect(() => {
    if (!tributePaymentData || paymentStatus !== 'pending') return;
    const timer = setInterval(() => {
      const now = Date.now();
      const serverTimestamp = new Date(tributePaymentData.serverTime).getTime();
      const timeOffset = now - serverTimestamp;
      const expiry = new Date(tributePaymentData.expiresAt).getTime() - timeOffset;
      if (now >= expiry) {
        setPaymentStatus('failed');
        setError(t('paywallModal.payment.error.timeout'));
        setPaymentExpired(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [tributePaymentData, paymentStatus, t]);
  useEffect(() => {
    if (paymentStatus === 'completed') {
      const timer = setTimeout(() => {
        resetModal();
        onOpenChange(false);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, onOpenChange, onPaymentSuccess]);
  if (showPayment && selectedPlan) {
    return (
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) resetModal();
        onOpenChange(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {t('paywallModal.payment.title').replace('{planName}', getPlanName(selectedPlan.name))}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => resetModal()}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              <span className="flex items-center justify-center gap-2">
                {selectedPlan.originalPrice && (
                  <span className="text-gray-500 line-through text-sm">₽{selectedPlan.originalPrice}</span>
                )}
                <span className="text-lg font-semibold">₽{selectedPlan.price}</span>
                {selectedPlan.originalPrice && (
                  <span className="inline-flex items-center rounded-full border-transparent bg-red-600 text-white px-2.5 py-0.5 text-xs font-semibold">
                    {t('paywallModal.payment.discount').replace('{percent}', Math.round((1 - selectedPlan.price / selectedPlan.originalPrice) * 100).toString())}
                  </span>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'card' | 'tribute')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tribute" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                {locale === 'en' ? 'Tribute' : 'Тribute'}
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-2" disabled>
                <CreditCard className="h-4 w-4" />
                {locale === 'en' ? 'Card (soon)' : 'Карта (скоро)'}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="tribute" className="space-y-4">
              {paymentStatus === 'completed' ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 rounded-lg p-6">
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-3" />
                    <h3 className="text-lg font-medium text-green-800 mb-2">{t('paywallModal.payment.tribute.success.title')}</h3>
                    <p className="text-sm text-green-600">
                      {t('paywallModal.payment.tribute.success.description').replace('{planName}', selectedPlan.name)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('paywallModal.payment.tribute.success.autoClose')}
                  </p>
                </div>
              ) : !tributePaymentData ? (
                <div className="text-center space-y-4">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <Smartphone className="h-16 w-16 mx-auto text-blue-500 mb-3" />
                    <h3 className="text-lg font-medium mb-2">{t('paywallModal.payment.tribute.title')}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('paywallModal.payment.tribute.description')}
                    </p>
                    <p className="font-medium text-lg">{t('paywallModal.payment.tribute.amount').replace('{amount}', selectedPlan.price.toString())}</p>
                  </div>
                  <Button 
                    onClick={handleTributePayment}
                    disabled={tributeLoading}
                    className="w-full h-12 text-base"
                  >
                    {tributeLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('paywallModal.payment.tribute.creating')}
                      </>
                    ) : (
                      t('paywallModal.payment.tribute.createPayment')
                    )}
                  </Button>
                  <div className="text-xs text-gray-500">
                    {t('paywallModal.payment.tribute.afterCreation')}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                    <div className="h-48 w-48 mx-auto mb-3 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Smartphone className="h-24 w-24 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{t('paywallModal.payment.tribute.title')}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('paywallModal.payment.tribute.description')}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {t('paywallModal.payment.tribute.orderNumber').replace('{orderId}', tributePaymentData.orderId.slice(-8))}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="font-medium">{t('paywallModal.payment.tribute.amount').replace('{amount}', tributePaymentData.amount.toString())}</p>
                    {paymentExpired && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          {t('paywallModal.payment.expired')}
                        </AlertDescription>
                      </Alert>
                    )}
                    {tributePaymentData.tributeUrl && (
                      <Button 
                        variant="default" 
                        size="lg"
                        onClick={() => window.open(tributePaymentData.tributeUrl, '_blank')}
                        className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        {t('paywallModal.payment.tribute.openInTelegram')}
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
                            ? t('paywallModal.payment.tribute.status.error') 
                            : checkingStatus 
                              ? t('paywallModal.payment.tribute.status.checking') 
                              : t('paywallModal.payment.tribute.status.waiting')
                          }
                        </span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setTributePaymentData(null)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-gray-500"
                    >
                      {t('paywallModal.payment.tribute.createNew')}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="card" className="space-y-4">
              <div className="text-center p-6 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>{t('paywallModal.payment.card.unavailable')}</p>
                <p className="text-sm mt-2">{t('paywallModal.payment.card.useTribute')}</p>
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
        {}
        {!loading && !isAuthenticated && (
          <Alert className="border-blue-200 bg-blue-50 py-2">
            <LogIn className="h-3 w-3 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs">
              {t('paywallModal.main.authWarning')}
            </AlertDescription>
          </Alert>
        )}
        {}
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        {}
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
        {}
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
        {}
        <div className="flex-1 min-h-0">
          {loadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {plans.map((plan: Plan) => (
              <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full border-transparent bg-blue-500 text-white px-2.5 py-0.5 text-xs font-semibold">
                      {t('paywallModal.main.popular')}
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-4">
                  <CardTitle className="text-xl mb-1">{getPlanName(plan.name)}</CardTitle>
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
            )}
          </div>
      </DialogContent>
    </Dialog>
  );
}
