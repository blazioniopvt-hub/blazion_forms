'use client';

import React from 'react';
import { useFormBuilderStore } from '@/stores/formBuilderStore';
import { Star } from 'lucide-react';

// ============================================
// Form Preview Mode
// ============================================
export default function FormPreview() {
  const { currentForm } = useFormBuilderStore();

  if (!currentForm) return null;

  const theme = currentForm.theme;
  const sortedFields = [...currentForm.fields].sort(
    (a, b) => a.pageNumber - b.pageNumber || a.orderIndex - b.orderIndex
  );

  return (
    <div
      className="preview-container"
      style={{ background: theme.backgroundColor }}
    >
      <div
        className="preview-form"
        style={{
          backgroundColor: theme.backgroundColor === '#ffffff' ? '#fff' : theme.backgroundColor,
          border: `1px solid ${theme.textColor}15`,
          fontFamily: theme.fontFamily,
          color: theme.textColor,
        }}
      >
        <h1 style={{ color: theme.textColor }}>{currentForm.title || 'Untitled Form'}</h1>
        {currentForm.description && (
          <p className="form-description" style={{ color: theme.textColor }}>
            {currentForm.description}
          </p>
        )}

        {sortedFields.map((field) => {
          if (field.type === 'divider') {
            return (
              <hr
                key={field.id}
                style={{
                  border: 'none',
                  borderTop: `1px solid ${theme.textColor}20`,
                  margin: '24px 0',
                }}
              />
            );
          }

          if (field.type === 'heading') {
            return (
              <h2 key={field.id} style={{ fontSize: '22px', fontWeight: 700, margin: '28px 0 12px' }}>
                {field.label}
              </h2>
            );
          }

          if (field.type === 'paragraph') {
            return (
              <p key={field.id} style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px', lineHeight: 1.6 }}>
                {field.label}
              </p>
            );
          }

          return (
            <div key={field.id} className="preview-field">
              <div className="field-label">
                {field.label}
                {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
              </div>

              {field.type === 'short_text' || field.type === 'email' || field.type === 'phone' || field.type === 'url' ? (
                <input
                  type="text"
                  placeholder={field.placeholder || ''}
                  style={{
                    border: `1px solid ${theme.textColor}20`,
                    borderRadius: theme.borderRadius,
                    background: `${theme.textColor}05`,
                    color: theme.textColor,
                  }}
                />
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  placeholder={field.placeholder || ''}
                  style={{
                    border: `1px solid ${theme.textColor}20`,
                    borderRadius: theme.borderRadius,
                    background: `${theme.textColor}05`,
                    color: theme.textColor,
                  }}
                />
              ) : field.type === 'long_text' ? (
                <textarea
                  placeholder={field.placeholder || ''}
                  rows={4}
                  style={{
                    border: `1px solid ${theme.textColor}20`,
                    borderRadius: theme.borderRadius,
                    background: `${theme.textColor}05`,
                    color: theme.textColor,
                    width: '100%',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    padding: '12px 16px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              ) : field.type === 'multiple_choice' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {(field.properties.options || []).map((opt) => (
                    <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '14px' }}>
                      <input type="radio" name={field.id} style={{ accentColor: theme.primaryColor }} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              ) : field.type === 'checkbox' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {(field.properties.options || []).map((opt) => (
                    <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '14px' }}>
                      <input type="checkbox" style={{ accentColor: theme.primaryColor }} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              ) : field.type === 'dropdown' ? (
                <select
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${theme.textColor}20`,
                    borderRadius: theme.borderRadius,
                    background: `${theme.textColor}05`,
                    color: theme.textColor,
                    fontSize: '15px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option>Select an option...</option>
                  {(field.properties.options || []).map((opt) => (
                    <option key={opt.id}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'date' ? (
                <input
                  type="date"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${theme.textColor}20`,
                    borderRadius: theme.borderRadius,
                    background: `${theme.textColor}05`,
                    color: theme.textColor,
                    fontSize: '15px',
                    fontFamily: 'inherit',
                  }}
                />
              ) : field.type === 'time' ? (
                <input
                  type="time"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${theme.textColor}20`,
                    borderRadius: theme.borderRadius,
                    background: `${theme.textColor}05`,
                    color: theme.textColor,
                    fontSize: '15px',
                    fontFamily: 'inherit',
                  }}
                />
              ) : field.type === 'file_upload' ? (
                <div
                  style={{
                    padding: '32px',
                    border: `2px dashed ${theme.textColor}20`,
                    borderRadius: theme.borderRadius,
                    textAlign: 'center',
                    color: `${theme.textColor}80`,
                    fontSize: '14px',
                  }}
                >
                  Click or drag files here to upload
                </div>
              ) : field.type === 'rating' ? (
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {Array.from({ length: field.properties.maxRating || 5 }).map((_, i) => (
                    <Star key={i} size={28} style={{ color: theme.primaryColor, cursor: 'pointer' }} />
                  ))}
                </div>
              ) : field.type === 'scale' ? (
                <div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {Array.from({
                      length: (field.properties.scaleMax || 10) - (field.properties.scaleMin || 1) + 1,
                    }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: theme.borderRadius,
                          border: `1px solid ${theme.primaryColor}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          color: theme.textColor,
                        }}
                      >
                        {(field.properties.scaleMin || 1) + i}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, opacity: 0.6 }}>
                    <span>{field.properties.scaleMinLabel || ''}</span>
                    <span>{field.properties.scaleMaxLabel || ''}</span>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        <button
          className="preview-submit-btn"
          style={{ background: theme.primaryColor }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
