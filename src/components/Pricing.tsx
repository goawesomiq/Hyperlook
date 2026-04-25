import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Star, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { useLanguage } from '../lib/LanguageContext';

interface PricingProps {
  onClose: () => void;
  onLoginRequest: () => void;
}

export default function Pricing({ onClose, onLoginRequest }: PricingProps) {
  const { t } = useLanguage();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const PLANS = [
    {
      id: 'basic',
      name: t('Basic', 'Basic'),
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      price: 799,
      coins: 40,
      coinPrice: 20,
      color: 'blue',
      popular: false,
      features: [
        t('40 Standard (1K) Generations', '40 Standard (1K) Generations'),
        t('~26 High-Res (2K) Generations', '~26 High-Res (2K) Generations'),
        t('20 Ultra (4K) Generations', '20 Ultra (4K) Generations'),
        t('Standard Support', 'Standard Support')
      ]
    },
    {
      id: 'plus',
      name: t('Plus', 'Plus'),
      icon: <Star className="w-6 h-6 text-amber-500" />,
      price: 1749,
      coins: 100,
      coinPrice: 17.5,
      color: 'amber',
      popular: true,
      features: [
        t('100 Standard (1K) Generations', '100 Standard (1K) Generations'),
        t('~66 High-Res (2K) Generations', '~66 High-Res (2K) Generations'),
        t('50 Ultra (4K) Generations', '50 Ultra (4K) Generations'),
        t('Priority Support', 'Priority Support'),
        t('Most Preferred Plan', 'Most Preferred Plan')
      ]
    },
    {
      id: 'pro',
      name: t('Pro', 'Pro'),
      icon: <Crown className="w-6 h-6 text-purple-500" />,
      price: 3499,
      coins: 250,
      coinPrice: 14,
      color: 'purple',
      popular: false,
      features: [
        t('250 Standard (1K) Generations', '250 Standard (1K) Generations'),
        t('~166 High-Res (2K) Generations', '~166 High-Res (2K) Generations'),
        t('125 Ultra (4K) Generations', '125 Ultra (4K) Generations'),
        t('24/7 Premium Support', '24/7 Premium Support'),
        t('Best Value per Coin', 'Best Value per Coin')
      ]
    }
  ];

  const handleBuy = async (plan: typeof PLANS[0]) => {
    if (!auth.currentUser) {
      onLoginRequest();
      return;
    }

    setLoadingPlan(plan.id);
    try {
      // 0. Get Config
      const configRes = await fetch('/api/config');
      const { razorpayKeyId } = await configRes.json();

      // 1. Create order on backend
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, amount: plan.price, currency: 'INR' })
      });
      
      const orderData = await orderRes.json();
      
      if (!orderData.id) throw new Error('Failed to create order');

      // 2. Open Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Hyperlook AI",
        description: `${plan.name} Plan - ${plan.coins} Coins`,
        order_id: orderData.id,
        handler: async function (response: any) {
          // 3. Verify payment on backend
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: auth.currentUser?.uid,
              creditsToAdd: plan.coins,
              planId: plan.id,
              amount: plan.price
            })
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert(`Successfully added ${plan.coins} coins to your wallet!`);
            onClose();
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: {
          email: auth.currentUser.email || '',
        },
        theme: {
          color: plan.color === 'amber' ? '#f59e0b' : plan.color === 'purple' ? '#a855f7' : '#3b82f6',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(response.error.description);
      });
      rzp.open();

    } catch (error) {
      console.error(error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto pt-10 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t('Choose Your Plan', 'Choose Your Plan')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border-2 ${
                plan.popular 
                  ? 'border-amber-500 shadow-amber-500/20 md:-mt-4' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                  {t('Most Demanded', 'Most Demanded')}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl bg-${plan.color}-100 dark:bg-${plan.color}-900/30`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{plan.coins} {t('Coins', 'Coins')}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">₹{plan.price}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('Just', 'Just')} ₹{plan.coinPrice} {t('per coin', 'per coin')}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 text-${plan.color}-500`} />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(plan)}
                disabled={loadingPlan === plan.id}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  plan.popular
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                }`}
              >
                {loadingPlan === plan.id ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {t('Buy', 'Buy')} {plan.name} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center bg-slate-800 rounded-2xl p-8 border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-2">{t('Enterprise Plan', 'Enterprise Plan')}</h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            {t('Need more than 250 coins? Get custom pricing, dedicated support, and API access for high-volume generation.', 'Need more than 250 coins? Get custom pricing, dedicated support, and API access for high-volume generation.')}
          </p>
          <button className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-100 transition-colors">
            {t('Contact Us', 'Contact Us')}
          </button>
        </div>
      </div>
    </div>
  );
}
