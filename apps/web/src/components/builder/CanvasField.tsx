'use client';

import React from 'react';
import { FormField } from '@/types/form';
import { useFormBuilderStore } from '@/stores/formBuilderStore';
import { Trash2, Copy, ChevronUp, ChevronDown, GripVertical, Star } from 'lucide-react';

// ============================================
// Field Renderer — renders preview of each field on canvas
// ============================================
function FieldPreview({ field }: { field: FormField }) {
  switch (field.type) {
    case 'short_text':
    case 'email':
    case 'phone':
    case 'url':
    case 'number':
      return (
        <div className="field-preview">
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            placeholder={field.placeholder || `Enter ${field.type.replace('_', ' ')}...`}
            disabled
          />
        </div>
      );

    case 'long_text':
      return (
        <div className="field-preview">
          <textarea
            placeholder={field.placeholder || 'Type your answer here...'}
            rows={3}
            disabled
          />
        </div>
      );

    case 'multiple_choice':
      return (
        <div className="field-preview">
          {(field.properties.options || []).map((opt) => (
            <div key={opt.id} className="option-item">
              <input type="radio" name={field.id} disabled />
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className="field-preview">
          {(field.properties.options || []).map((opt) => (
            <div key={opt.id} className="option-item">
              <input type="checkbox" disabled />
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      );

    case 'dropdown':
      return (
        <div className="field-preview">
          <select disabled>
            <option>Select an option...</option>
            {(field.properties.options || []).map((opt) => (
              <option key={opt.id} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'date':
      return (
        <div className="field-preview">
          <input type="date" disabled />
        </div>
      );

    case 'time':
      return (
        <div className="field-preview">
          <input type="time" disabled />
        </div>
      );

    case 'file_upload':
      return (
        <div className="field-preview">
          <div
            style={{
              padding: '24px',
              border: '2px dashed var(--card-border)',
              borderRadius: '8px',
              textAlign: 'center',
              color: 'var(--muted-foreground)',
              fontSize: '13px',
            }}
          >
            Click or drag and drop to upload a file
          </div>
        </div>
      );

    case 'rating':
      return (
        <div className="field-preview">
          <div className="rating-stars">
            {Array.from({ length: field.properties.maxRating || 5 }).map((_, i) => (
              <Star key={i} size={24} className="rating-star" />
            ))}
          </div>
        </div>
      );

    case 'scale':
      return (
        <div className="field-preview">
          <div className="scale-row">
            {Array.from({
              length: (field.properties.scaleMax || 10) - (field.properties.scaleMin || 1) + 1,
            }).map((_, i) => (
              <div key={i} className="scale-item">
                {(field.properties.scaleMin || 1) + i}
              </div>
            ))}
          </div>
          <div className="scale-labels">
            <span>{field.properties.scaleMinLabel || ''}</span>
            <span>{field.properties.scaleMaxLabel || ''}</span>
          </div>
        </div>
      );

    case 'heading':
      return (
        <div className="field-preview" style={{ paddingTop: 0 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{field.label}</h2>
        </div>
      );

    case 'paragraph':
      return (
        <div className="field-preview" style={{ paddingTop: 0 }}>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.6 }}>
            {field.label}
          </p>
        </div>
      );

    case 'divider':
      return (
        <div className="field-preview">
          <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)', margin: '8px 0' }} />
        </div>
      );

    default:
      return null;
  }
}

// ============================================
// Canvas Field – wraps FieldPreview with selection and actions
// ============================================
export default function CanvasField({ field }: { field: FormField }) {
  const { selectedFieldId, selectField, removeField, duplicateField, moveField } =
    useFormBuilderStore();

  const isSelected = selectedFieldId === field.id;
  const isLayoutType = ['heading', 'paragraph', 'divider'].includes(field.type);

  return (
    <div
      className={`canvas-field ${isSelected ? 'selected' : ''}`}
      onClick={() => selectField(field.id)}
    >
      {/* Action buttons */}
      <div className="canvas-field-actions">
        <button title="Move Up" onClick={(e) => { e.stopPropagation(); moveField(field.id, 'up'); }}>
          <ChevronUp size={14} />
        </button>
        <button title="Move Down" onClick={(e) => { e.stopPropagation(); moveField(field.id, 'down'); }}>
          <ChevronDown size={14} />
        </button>
        <button title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }}>
          <Copy size={14} />
        </button>
        <button
          title="Delete"
          className="danger"
          onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Label & Description (skip for layout types) */}
      {!isLayoutType && (
        <>
          <div className="field-label">
            {field.label}
            {field.required && <span className="required-dot">*</span>}
          </div>
          {field.description && (
            <div className="field-description">{field.description}</div>
          )}
        </>
      )}

      {/* Preview of the field */}
      <FieldPreview field={field} />
    </div>
  );
}
