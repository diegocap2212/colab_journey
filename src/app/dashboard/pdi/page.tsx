'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, Circle, ArrowRight, Zap, ClipboardList, Info } from 'lucide-react';
import { useUser } from '../layout';
import Link from 'next/link';

type Status = 'pending' | 'completed';

export default function PDIPage() {
  const user = useUser();
  const [pdps, setPdps] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    competency_area: 'Execução',
    target_date: '',
  });

  const areas = ['Execução', 'Comunicação', 'Desenvolvimento', 'Manutenção', 'Estudo', 'Ownership', 'Cultura'];

  useEffect(() => {
    Promise.all([
      fetch('/api/pdi').then(r => r.ok ? r.json() : []),
      fetch('/api/feedbacks').then(r => r.ok ? r.json() : []),
    ]).then(([pdi, fbs]) => {
      setPdps(Array.isArray(pdi) ? pdi : []);
      setFeedbacks(Array.isArray(fbs) ? fbs.filter((f: any) => !f.is_draft && f.engineer_email === user?.email) : []);
      setLoading(false);
    });
  }, [user]);

  async function createPdp(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/pdi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, engineer_email: user?.email }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', description: '', competency_area: 'Execução', target_date: '' });
        const updated = await fetch('/api/pdi').then(r => r.json());
        setPdps(Array.isArray(updated) ? updated : []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function completePdp(id: number) {
    setCompleting(id);
    try {
      await fetch(`/api/pdi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      setPdps(prev => prev.map(p => p.id === id ? { ...p, status: 'completed' } : p));
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(null);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const isPrivileged = user?.role === 'admin' || user?.role === 'gestor';
  const pending = pdps.filter(p => p.status !== 'completed');
  const completed = pdps.filter(p => p.status === 'completed');
  const hasMyFeedbacks = feedbacks.length > 0;

  return (
    <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Plano de Desenvolvimento (PDI)</h1>
          <p className="page-subtitle">
            {isPrivileged
              ? 'Acompanhe os planos de desenvolvimento do time.'
              : 'Transforme feedbacks em metas concretas para sua carreira.'}
          </p>
        </div>
        {!isPrivileged && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Nova Meta
          </button>
        )}
      </div>

      {/* ── Context: how PDI connects with rest of the flow ───────────── */}
      {!isPrivileged && (
        <div className="alert alert-info" style={{ marginBottom: '24px' }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Como usar o PDI:</strong> Após receber seu feedback do gestor, crie metas de desenvolvimento para cada área que quer melhorar.
            O PDI é pessoal — você define os objetivos e acompanha o progresso ao longo dos ciclos.
            {!hasMyFeedbacks && (
              <span style={{ display: 'block', marginTop: '6px', color: 'var(--blue)' }}>
                💡 Você ainda não recebeu feedbacks publicados.{' '}
                <Link href="/dashboard/feedbacks" style={{ fontWeight: 600 }}>Verificar feedbacks →</Link>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────────────────────── */}
      {pdps.length > 0 && (
        <div className="grid-3" style={{ marginBottom: '28px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(0,23,81,0.08)', color: 'var(--brand-primary)' }}><Target size={22} /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--brand-primary)' }}>{pdps.length}</div>
              <div className="stat-label">Metas totais</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--yellow)' }}><Circle size={22} /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--yellow)' }}>{pending.length}</div>
              <div className="stat-label">Em andamento</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(40,125,107,0.1)', color: 'var(--green)' }}><CheckCircle2 size={22} /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>{completed.length}</div>
              <div className="stat-label">Concluídas</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {pdps.length === 0 && (
        <div className="empty-state" style={{ padding: '48px 24px' }}>
          <div className="empty-icon"><Target size={52} color="var(--text-tertiary)" /></div>
          <div className="empty-title">Nenhum plano de desenvolvimento ainda</div>
          <div className="empty-description">
            {isPrivileged
              ? 'Os engenheiros ainda não criaram metas de desenvolvimento.'
              : hasMyFeedbacks
                ? 'Você já tem feedbacks! Crie sua primeira meta com base nos resultados.'
                : 'Aguarde o feedback do seu gestor para criar metas baseadas nos resultados.'}
          </div>
          {!isPrivileged && hasMyFeedbacks && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '16px' }}>
              <Plus size={16} /> Criar Primeira Meta
            </button>
          )}
          {!isPrivileged && !hasMyFeedbacks && (
            <Link href="/dashboard/feedbacks" className="btn btn-secondary" style={{ marginTop: '16px' }}>
              <ClipboardList size={15} /> Ver meus feedbacks
            </Link>
          )}
        </div>
      )}

      {/* ── Pending PDPs ─────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem' }}>Em andamento</h3>
            <div style={{ height: 1, flex: 1, background: 'var(--border-subtle)' }} />
            <span className="badge badge-yellow">{pending.length}</span>
          </div>
          <div className="grid-3" style={{ marginBottom: '32px' }}>
            {pending.map(pdp => (
              <div key={pdp.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-blue">{pdp.competency_area}</span>
                  <Circle size={18} color="var(--yellow)" />
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', lineHeight: 1.4 }}>{pdp.title}</h3>
                {isPrivileged && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Engenheiro: <strong>{pdp.engineer_name}</strong>
                  </div>
                )}
                {pdp.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1, marginBottom: '16px', lineHeight: 1.5 }}>
                    {pdp.description}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {pdp.target_date ? `Prazo: ${new Date(pdp.target_date).toLocaleDateString('pt-BR')}` : 'Sem prazo definido'}
                  </span>
                  {!isPrivileged && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--green)' }}
                      onClick={() => completePdp(pdp.id)}
                      disabled={completing === pdp.id}
                    >
                      {completing === pdp.id ? <span className="spinner spinner-sm" /> : <><CheckCircle2 size={13} /> Concluir</>}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Completed PDPs ────────────────────────────────────────────── */}
      {completed.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Concluídas</h3>
            <div style={{ height: 1, flex: 1, background: 'var(--border-subtle)' }} />
            <span className="badge badge-green">{completed.length}</span>
          </div>
          <div className="grid-3" style={{ marginBottom: '32px' }}>
            {completed.map(pdp => (
              <div key={pdp.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column', opacity: 0.75 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-blue">{pdp.competency_area}</span>
                  <CheckCircle2 size={18} color="var(--green)" />
                </div>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px', lineHeight: 1.4 }}>{pdp.title}</h3>
                {isPrivileged && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                    Engenheiro: <strong>{pdp.engineer_name}</strong>
                  </div>
                )}
                {pdp.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1, marginBottom: '16px', lineHeight: 1.5 }}>
                    {pdp.description}
                  </p>
                )}
                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600 }}>✓ Concluída</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Bottom CTA: link to feedbacks ────────────────────────────── */}
      {!isPrivileged && hasMyFeedbacks && pdps.length > 0 && (
        <div className="card-elevated" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Precisa de mais insights?</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Revise seus feedbacks para identificar áreas de desenvolvimento que ainda não viraram metas.
            </p>
          </div>
          <Link href="/dashboard/feedbacks" className="btn btn-secondary">
            <ClipboardList size={15} /> Ver feedbacks <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Create PDI Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Meta de Desenvolvimento</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {hasMyFeedbacks && (
              <div className="alert alert-info" style={{ marginBottom: '20px', fontSize: '0.8125rem' }}>
                <Info size={15} style={{ flexShrink: 0 }} />
                Dica: base suas metas nos{' '}
                <Link href="/dashboard/feedbacks" style={{ fontWeight: 600 }} onClick={() => setShowModal(false)}>
                  feedbacks que você recebeu
                </Link>.
              </div>
            )}

            <form onSubmit={createPdp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Área de Competência</label>
                <select className="select" value={formData.competency_area} onChange={e => setFormData({ ...formData, competency_area: e.target.value })}>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Título da Meta</label>
                <input required type="text" className="input" placeholder="Ex: Tirar certificação AWS" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Descrição e Passos</label>
                <textarea rows={3} className="textarea" placeholder="O que você vai fazer exatamente? Quais os passos?" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Data Alvo (Opcional)</label>
                <input type="date" className="input" value={formData.target_date} onChange={e => setFormData({ ...formData, target_date: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
