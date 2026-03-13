'use client';

import React from 'react';
import { useFormBuilderStore } from '@/stores/formBuilderStore';
import CanvasField from './CanvasField';
import { MousePointerClick } from 'lucide-react';

// ============================================
// Builder Canvas – main content area
// ============================================
export default function BuilderCanvas() {
  const {
    currentForm,
    currentPage,
    updateFormTitle,
    updateFormDescription,
    addField,
    selectField,
  } = useFormBuilderStore();

  if (!currentForm) return null;

  const pageFields = currentForm.fields
    .filter((f) => f.pageNumber === currentPage)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData('fieldType');
    if (fieldType) {
      addField(fieldType as any);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div
      className="builder-canvas"
      onClick={(e) => {
        if (e.target === e.currentTarget) selectField(null);
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="canvas-form-container">
        {/* Form header */}
        <div className="canvas-form-header">
          <input
            className="form-title-input"
            value={currentForm.title}
            onChange={(e) => updateFormTitle(e.target.value)}
            placeholder="Untitled Form"
          />
          <input
            className="form-desc-input"
            value={currentForm.description || ''}
            onChange={(e) => updateFormDescription(e.target.value)}
            placeholder="Add a description..."
          />
        </div>

        {/* Fields */}
        {pageFields.length > 0 ? (
          pageFields.map((field) => (
            <CanvasField key={field.id} field={field} />
          ))
        ) : (
          <div className="canvas-empty-state">
            <div className="empty-icon">
              <MousePointerClick size={24} />
            </div>
            <h3>No fields on this page</h3>
            <p>Click a field from the left panel or drag it here to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
