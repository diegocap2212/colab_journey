'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '../layout';
import { PenSquare, Inbox, Trash2, X } from 'lucide-react';

const DIMS = [
  { key: 'execution', label: 'Execução' },
  { key: 'communication', label: 'Comunicação' },
  { key: 'dev', label: 'Dev' },
  { key: 'maintain', label: 'Manutenção' },
  { key: 'study', label: 'Estudo' },
  { key: 'ownership', label: 'Ownership' },
  { key: 'cultural', label: 'Cultura' },
];

function avgScore(fb: any) {
  const scores = DIMS.map(d => fb[`${d.key}_score`]).filter(v => v !== null && v !== undefined) as number[];
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}

export default function FeedbacksPage() {
  const user = useUser();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch('/api/feedbacks').then(r => r.json()).then(data => {
      setFeedbacks(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  async function deleteFeedback(id: number) {
    if (!confirm('Excluir este feedback?')) return;
    await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' });
    setFeedbacks(f => f.filter(fb => fb.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const filtered = feedbacks.filter(f => {
    if (filter === 'draft' && !f.is_draft) return false;
    if (filter === 'published' && f.is_draft) return false;
    if (search && !f.engineer_name.toLowerCase().includes(search.toLowerCase()) &&
        !f.cycle?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isPrivileged = user?.role !== 'user';

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Feedbacks</h1>
          <p className="page-subtitle">{feedbacks.length} registros no total</p>
        </div>
        {isPrivileged && (
          <Link href="/dashboard/new-feedback" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PenSquare size={16} /> Novo Feedback
          </Link>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="input"
          style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }}
          placeholder="Buscar por nome ou ciclo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {(['all', 'published', 'draft'] as const).map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todos' : f === 'published' ? 'Publicados' : 'Rascunhos'}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '24px' }}>
        {/* List */}
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Inbox size={48} color="var(--text-tertiary)" /></div>
              <div className="empty-title">Nenhum feedback encontrado</div>
              <div className="empty-description">Tente ajustar os filtros ou criar um novo feedback.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Engenheiro</th>
                    <th>Avaliador</th>
                    <th>Ciclo</th>
                    {DIMS.slice(0, 3).map(d => <th key={d.key}>{d.label}</th>)}
                    <th>Média</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(fb => {
                    const avg = avgScore(fb);
                    const avgStr = avg !== null ? avg.toFixed(1) : '—';
                    const scoreClass = avg === null ? '' : avg < 1 ? 'score-0' : avg < 2 ? 'score-1' : avg < 2.7 ? 'score-2' : 'score-3';
                    return (
                      <tr
                        key={fb.id}
                        onClick={() => setSelected(selected?.id === fb.id ? null : fb)}
                        style={{ cursor: 'pointer', background: selected?.id === fb.id ? 'rgba(99,102,241,0.06)' : undefined }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {fb.engineer_name}
                            {!fb.is_read && fb.engineer_email === user?.email && (
                              <span style={{ display: 'inline-block', width: 6, height: 6, background: 'var(--brand-primary)', borderRadius: '50%', marginLeft: 8, verticalAlign: 'middle' }} />
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{fb.engineer_email}</div>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>
                          {fb.is_anonymous && fb.engineer_email === user?.email ? 'Anônimo' : fb.evaluator_name}
                        </td>
                        <td><span className="badge badge-purple">{fb.cycle}</span></td>
                        {DIMS.slice(0, 3).map(d => {
                          const s = fb[`${d.key}_score`];
                          return <td key={d.key}>{s !== null && s !== undefined ? <span className={`score-pill score-${s}`}>{s}</span> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</td>;
                        })}
                        <td>
                          {avg !== null ? <span className={`score-pill ${scoreClass}`}>{avgStr}</span> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                        </td>
                        <td>
                          <span className={`badge ${fb.is_draft ? 'badge-yellow' : 'badge-green'}`}>
                            {fb.is_draft ? 'Rascunho' : 'Publicado'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {new Date(fb.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          {(isPrivileged || fb.evaluator_email === user?.email) && (
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: '4px' }} onClick={() => deleteFeedback(fb.id)}><Trash2 size={16} /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card-elevated animate-slide-up" style={{ position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 48px)', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3>{selected.engineer_name}</h3>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{selected.cycle} · {new Date(selected.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            {/* Scores */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scores</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DIMS.map(d => {
                  const score = selected[`${d.key}_score`];
                  const text = selected[`${d.key}_text`];
                  if (score === null && !text) return null;
                  const colors = ['var(--red)', 'var(--yellow)', 'var(--green)', 'var(--brand-primary)'];
                  const bgs = ['rgba(239,68,68,0.08)', 'rgba(245,158,11,0.08)', 'rgba(34,197,94,0.08)', 'rgba(99,102,241,0.08)'];
                  return (
                    <div key={d.key} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: score !== null ? bgs[score] : 'var(--bg-elevated)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: text ? '6px' : 0 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{d.label}</span>
                        {score !== null && <span style={{ fontWeight: 700, color: colors[score] }}>{score}</span>}
                      </div>
                      {text && <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {selected.general_text && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observações Gerais</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  {selected.general_text}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className={`badge ${selected.is_draft ? 'badge-yellow' : 'badge-green'}`}>
                {selected.is_draft ? 'Rascunho' : 'Publicado'}
              </span>
              {selected.is_anonymous && <span className="badge badge-purple">Anônimo</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
