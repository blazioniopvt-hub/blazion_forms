'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Star, CheckCircle } from 'lucide-react';

// ============================================
// Public Form Renderer — rendered at /forms/[slug]
// ============================================

// Demo form for when DB is not connected
const DEMO_FORM = {
  id: 'demo',
  title: 'Customer Feedback Survey',
  description: 'We would love to hear your thoughts! Please fill out this short survey.',
  slug: 'demo-feedback',
  status: 'published',
  totalPages: 1,
  themeSettings: {
    primaryColor: '#7c3aed',
    backgroundColor: '#fafafa',
    textColor: '#1f2937',
    fontFamily: 'Inter',
    borderRadius: '12px',
  },
  fields: [
    { id: 'f1', type: 'short_text', label: 'Full Name', required: true, pageNumber: 1, orderIndex: 0, placeholder: 'Enter your full name', properties: {} },
    { id: 'f2', type: 'email', label: 'Email Address', required: true, pageNumber: 1, orderIndex: 1, placeholder: 'you@email.com', properties: {} },
    { id: 'f3', type: 'rating', label: 'How would you rate our service?', required: true, pageNumber: 1, orderIndex: 2, properties: { maxRating: 5 } },
    { id: 'f4', type: 'multiple_choice', label: 'How did you hear about us?', required: false, pageNumber: 1, orderIndex: 3, properties: { options: [{ id: 'o1', label: 'Google Search', value: 'google' }, { id: 'o2', label: 'Social Media', value: 'social' }, { id: 'o3', label: 'Friend Referral', value: 'referral' }, { id: 'o4', label: 'Other', value: 'other' }] } },
    { id: 'f5', type: 'long_text', label: 'Any additional comments?', required: false, pageNumber: 1, orderIndex: 4, placeholder: 'Share your thoughts...', properties: {} },
  ],
};

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;
  const form = DEMO_FORM; // Will be replaced with API fetch
  const theme = form.themeSettings as any;

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [ratingHover, setRatingHover] = useState<Record<string, number>>({});

  const pageFields = useMemo(
    () => form.fields.filter((f) => f.pageNumber === currentPage).sort((a, b) => a.orderIndex - b.orderIndex),
    [form.fields, currentPage]
  );

  const setAnswer = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = () => {
    // Validate required fields
    const missingRequired = form.fields
      .filter((f) => f.required && !answers[f.id])
      .map((f) => f.label);
    if (missingRequired.length > 0) {
      alert(`Please fill in required fields: ${missingRequired.join(', ')}`);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="preview-container" style={{ background: theme.backgroundColor }}>
        <div className="preview-form" style={{ background: theme.backgroundColor, border: `1px solid ${theme.textColor}10`, fontFamily: theme.fontFamily, color: theme.textColor, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Thank You!</h1>
          <p style={{ fontSize: 16, opacity: 0.7, lineHeight: 1.6 }}>
            Your response has been recorded successfully. We appreciate your feedback.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-container" style={{ background: theme.backgroundColor, minHeight: '100vh' }}>
      <div className="preview-form" style={{
        background: theme.backgroundColor === '#fafafa' ? '#fff' : theme.backgroundColor,
        border: `1px solid ${theme.textColor}10`,
        fontFamily: theme.fontFamily,
        color: theme.textColor,
        boxShadow: '0 20px 60px rgba(0,0,0,0.06)',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>{form.title}</h1>
        {form.description && (
          <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 32, lineHeight: 1.6 }}>{form.description}</p>
        )}

        {pageFields.map((field: any) => (
          <div key={field.id} style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              {field.label}
              {field.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
            </label>

            {(field.type === 'short_text' || field.type === 'email' || field.type === 'phone' || field.type === 'url') && (
              <input
                type={field.type === 'email' ? 'email' : 'text'}
                placeholder={field.placeholder || ''}
                value={answers[field.id] || ''}
                onChange={(e) => setAnswer(field.id, e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', border: `1px solid ${theme.textColor}20`,
                  borderRadius: theme.borderRadius, background: `${theme.textColor}05`, color: theme.textColor,
                  fontSize: 15, fontFamily: 'inherit', outline: 'none',
                }}
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                value={answers[field.id] || ''}
                onChange={(e) => setAnswer(field.id, e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', border: `1px solid ${theme.textColor}20`,
                  borderRadius: theme.borderRadius, background: `${theme.textColor}05`, color: theme.textColor,
                  fontSize: 15, fontFamily: 'inherit', outline: 'none',
                }}
              />
            )}

            {field.type === 'long_text' && (
              <textarea
                placeholder={field.placeholder || ''}
                value={answers[field.id] || ''}
                onChange={(e) => setAnswer(field.id, e.target.value)}
                rows={4}
                style={{
                  width: '100%', padding: '12px 16px', border: `1px solid ${theme.textColor}20`,
                  borderRadius: theme.borderRadius, background: `${theme.textColor}05`, color: theme.textColor,
                  fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                }}
              />
            )}

            {field.type === 'date' && (
              <input
                type="date"
                value={answers[field.id] || ''}
                onChange={(e) => setAnswer(field.id, e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', border: `1px solid ${theme.textColor}20`,
                  borderRadius: theme.borderRadius, fontSize: 15, fontFamily: 'inherit',
                }}
              />
            )}

            {field.type === 'multiple_choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(field.properties.options || []).map((opt: any) => (
                  <label
                    key={opt.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      border: `1px solid ${answers[field.id] === opt.value ? theme.primaryColor : theme.textColor + '15'}`,
                      borderRadius: theme.borderRadius, cursor: 'pointer', fontSize: 14,
                      background: answers[field.id] === opt.value ? `${theme.primaryColor}10` : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name={field.id}
                      checked={answers[field.id] === opt.value}
                      onChange={() => setAnswer(field.id, opt.value)}
                      style={{ accentColor: theme.primaryColor }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}

            {field.type === 'checkbox' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(field.properties.options || []).map((opt: any) => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={(answers[field.id] || []).includes(opt.value)}
                      onChange={(e) => {
                        const current = answers[field.id] || [];
                        setAnswer(field.id, e.target.checked ? [...current, opt.value] : current.filter((v: string) => v !== opt.value));
                      }}
                      style={{ accentColor: theme.primaryColor }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}

            {field.type === 'rating' && (
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: field.properties.maxRating || 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={32}
                    fill={(ratingHover[field.id] ?? answers[field.id] ?? 0) > i ? '#f59e0b' : 'none'}
                    color={(ratingHover[field.id] ?? answers[field.id] ?? 0) > i ? '#f59e0b' : theme.textColor + '30'}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setRatingHover({ ...ratingHover, [field.id]: i + 1 })}
                    onMouseLeave={() => setRatingHover({ ...ratingHover, [field.id]: 0 })}
                    onClick={() => setAnswer(field.id, i + 1)}
                  />
                ))}
              </div>
            )}

            {field.type === 'file_upload' && (
              <div style={{
                padding: 32, border: `2px dashed ${theme.textColor}20`,
                borderRadius: theme.borderRadius, textAlign: 'center',
                color: `${theme.textColor}60`, fontSize: 14, cursor: 'pointer',
              }}>
                <input type="file" style={{ display: 'none' }} id={`file-${field.id}`} />
                <label htmlFor={`file-${field.id}`} style={{ cursor: 'pointer' }}>
                  Click or drag files here to upload
                </label>
              </div>
            )}
          </div>
        ))}

        {/* Page controls */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          {currentPage > 1 && (
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              style={{
                flex: 1, padding: 14, borderRadius: theme.borderRadius,
                border: `1px solid ${theme.textColor}20`, background: 'transparent',
                color: theme.textColor, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Previous
            </button>
          )}
          {currentPage < form.totalPages ? (
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              style={{
                flex: 1, padding: 14, borderRadius: theme.borderRadius,
                border: 'none', background: theme.primaryColor,
                color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="preview-submit-btn"
              style={{ flex: 1, background: theme.primaryColor }}
            >
              Submit
            </button>
          )}
        </div>

        {/* Powered by */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, opacity: 0.4 }}>
          Powered by Blazion Forms
        </p>
      </div>
    </div>
  );
}
