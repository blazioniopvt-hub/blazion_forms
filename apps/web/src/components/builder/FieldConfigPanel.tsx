'use client';

import React from 'react';
import { useFormBuilderStore } from '@/stores/formBuilderStore';
import { X, Plus } from 'lucide-react';

// ============================================
// Field Config Panel – right sidebar
// ============================================
export default function FieldConfigPanel() {
  const {
    currentForm,
    selectedFieldId,
    updateField,
    addFieldOption,
    removeFieldOption,
    updateFieldOption,
    updateTheme,
  } = useFormBuilderStore();

  if (!currentForm) return null;

  const field = selectedFieldId
    ? currentForm.fields.find((f) => f.id === selectedFieldId)
    : null;

  // If no field is selected, show theme settings
  if (!field) {
    return (
      <div className="builder-config">
        <div className="config-section">
          <div className="config-section-title">Form Theme</div>

          <div className="config-field">
            <label>Primary Color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={currentForm.theme.primaryColor}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              />
              <input
                type="text"
                value={currentForm.theme.primaryColor}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="config-field">
            <label>Background Color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={currentForm.theme.backgroundColor}
                onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
              />
              <input
                type="text"
                value={currentForm.theme.backgroundColor}
                onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="config-field">
            <label>Text Color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={currentForm.theme.textColor}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
              />
              <input
                type="text"
                value={currentForm.theme.textColor}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="config-field">
            <label>Font Family</label>
            <select
              value={currentForm.theme.fontFamily}
              onChange={(e) => updateTheme({ fontFamily: e.target.value })}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Poppins">Poppins</option>
              <option value="Lato">Lato</option>
              <option value="Georgia">Georgia (Serif)</option>
            </select>
          </div>

          <div className="config-field">
            <label>Border Radius</label>
            <select
              value={currentForm.theme.borderRadius}
              onChange={(e) => updateTheme({ borderRadius: e.target.value })}
            >
              <option value="0px">Square</option>
              <option value="4px">Slight</option>
              <option value="8px">Rounded</option>
              <option value="12px">More Rounded</option>
              <option value="20px">Pill</option>
            </select>
          </div>
        </div>

        <div className="no-field-selected" style={{ padding: '40px 20px' }}>
          <p style={{ fontSize: 12 }}>Click a field on the canvas to edit its properties.</p>
        </div>
      </div>
    );
  }

  const hasOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(field.type);
  const isLayoutType = ['heading', 'paragraph', 'divider'].includes(field.type);

  return (
    <div className="builder-config">
      {/* Basic field settings */}
      <div className="config-section">
        <div className="config-section-title">Field Settings</div>

        <div className="config-field">
          <label>Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
          />
        </div>

        {!isLayoutType && (
          <>
            <div className="config-field">
              <label>Description (optional)</label>
              <input
                type="text"
                value={field.description || ''}
                onChange={(e) => updateField(field.id, { description: e.target.value })}
                placeholder="Help text for this field"
              />
            </div>

            <div className="config-field">
              <label>Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                placeholder="Placeholder text..."
              />
            </div>

            <div className="config-toggle">
              <label>Required</label>
              <button
                className={`toggle-switch ${field.required ? 'active' : ''}`}
                onClick={() => updateField(field.id, { required: !field.required })}
              />
            </div>
          </>
        )}
      </div>

      {/* Options (for choice fields) */}
      {hasOptions && (
        <div className="config-section">
          <div className="config-section-title">Options</div>
          {(field.properties.options || []).map((opt) => (
            <div key={opt.id} className="config-option-item">
              <input
                type="text"
                value={opt.label}
                onChange={(e) =>
                  updateFieldOption(field.id, opt.id, {
                    label: e.target.value,
                    value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  })
                }
              />
              <button onClick={() => removeFieldOption(field.id, opt.id)}>
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', marginTop: 4 }}
            onClick={() => addFieldOption(field.id)}
          >
            <Plus size={12} /> Add Option
          </button>
        </div>
      )}

      {/* Rating settings */}
      {field.type === 'rating' && (
        <div className="config-section">
          <div className="config-section-title">Rating Settings</div>
          <div className="config-field">
            <label>Max Stars</label>
            <input
              type="number"
              min={3}
              max={10}
              value={field.properties.maxRating || 5}
              onChange={(e) =>
                updateField(field.id, {
                  properties: { ...field.properties, maxRating: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>
      )}

      {/* Scale settings */}
      {field.type === 'scale' && (
        <div className="config-section">
          <div className="config-section-title">Scale Settings</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="config-field">
              <label>Min</label>
              <input
                type="number"
                value={field.properties.scaleMin || 1}
                onChange={(e) =>
                  updateField(field.id, {
                    properties: { ...field.properties, scaleMin: Number(e.target.value) },
                  })
                }
              />
            </div>
            <div className="config-field">
              <label>Max</label>
              <input
                type="number"
                value={field.properties.scaleMax || 10}
                onChange={(e) =>
                  updateField(field.id, {
                    properties: { ...field.properties, scaleMax: Number(e.target.value) },
                  })
                }
              />
            </div>
          </div>
          <div className="config-field">
            <label>Min Label</label>
            <input
              type="text"
              value={field.properties.scaleMinLabel || ''}
              onChange={(e) =>
                updateField(field.id, {
                  properties: { ...field.properties, scaleMinLabel: e.target.value },
                })
              }
            />
          </div>
          <div className="config-field">
            <label>Max Label</label>
            <input
              type="text"
              value={field.properties.scaleMaxLabel || ''}
              onChange={(e) =>
                updateField(field.id, {
                  properties: { ...field.properties, scaleMaxLabel: e.target.value },
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
