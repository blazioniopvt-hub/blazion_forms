'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Trash2, Search, ChevronLeft, ChevronRight, FileJson, FileSpreadsheet } from 'lucide-react';
import { useFormBuilderStore } from '@/stores/formBuilderStore';

// ============================================
// Responses Dashboard — view submissions
// ============================================

interface MockResponse {
  id: string;
  submittedAt: string;
  isCompleted: boolean;
  answers: Record<string, string>;
}

export default function ResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;
  const { forms } = useFormBuilderStore();
  const form = forms.find((f) => f.id === formId);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data for demonstration (will be replaced by API calls)
  const mockResponses: MockResponse[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `resp_${i + 1}`,
    submittedAt: new Date(Date.now() - i * 3600000 * 6).toISOString(),
    isCompleted: true,
    answers: {
      'Name': `User ${i + 1}`,
      'Email': `user${i + 1}@example.com`,
      'Rating': `${Math.floor(Math.random() * 5) + 1}`,
      'Feedback': `This is feedback from user ${i + 1}. Very helpful!`,
    },
  }));

  const filtered = mockResponses.filter((r) =>
    Object.values(r.answers).some((v) =>
      v.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const perPage = 10;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleExportCsv = () => {
    const headers = ['Response ID', 'Submitted At', ...Object.keys(mockResponses[0]?.answers || {})];
    const rows = mockResponses.map((r) => [
      r.id,
      new Date(r.submittedAt).toLocaleString(),
      ...Object.values(r.answers),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responses-${formId}.csv`;
    a.click();
  };

  const handleExportJson = () => {
    const json = JSON.stringify(mockResponses, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `responses-${formId}.json`;
    a.click();
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={18} />
          </button>
          <span className="dashboard-logo">⚡ Blazion Forms</span>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Responses{form ? `: ${form.title}` : ''}</h1>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
              {filtered.length} total responses
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={handleExportCsv}>
              <FileSpreadsheet size={14} /> Export CSV
            </button>
            <button className="btn btn-ghost" onClick={handleExportJson}>
              <FileJson size={14} /> Export JSON
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search responses..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid var(--card-border)',
              borderRadius: 8,
              background: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  #
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Submitted
                </th>
                {Object.keys(mockResponses[0]?.answers || {}).map((key) => (
                  <th key={key} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {key}
                  </th>
                ))}
                <th style={{ padding: '12px 16px', width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r, idx) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--muted-foreground)' }}>
                    {(currentPage - 1) * perPage + idx + 1}
                  </td>
                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    {new Date(r.submittedAt).toLocaleDateString()} {new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  {Object.values(r.answers).map((val, i) => (
                    <td key={i} style={{ padding: '10px 16px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {val}
                    </td>
                  ))}
                  <td style={{ padding: '10px 16px' }}>
                    <button className="btn-icon" style={{ width: 24, height: 24, border: 'none' }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <button
              className="btn btn-ghost btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
