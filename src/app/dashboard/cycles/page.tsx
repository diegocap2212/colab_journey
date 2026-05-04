'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, CheckCircle2, AlertTriangle, Play, Square, Calendar, Hash, ArrowRight } from 'lucide-react';

export default function CyclesPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCycleName, setNewCycleName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCycles();
  }, []);

  async function fetchCycles() {
    setLoading(true);
    try {
      const res = await fetch('/api/cycles');
      const data = await res.json();
      setCycles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createCycle(e: React.FormEvent) {
    e.preventDefault();
    if (!newCycleName) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCycleName }),
      });
      if (res.ok) {
        setNewCycleName('');
        fetchCycles();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleStatus(id: number, currentStatus: number) {
    try {
      const res = await fetch(`/api/cycles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: currentStatus === 1 ? 0 : 1 }),
      });
      if (res.ok) {
        fetchCycles();
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ciclos de Avaliação</h1>
          <p className="page-subtitle">Gerencie os períodos de autoavaliação e feedback do time</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Cycles List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cycles.length === 0 ? (
            <div className="empty-state card-elevated" style={{ padding: '60px 20px' }}>
              <div className="empty-icon"><RefreshCw size={48} color="var(--text-tertiary)" /></div>
              <div className="empty-title">Nenhum ciclo criado</div>
              <div className="empty-description">Crie seu primeiro ciclo de avaliação para começar.</div>
            </div>
          ) : (
            cycles.map(cycle => (
              <div key={cycle.id} className="card-elevated" style={{ 
                padding: '20px 24px', 
                borderLeft: `4px solid ${cycle.is_active ? 'var(--green)' : 'var(--border-default)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: cycle.is_active ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: cycle.is_active ? 'var(--green)' : 'var(--text-tertiary)'
                  }}>
                    <Hash size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '1.125rem', margin: 0 }}>{cycle.name}</h3>
                      {cycle.is_active ? (
                        <span className="badge badge-green" style={{ fontSize: '0.6875rem' }}>ATIVO</span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '0.6875rem' }}>FECHADO</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} /> Criado em {new Date(cycle.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className={`btn btn-sm ${cycle.is_active ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => toggleStatus(cycle.id, cycle.is_active)}
                    style={{ minWidth: '100px' }}
                  >
                    {cycle.is_active ? <><Square size={14} /> Encerrar</> : <><Play size={14} /> Reabrir</>}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Sidebar */}
        <div className="card-elevated" style={{ position: 'sticky', top: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(0,23,81,0.08)', color: 'var(--brand-primary)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
              <Plus size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Novo Ciclo</h3>
          </div>
          
          <form onSubmit={createCycle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label className="input-label">Nome do Ciclo</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Q3 2026"
                value={newCycleName}
                onChange={e => setNewCycleName(e.target.value)}
                required
              />
            </div>
            
            <div className="alert alert-info" style={{ fontSize: '0.8125rem', lineHeight: '1.4' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>Ao abrir um novo ciclo, qualquer outro ciclo ativo será <strong>encerrado automaticamente</strong>.</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
              {isSubmitting ? <span className="spinner spinner-sm" /> : 'Abrir Novo Ciclo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
