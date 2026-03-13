'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFormBuilderStore } from '@/stores/formBuilderStore';
import FieldPalette from '@/components/builder/FieldPalette';
import BuilderCanvas from '@/components/builder/BuilderCanvas';
import FieldConfigPanel from '@/components/builder/FieldConfigPanel';
import FormPreview from '@/components/builder/FormPreview';
import {
  ArrowLeft, Eye, Pencil, Plus, Rocket, X
} from 'lucide-react';

// ============================================
// Builder Page – full form editor
// ============================================
export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const {
    currentForm,
    loadForm,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    addPage,
    removePage,
    publishForm,
  } = useFormBuilderStore();

  useEffect(() => {
    if (formId) {
      loadForm(formId);
    }
  }, [formId, loadForm]);

  if (!currentForm) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Form not found</h2>
          <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 16 }}>
            This form does not exist or has been deleted.
          </p>
          <button className="btn btn-accent" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top Bar */}
      <div className="builder-topbar">
        <div className="builder-topbar-left">
          <button
            className="btn-icon"
            onClick={() => router.push('/dashboard')}
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{currentForm.title}</span>
          <span
            className={`form-card-status ${currentForm.status}`}
            style={{ fontSize: 10, padding: '2px 8px' }}
          >
            {currentForm.status}
          </span>
        </div>

        {/* Edit / Preview toggle */}
        <div className="builder-topbar-center">
          <button
            className={viewMode === 'edit' ? 'active' : ''}
            onClick={() => setViewMode('edit')}
          >
            <Pencil size={13} style={{ marginRight: 4 }} /> Edit
          </button>
          <button
            className={viewMode === 'preview' ? 'active' : ''}
            onClick={() => setViewMode('preview')}
          >
            <Eye size={13} style={{ marginRight: 4 }} /> Preview
          </button>
        </div>

        <div className="builder-topbar-right">
          <button
            className="btn btn-accent btn-sm"
            onClick={() => {
              publishForm(currentForm.id);
              alert('Form published successfully!');
            }}
          >
            <Rocket size={13} /> Publish
          </button>
        </div>
      </div>

      {/* Page navigator (for multi-page forms) */}
      {viewMode === 'edit' && (
        <div className="page-navigator">
          {Array.from({ length: currentForm.totalPages }).map((_, i) => (
            <button
              key={i}
              className={`page-tab ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              Page {i + 1}
              {currentForm.totalPages > 1 && currentPage === i + 1 && (
                <X
                  size={11}
                  style={{ marginLeft: 4, cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this page and all its fields?')) {
                      removePage(i + 1);
                    }
                  }}
                />
              )}
            </button>
          ))}
          <button className="page-add-btn" onClick={addPage} title="Add Page">
            <Plus size={14} />
          </button>
        </div>
      )}

      {/* Main content */}
      {viewMode === 'edit' ? (
        <div className="builder-layout" style={{ flex: 1 }}>
          <FieldPalette />
          <BuilderCanvas />
          <FieldConfigPanel />
        </div>
      ) : (
        <FormPreview />
      )}
    </div>
  );
}
