'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'user' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error);
      return;
    }
    setSuccess(`Usuário ${form.name} criado! Compartilhe o código de verificação para o primeiro acesso.`);
    setShowModal(false);
    setForm({ email: '', name: '', role: 'user' });
    loadUsers();
  }

  const ROLE_LABELS: Record<string, string> = { admin: 'Admin', gestor: 'Gestor', user: 'Engenheiro' };
  const ROLE_BADGE: Record<string, string> = { admin: 'badge-red', gestor: 'badge-blue', user: 'badge-purple' };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">{users.length} pessoas cadastradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Novo Usuário</button>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}><CheckCircle2 size={18} /> {success}</div>}

      <div className="card-elevated" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Cargo / Nível</th>
                  <th>Perfil</th>
                  <th>Cadastrado em</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                        }}>
                          {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name || u.email.split('@')[0]}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{u.email}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{u.job_title || '—'}</div>
                      {u.job_level && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{u.job_level}</div>}
                    </td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] || 'badge-purple'}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                    <td style={{ fontSize: '0.8125rem' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Usuário</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Nome *</label>
                <input type="text" className="input" placeholder="Nome completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">E-mail *</label>
                <input type="email" className="input" placeholder="nome@otmow.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Perfil</label>
                <select className="select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="user">Engenheiro</option>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center' }}>
                <Info size={18} />
                <span>Após criar, gere um código de verificação para o usuário fazer o primeiro acesso.</span>
              </div>

              {error && <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={18} /> {error}</div>}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : null}
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
