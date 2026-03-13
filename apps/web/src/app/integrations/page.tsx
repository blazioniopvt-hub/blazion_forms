'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, CheckCircle, ExternalLink, Trash2, RefreshCw, X } from 'lucide-react';

// ============================================
// Integrations Hub — connect external services
// ============================================

interface IntegrationConfig {
  id: string;
  provider: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  connected: boolean;
  fields: { key: string; label: string; placeholder: string; type: string }[];
}

const AVAILABLE_INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'slack',
    provider: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Send form submissions to a Slack channel.',
    color: '#4a154b',
    connected: true,
    fields: [{ key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...', type: 'text' }],
  },
  {
    id: 'google_sheets',
    provider: 'google_sheets',
    name: 'Google Sheets',
    icon: '📊',
    description: 'Automatically append responses to a Google Sheet.',
    color: '#0f9d58',
    connected: false,
    fields: [
      { key: 'spreadsheetId', label: 'Spreadsheet ID', placeholder: 'From the Google Sheets URL', type: 'text' },
      { key: 'sheetName', label: 'Sheet Name', placeholder: 'Sheet1', type: 'text' },
    ],
  },
  {
    id: 'notion',
    provider: 'notion',
    name: 'Notion',
    icon: '📄',
    description: 'Create Notion database entries from form submissions.',
    color: '#000000',
    connected: false,
    fields: [
      { key: 'apiKey', label: 'Notion API Key', placeholder: 'secret_...', type: 'password' },
      { key: 'databaseId', label: 'Database ID', placeholder: 'Found in the Notion database URL', type: 'text' },
    ],
  },
  {
    id: 'zapier',
    provider: 'zapier',
    name: 'Zapier',
    icon: '⚡',
    description: 'Connect to 5000+ apps via Zapier webhooks.',
    color: '#ff4a00',
    connected: false,
    fields: [{ key: 'webhookUrl', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...', type: 'text' }],
  },
  {
    id: 'discord',
    provider: 'discord',
    name: 'Discord',
    icon: '🎮',
    description: 'Get notifications in a Discord channel.',
    color: '#5865f2',
    connected: false,
    fields: [{ key: 'webhookUrl', label: 'Discord Webhook URL', placeholder: 'https://discord.com/api/webhooks/...', type: 'text' }],
  },
  {
    id: 'airtable',
    provider: 'airtable',
    name: 'Airtable',
    icon: '📋',
    description: 'Sync responses to an Airtable base.',
    color: '#18bfff',
    connected: false,
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'pat...', type: 'password' },
      { key: 'baseId', label: 'Base ID', placeholder: 'app...', type: 'text' },
      { key: 'tableId', label: 'Table ID', placeholder: 'tbl...', type: 'text' },
    ],
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const activeIntegration = AVAILABLE_INTEGRATIONS.find((i) => i.id === configuring);

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
            <h1>Integrations</h1>
            <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginTop: 4 }}>
              Connect your forms to the tools you already use.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {AVAILABLE_INTEGRATIONS.map((integration) => (
            <div
              key={integration.id}
              style={{
                padding: 24, borderRadius: 12, background: 'var(--card)',
                border: `1px solid ${integration.connected ? 'rgba(16,185,129,0.3)' : 'var(--card-border)'}`,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 28, width: 44, height: 44, borderRadius: 10, background: `${integration.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {integration.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{integration.name}</div>
                  {integration.connected && (
                    <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={10} /> Connected
                    </span>
                  )}
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16, lineHeight: 1.5 }}>
                {integration.description}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-accent btn-sm"
                  onClick={() => { setConfiguring(integration.id); setFormData({}); }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {integration.connected ? 'Configure' : 'Connect'}
                </button>
                {integration.connected && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Modal */}
      {configuring && activeIntegration && (
        <div className="modal-overlay" onClick={() => setConfiguring(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{activeIntegration.icon}</span>
                <h2>Configure {activeIntegration.name}</h2>
              </div>
              <button className="btn-icon" onClick={() => setConfiguring(null)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20, lineHeight: 1.5 }}>
              {activeIntegration.description}
            </p>

            {activeIntegration.fields.map((field) => (
              <div className="config-field" key={field.key}>
                <label>{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                />
              </div>
            ))}

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setConfiguring(null)}>Cancel</button>
              <button
                className="btn btn-accent"
                onClick={() => { alert(`${activeIntegration.name} integration saved!`); setConfiguring(null); }}
              >
                <CheckCircle size={14} /> Save Integration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
