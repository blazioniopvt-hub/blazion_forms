'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormBuilderStore } from '@/stores/formBuilderStore';
import {
  Plus, Users, Trash2, X, Copy, BarChart3, FileText, Share2,
  ExternalLink, MoreHorizontal, Pencil, Sparkles, Puzzle, UsersRound, CreditCard, Wand2, Brain
} from 'lucide-react';

// ============================================
// Dashboard — Form management
// ============================================
export default function DashboardPage() {
  const router = useRouter();
  const { forms, createNewForm, deleteForm } = useFormBuilderStore();
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createNewForm(newTitle.trim(), newDesc.trim());
    setShowModal(false);
    setNewTitle('');
    setNewDesc('');
    const latestForm = useFormBuilderStore.getState().forms;
    const created = latestForm[latestForm.length - 1];
    router.push(`/builder/${created.id}`);
  };

  const handleCopyLink = (formId: string) => {
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getEmbedCode = (formId: string) => {
    const url = `${window.location.origin}/forms/${formId}`;
    return `<iframe src="${url}" width="100%" height="600" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <span className="dashboard-logo">⚡ Blazion Forms</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/ai-generator')}>
            <Wand2 size={14} /> AI Generator
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/analytics')}>
            <Brain size={14} /> Analytics
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/integrations')}>
            <Puzzle size={14} /> Integrations
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/team')}>
            <UsersRound size={14} /> Team
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/pricing')}>
            <CreditCard size={14} /> Pricing
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>My Forms</h1>
          <button className="btn btn-accent" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Form
          </button>
        </div>

        <div className="forms-grid">
          <div className="create-form-card" onClick={() => setShowModal(true)}>
            <div className="icon"><Plus size={24} /></div>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Create New Form</span>
            <span style={{ fontSize: '12px' }}>Start from scratch</span>
          </div>

          <div className="create-form-card" onClick={() => router.push('/ai-generator')} style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
            <div className="icon" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}><Sparkles size={24} color="white" /></div>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>AI Form Generator</span>
            <span style={{ fontSize: '12px' }}>Describe it, we build it</span>
          </div>

          {forms.map((form) => (
            <div key={form.id} className="form-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`form-card-status ${form.status}`}>{form.status}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-icon" style={{ width: 26, height: 26, border: 'none' }}
                    onClick={() => setShowShareModal(form.id)} title="Share">
                    <Share2 size={12} />
                  </button>
                  <button className="btn-icon" style={{ width: 26, height: 26, border: 'none' }}
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this form?')) deleteForm(form.id); }}
                    title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <h3 style={{ cursor: 'pointer' }} onClick={() => router.push(`/builder/${form.id}`)}>
                {form.title}
              </h3>
              <p>{form.description || 'No description'}</p>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/builder/${form.id}`)}>
                  <Pencil size={11} /> Edit
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/responses/${form.id}`)}>
                  <FileText size={11} /> Responses
                </button>
              </div>

              <div className="form-card-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Users size={12} /> {form.responseCount} responses
                </span>
                <span>{form.totalPages} page{form.totalPages > 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Create New Form</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>
            <p>Give your form a name and optional description.</p>
            <div className="config-field">
              <label>Form Title *</label>
              <input type="text" placeholder="e.g. Customer Feedback Survey" value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)} autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <div className="config-field">
              <label>Description</label>
              <textarea placeholder="What is this form about?" value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)} rows={3} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleCreate}>
                <Plus size={14} /> Create Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Share Form</h2>
              <button className="btn-icon" onClick={() => setShowShareModal(null)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <div className="config-field">
              <label>Shareable Link</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/forms/${showShareModal}`}
                  style={{ flex: 1 }} />
                <button className="btn btn-accent btn-sm" onClick={() => handleCopyLink(showShareModal)}>
                  <Copy size={12} /> {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="config-field" style={{ marginTop: 16 }}>
              <label>Embed Code</label>
              <textarea readOnly value={getEmbedCode(showShareModal)} rows={3}
                style={{ fontFamily: 'monospace', fontSize: 11 }} />
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
                onClick={() => { navigator.clipboard.writeText(getEmbedCode(showShareModal!)); }}>
                <Copy size={12} /> Copy Embed Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
