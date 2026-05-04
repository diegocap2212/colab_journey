'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, CheckCircle2, AlertTriangle, Play, Square } from 'lucide-react';

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

  if (loading) return <div className="spinner" style={{ margin: '40px auto' }} />;

  return (
    <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Ciclos de Avaliação</h1>
          <p className="page-subtitle">Gerencie os períodos de autoavaliação e feedback do time.</p>
        </div>
      </div>

      <div className="card-elevated" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Iniciar Novo Ciclo</h3>
        <form onSubmit={createCycle} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Ex: Q3 2026"
            value={newCycleName}
            onChange={e => setNewCycleName(e.target.value)}
            style={{ flex: 1 }}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Plus size={16} /> Abrir Ciclo</>}
          </button>
        </form>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>Ao abrir um novo ciclo, os ciclos anteriores serão fechados automaticamente.</p>
      </div>

      <div className="card-elevated" style={{ padding: 0 }}>
        <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>Nome do Ciclo</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>Data de Criação</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map(cycle => (
              <tr key={cycle.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>{cycle.name}</td>
                <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{new Date(cycle.created_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '16px' }}>
                  {cycle.is_active ? (
                    <span className="badge badge-success"><CheckCircle2 size={12} /> Aberto</span>
                  ) : (
                    <span className="badge badge-error"><AlertTriangle size={12} /> Fechado</span>
                  )}
                </td>
                <td style={{ padding: '16px' }}>
                  <button 
                    className={cycle.is_active ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                    onClick={() => toggleStatus(cycle.id, cycle.is_active)}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {cycle.is_active ? <><Square size={14} /> Encerrar</> : <><Play size={14} /> Reabrir</>}
                  </button>
                </td>
              </tr>
            ))}
            {cycles.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  Nenhum ciclo encontrado. Crie o seu primeiro acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
