'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Crown, Shield, Pencil, Eye, Trash2, Mail, X, Users, ChevronDown } from 'lucide-react';

const MOCK_MEMBERS = [
  { id: '1', name: 'Aditya Sharma', email: 'aditya@blazion.io', role: 'owner', avatarUrl: null, joinedAt: '2024-01-15' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@blazion.io', role: 'admin', avatarUrl: null, joinedAt: '2024-02-20' },
  { id: '3', name: 'James Wilson', email: 'james@blazion.io', role: 'editor', avatarUrl: null, joinedAt: '2024-03-01' },
  { id: '4', name: 'Priya Patel', email: 'priya@blazion.io', role: 'viewer', avatarUrl: null, joinedAt: '2024-03-10' },
];

const ROLE_ICONS: Record<string, any> = {
  owner: <Crown size={12} />,
  admin: <Shield size={12} />,
  editor: <Pencil size={12} />,
  viewer: <Eye size={12} />,
};

const ROLE_COLORS: Record<string, string> = {
  owner: '#f59e0b', admin: '#7c3aed', editor: '#3b82f6', viewer: '#71717a',
};

export default function TeamPage() {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [members, setMembers] = useState(MOCK_MEMBERS);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => router.push('/dashboard')}><ArrowLeft size={18} /></button>
          <span className="dashboard-logo">⚡ Blazion Forms</span>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Team Management</h1>
            <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginTop: 4 }}>
              {members.length} members · Workspace: My Workspace
            </p>
          </div>
          <button className="btn btn-accent" onClick={() => setShowInvite(true)}>
            <UserPlus size={16} /> Invite Member
          </button>
        </div>

        {/* Role legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, fontSize: 12, color: 'var(--muted-foreground)' }}>
          {Object.entries(ROLE_COLORS).map(([role, color]) => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{ textTransform: 'capitalize' }}>{role}</span>
            </div>
          ))}
        </div>

        {/* Members list */}
        <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--card-border)', overflow: 'hidden' }}>
          {members.map((member, idx) => (
            <div
              key={member.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                borderBottom: idx < members.length - 1 ? '1px solid var(--card-border)' : 'none',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${ROLE_COLORS[member.role]}, ${ROLE_COLORS[member.role]}88)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
              }}>
                {getInitials(member.name)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{member.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{member.email}</div>
              </div>

              {/* Role badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                borderRadius: 50, background: `${ROLE_COLORS[member.role]}15`,
                color: ROLE_COLORS[member.role], fontSize: 12, fontWeight: 600,
                textTransform: 'capitalize',
              }}>
                {ROLE_ICONS[member.role]} {member.role}
              </div>

              {/* Joined */}
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </div>

              {/* Actions */}
              {member.role !== 'owner' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <select
                    value={member.role}
                    onChange={(e) => {
                      setMembers(members.map(m => m.id === member.id ? { ...m, role: e.target.value } : m));
                    }}
                    style={{
                      padding: '4px 8px', borderRadius: 6, border: '1px solid var(--card-border)',
                      background: 'var(--background)', color: 'var(--foreground)', fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    className="btn-icon"
                    style={{ width: 28, height: 28, border: 'none', color: 'var(--danger)' }}
                    onClick={() => { if (confirm(`Remove ${member.name}?`)) setMembers(members.filter(m => m.id !== member.id)); }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Invite Team Member</h2>
              <button className="btn-icon" onClick={() => setShowInvite(false)} style={{ border: 'none' }}><X size={18} /></button>
            </div>

            <div className="config-field">
              <label>Email Address</label>
              <input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div className="config-field">
              <label>Role</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="admin">Admin — Full access</option>
                <option value="editor">Editor — Create & edit forms</option>
                <option value="viewer">Viewer — Read-only access</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowInvite(false)}>Cancel</button>
              <button
                className="btn btn-accent"
                onClick={() => { alert(`Invite sent to ${inviteEmail}`); setShowInvite(false); setInviteEmail(''); }}
              >
                <Mail size={14} /> Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
