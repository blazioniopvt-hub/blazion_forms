'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Sparkles, ArrowRight, Wand2, Loader2, CheckCircle, FileText } from 'lucide-react';

// ============================================
// AI Form Generator — natural language to form
// ============================================

const EXAMPLE_PROMPTS = [
  { label: '💼 Job Application', prompt: 'Create a job application form' },
  { label: '⭐ Customer Feedback', prompt: 'Create a customer feedback survey' },
  { label: '📧 Contact Form', prompt: 'Create a contact us form' },
  { label: '🎫 Event Registration', prompt: 'Create an event registration form' },
  { label: '📊 Survey', prompt: 'Create a general survey form' },
  { label: '📰 Newsletter Signup', prompt: 'Create a newsletter signup form' },
  { label: '🎯 Lead Capture', prompt: 'Create a lead capture form' },
];

export default function AiGeneratorPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'generating' | 'success'>('input');
  const [progressText, setProgressText] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStep('generating');
    setGenerating(true);

    // Simulate AI generation process with visual steps
    const steps = [
      'Analyzing your requirements...',
      'Identifying form structure...',
      'Generating field types...',
      'Creating validation rules...',
      'Applying smart defaults...',
      'Finalizing form layout...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgressText(steps[i]);
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
    }

    // Demo: generate form locally (will use API in production)
    const formData = generateFormLocally(prompt);
    setGenerated(formData);
    setStep('success');
    setGenerating(false);
  };

  const generateFormLocally = (input: string) => {
    const lower = input.toLowerCase();
    const templates: Record<string, { title: string; fields: { type: string; label: string; required: boolean }[] }> = {
      'job application': {
        title: 'Job Application Form',
        fields: [
          { type: 'short_text', label: 'Full Name', required: true },
          { type: 'email', label: 'Email Address', required: true },
          { type: 'phone', label: 'Phone Number', required: true },
          { type: 'url', label: 'LinkedIn Profile', required: false },
          { type: 'dropdown', label: 'Years of Experience', required: true },
          { type: 'long_text', label: 'Current Role & Responsibilities', required: true },
          { type: 'file_upload', label: 'Upload Resume/CV', required: true },
          { type: 'long_text', label: 'Why are you interested in this role?', required: true },
          { type: 'dropdown', label: 'When can you start?', required: true },
        ],
      },
      'customer feedback': {
        title: 'Customer Feedback Survey',
        fields: [
          { type: 'short_text', label: 'Your Name', required: false },
          { type: 'email', label: 'Email Address', required: false },
          { type: 'rating', label: 'Overall Satisfaction', required: true },
          { type: 'multiple_choice', label: 'What did you like most?', required: true },
          { type: 'scale', label: 'How likely are you to recommend us?', required: true },
          { type: 'long_text', label: 'What could we improve?', required: false },
        ],
      },
      'contact': {
        title: 'Contact Us Form',
        fields: [
          { type: 'short_text', label: 'Full Name', required: true },
          { type: 'email', label: 'Email Address', required: true },
          { type: 'phone', label: 'Phone Number', required: false },
          { type: 'dropdown', label: 'Subject', required: true },
          { type: 'long_text', label: 'Message', required: true },
        ],
      },
      'event': {
        title: 'Event Registration',
        fields: [
          { type: 'short_text', label: 'Full Name', required: true },
          { type: 'email', label: 'Email Address', required: true },
          { type: 'short_text', label: 'Organization', required: false },
          { type: 'dropdown', label: 'Ticket Type', required: true },
          { type: 'checkbox', label: 'Dietary Requirements', required: false },
          { type: 'long_text', label: 'Special Requests', required: false },
        ],
      },
      'survey': {
        title: 'General Survey',
        fields: [
          { type: 'short_text', label: 'Name (Optional)', required: false },
          { type: 'dropdown', label: 'Age Group', required: true },
          { type: 'rating', label: 'Rate your experience', required: true },
          { type: 'scale', label: 'How likely are you to return?', required: true },
          { type: 'multiple_choice', label: 'What is most important to you?', required: true },
          { type: 'long_text', label: 'Additional thoughts', required: false },
        ],
      },
      'newsletter': {
        title: 'Newsletter Signup',
        fields: [
          { type: 'short_text', label: 'First Name', required: true },
          { type: 'email', label: 'Email Address', required: true },
          { type: 'checkbox', label: 'Interests', required: false },
        ],
      },
      'lead': {
        title: 'Lead Capture Form',
        fields: [
          { type: 'short_text', label: 'Full Name', required: true },
          { type: 'email', label: 'Work Email', required: true },
          { type: 'short_text', label: 'Company Name', required: true },
          { type: 'dropdown', label: 'Company Size', required: true },
          { type: 'long_text', label: 'How can we help?', required: false },
        ],
      },
    };

    for (const [key, template] of Object.entries(templates)) {
      if (lower.includes(key)) return template;
    }

    return {
      title: input.length > 40 ? input.slice(0, 40) + '...' : input,
      fields: [
        { type: 'short_text', label: 'Full Name', required: true },
        { type: 'email', label: 'Email', required: true },
        { type: 'long_text', label: 'Your Response', required: true },
      ],
    };
  };

  const FIELD_ICONS: Record<string, string> = {
    short_text: 'Aa', email: '✉', phone: '📱', url: '🔗', long_text: '📝',
    dropdown: '▽', multiple_choice: '◎', checkbox: '☐', rating: '⭐',
    scale: '📊', date: '📅', file_upload: '📎', heading: 'H1',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0524 0%, #1a0a3e 50%, #0d0821 100%)' }}>
      <nav className="dashboard-nav" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="dashboard-logo" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
          ⚡ Blazion Forms
        </span>
      </nav>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '60px 24px' }}>
        {step === 'input' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Wand2 size={28} color="white" />
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 8, background: 'linear-gradient(180deg, #fff, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI Form Generator
              </h1>
              <p style={{ color: '#a1a1aa', fontSize: 16, lineHeight: 1.6 }}>
                Describe the form you need in plain English. Our AI will create it instantly.
              </p>
            </div>

            {/* Prompt input */}
            <div style={{ marginBottom: 32 }}>
              <textarea
                placeholder="e.g. Create a job application form with sections for personal info, experience, and resume upload..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                style={{
                  width: '100%', padding: '18px 20px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
                  background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 16, fontFamily: 'inherit',
                  resize: 'none', outline: 'none', lineHeight: 1.6,
                }}
              />
              <button className="auth-submit-btn" onClick={handleGenerate} disabled={!prompt.trim()} style={{ marginTop: 12 }}>
                <Sparkles size={18} /> Generate Form with AI
              </button>
            </div>

            {/* Example prompts */}
            <div>
              <p style={{ fontSize: 13, color: '#71717a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                Try an example
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => setPrompt(ex.prompt)}
                    style={{
                      padding: '8px 16px', borderRadius: 50, border: '1px solid rgba(255,255,255,0.08)',
                      background: prompt === ex.prompt ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                      color: prompt === ex.prompt ? '#c4b5fd' : '#a1a1aa', fontSize: 13, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.15s ease',
                    }}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 'generating' && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'pulse 2s infinite' }}>
              <Loader2 size={36} color="white" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Generating Your Form...</h2>
            <p style={{ color: '#a78bfa', fontSize: 15, fontFamily: 'monospace' }}>{progressText}</p>
          </div>
        )}

        {step === 'success' && generated && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color="white" />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Form Generated!</h2>
              <p style={{ color: '#a1a1aa', fontSize: 14 }}>{generated.fields.length} fields created from your prompt</p>
            </div>

            {/* Preview card */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20 }}>{generated.title}</h3>
              {generated.fields.map((f: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {FIELD_ICONS[f.type] || '•'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#e4e4e7', fontSize: 14, fontWeight: 500 }}>{f.label}</span>
                    {f.required && <span style={{ color: '#ef4444', marginLeft: 4, fontSize: 12 }}>*</span>}
                  </div>
                  <span style={{ color: '#71717a', fontSize: 12, background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 50 }}>
                    {f.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" onClick={() => { setStep('input'); setGenerated(null); }} style={{ flex: 1 }}>
                <Wand2 size={16} /> Generate Another
              </button>
              <button className="btn-primary" onClick={() => router.push('/dashboard')} style={{ flex: 1 }}>
                <FileText size={16} /> Open in Builder
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
