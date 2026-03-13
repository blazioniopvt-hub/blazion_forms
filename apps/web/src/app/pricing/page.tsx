'use client';

import { useRouter } from 'next/navigation';
import { Check, X, Zap, ArrowLeft } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    color: '#71717a',
    features: [
      { label: '3 forms', included: true },
      { label: '100 responses/month', included: true },
      { label: '1 team member', included: true },
      { label: '5 AI generations/month', included: true },
      { label: '100MB storage', included: true },
      { label: 'Basic analytics', included: true },
      { label: 'Email notifications', included: true },
      { label: 'Custom themes', included: false },
      { label: 'Integrations', included: false },
      { label: 'Remove branding', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    description: 'For growing businesses',
    color: '#7c3aed',
    popular: true,
    features: [
      { label: '50 forms', included: true },
      { label: '10,000 responses/month', included: true },
      { label: '5 team members', included: true },
      { label: '100 AI generations/month', included: true },
      { label: '5GB storage', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Email & webhook notifications', included: true },
      { label: 'Custom themes', included: true },
      { label: 'Slack, Sheets, Notion', included: true },
      { label: 'Remove branding', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 49,
    description: 'For teams that need everything',
    color: '#f59e0b',
    features: [
      { label: 'Unlimited forms', included: true },
      { label: 'Unlimited responses', included: true },
      { label: 'Unlimited team members', included: true },
      { label: 'Unlimited AI generations', included: true },
      { label: '50GB storage', included: true },
      { label: 'AI insights & predictions', included: true },
      { label: 'Full automation engine', included: true },
      { label: 'Custom CSS & branding', included: true },
      { label: 'All integrations + Zapier', included: true },
      { label: 'Priority support', included: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0524, #1a0a3e, #0d0821)' }}>
      <nav className="dashboard-nav" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => router.push('/dashboard')} style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa' }}>
            <ArrowLeft size={18} />
          </button>
          <span className="dashboard-logo">⚡ Blazion Forms</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', marginBottom: 12, background: 'linear-gradient(180deg, #fff, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Simple, Transparent Pricing
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: 17, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                padding: 32,
                borderRadius: 20,
                background: plan.popular ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${plan.popular ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff',
                  padding: '4px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
                }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ color: plan.color, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {plan.name}
              </div>

              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: '#fff' }}>${plan.price}</span>
                <span style={{ color: '#71717a', fontSize: 15 }}>/month</span>
              </div>
              <p style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>{plan.description}</p>

              <button
                className={plan.popular ? 'btn-primary' : 'btn-secondary'}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 28, borderRadius: 12 }}
                onClick={() => plan.id !== 'free' && alert('Stripe checkout integration ready!')}
              >
                {plan.id === 'free' ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                    {f.included ? (
                      <Check size={16} color="#10b981" />
                    ) : (
                      <X size={16} color="#3f3f46" />
                    )}
                    <span style={{ color: f.included ? '#d4d4d8' : '#3f3f46' }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
