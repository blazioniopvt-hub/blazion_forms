'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, Eye, MousePointerClick, CheckCircle, BarChart3,
  AlertTriangle, Lightbulb, ThumbsUp, Brain, Sparkles, Clock
} from 'lucide-react';

// ============================================
// Smart Analytics Dashboard with AI Insights
// ============================================

const INSIGHTS = [
  {
    type: 'warning' as const,
    title: 'Low Completion Rate on Page 2',
    description: 'Page 2 has a 42% dropoff rate. Consider moving critical questions earlier or simplifying this page.',
    metric: '42% dropoff',
    icon: <AlertTriangle size={18} />,
  },
  {
    type: 'suggestion' as const,
    title: 'Add Field Variety',
    description: 'Your form has 6 text fields in a row. Adding ratings, dropdowns, or image choices increases engagement by up to 25%.',
    icon: <Lightbulb size={18} />,
  },
  {
    type: 'success' as const,
    title: 'Peak Response Time Detected',
    description: 'Most responses come in at 10:00 AM. Schedule promotions around this time for maximum impact.',
    metric: '10:00 AM',
    icon: <Clock size={18} />,
  },
  {
    type: 'suggestion' as const,
    title: 'Add a Thank You Message',
    description: 'A custom thank-you message builds trust and can include next steps or links to related content.',
    icon: <Lightbulb size={18} />,
  },
  {
    type: 'warning' as const,
    title: 'Too Many Required Fields',
    description: 'You have 11 required fields. Forms with 5-7 required fields typically see 30% higher completion rates.',
    metric: '11 required',
    icon: <AlertTriangle size={18} />,
  },
  {
    type: 'success' as const,
    title: 'Great Conversion Rate',
    description: 'Your view-to-completion conversion rate of 34% is above the industry average of 25%. Keep it up!',
    metric: '34%',
    icon: <ThumbsUp size={18} />,
  },
];

const FIELD_SUGGESTIONS = [
  { field: 'Company Description', suggestion: '72% of respondents skip this field. Consider making it optional or adding a helpful prompt.' },
  { field: 'Phone Number', suggestion: 'Short answers detected (avg 6 chars). Consider using a formatted phone input instead.' },
  { field: 'Additional Comments', suggestion: 'Respondents give very short answers (avg 12 chars). Add a prompt to encourage detailed responses.' },
];

export default function SmartAnalyticsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'insights' | 'fields'>('overview');

  const stats = {
    totalViews: 4283,
    totalStarts: 2156,
    totalCompletions: 1489,
    conversionRate: '34.8%',
    completionRate: '69.1%',
    avgTime: '2m 34s',
  };

  const dailyData = Array.from({ length: 14 }).map((_, i) => {
    const date = new Date(); date.setDate(date.getDate() - (13 - i));
    return {
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 400) + 150,
      completions: Math.floor(Math.random() * 180) + 50,
    };
  });
  const maxViews = Math.max(...dailyData.map(d => d.views));

  const INSIGHT_STYLES = {
    warning: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
    suggestion: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6' },
    success: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', color: '#10b981' },
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => router.push('/dashboard')}><ArrowLeft size={18} /></button>
          <span className="dashboard-logo">⚡ Blazion Forms</span>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Brain size={28} color="#7c3aed" /> Smart Analytics
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
              AI-powered insights to improve your forms
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--muted)', borderRadius: 10, padding: 4, marginBottom: 28, width: 'fit-content' }}>
          {(['overview', 'insights', 'fields'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                background: selectedTab === tab ? 'var(--card)' : 'transparent',
                color: selectedTab === tab ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: selectedTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab === 'insights' && <Sparkles size={12} style={{ marginRight: 6 }} />}
              {tab}
            </button>
          ))}
        </div>

        {selectedTab === 'overview' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
              {[
                { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: <Eye size={18} />, color: '#7c3aed' },
                { label: 'Form Starts', value: stats.totalStarts.toLocaleString(), icon: <MousePointerClick size={18} />, color: '#3b82f6' },
                { label: 'Completions', value: stats.totalCompletions.toLocaleString(), icon: <CheckCircle size={18} />, color: '#10b981' },
                { label: 'Conversion', value: stats.conversionRate, icon: <TrendingUp size={18} />, color: '#f59e0b' },
                { label: 'Completion Rate', value: stats.completionRate, icon: <BarChart3 size={18} />, color: '#ec4899' },
                { label: 'Avg. Time', value: stats.avgTime, icon: <Clock size={18} />, color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} style={{ padding: '18px 20px', background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, marginBottom: 6 }}>
                    {s.icon}
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted-foreground)' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ padding: 24, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Daily Views & Completions (14 days)</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180 }}>
                {dailyData.map(d => (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: '100%', display: 'flex', gap: 2 }}>
                      <div style={{ flex: 1, height: `${(d.views / maxViews) * 160}px`, background: 'linear-gradient(180deg, #7c3aed, #a855f7)', borderRadius: '3px 3px 0 0', minHeight: 3 }} title={`${d.views} views`} />
                      <div style={{ flex: 1, height: `${(d.completions / maxViews) * 160}px`, background: 'linear-gradient(180deg, #10b981, #34d399)', borderRadius: '3px 3px 0 0', minHeight: 3 }} title={`${d.completions} completions`} />
                    </div>
                    <span style={{ fontSize: 8, color: 'var(--muted-foreground)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 32 }}>{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#7c3aed' }} /> Views</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} /> Completions</div>
              </div>
            </div>
          </>
        )}

        {selectedTab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={18} color="#7c3aed" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>AI-Generated Insights</span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 10px', borderRadius: 50 }}>
                {INSIGHTS.length} insights
              </span>
            </div>

            {INSIGHTS.map((insight, i) => {
              const s = INSIGHT_STYLES[insight.type];
              return (
                <div key={i} style={{ padding: '18px 20px', borderRadius: 12, background: s.bg, border: `1px solid ${s.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ color: s.color, marginTop: 2, flexShrink: 0 }}>{insight.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {insight.title}
                        {insight.metric && (
                          <span style={{ fontSize: 11, background: `${s.color}15`, color: s.color, padding: '2px 8px', borderRadius: 50, fontWeight: 700 }}>
                            {insight.metric}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6, margin: 0 }}>{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTab === 'fields' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lightbulb size={18} color="#3b82f6" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Field-Level Suggestions</span>
            </div>

            {FIELD_SUGGESTIONS.map((fs, i) => (
              <div key={i} style={{
                padding: '16px 20px', marginBottom: 12, borderRadius: 12,
                background: 'var(--card)', border: '1px solid var(--card-border)',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#3b82f6' }}>📝 {fs.field}</div>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6, margin: 0 }}>{fs.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
