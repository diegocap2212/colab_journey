'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle2, Circle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useUser } from '../layout';

export default function PDIPage() {
  const user = useUser();
  const [pdps, setPdps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', competency_area: 'Execução', target_date: '' });

  const areas = ['Execução', 'Comunicação', 'Desenvolvimento', 'Manutenção', 'Estudo', 'Ownership', 'Cultura'];

  useEffect(() => {
    fetchPdps();
  }, []);

  async function fetchPdps() {
    setLoading(true);
    try {
      const res = await fetch('/api/pdi');
      const data = await res.json();
      if (res.ok) setPdps(data);
      else setPdps([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
        fetchPdps();
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="spinner" style={{ margin: '40px auto' }} />;

  const isPrivileged = user?.role === 'admin' || user?.role === 'gestor';

  return (
    <div className="animate-fade" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Plano de Desenvolvimento (PDI)</h1>
          <p className="page-subtitle">Transforme feedbacks em metas acionáveis para sua carreira.</p>
        </div>
        {!isPrivileged && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Nova Meta
          </button>
        )}
      </div>

      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {pdps.map(pdp => (
          <div key={pdp.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span className="badge badge-info">{pdp.competency_area}</span>
              {pdp.status === 'completed' ? (
                <CheckCircle2 size={20} color="var(--green)" />
              ) : (
                <Circle size={20} color="var(--brand-primary)" />
              )}
            </div>
            
            <h3 style={{ fontSize: '1.125rem', marginBottom: '8px', lineHeight: 1.4 }}>{pdp.title}</h3>
            {isPrivileged && <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Engenheiro: <strong>{pdp.engineer_name}</strong></div>}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1, marginBottom: '16px' }}>{pdp.description}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {pdp.target_date ? `Prazo: ${new Date(pdp.target_date).toLocaleDateString('pt-BR')}` : 'Sem prazo definido'}
              </span>
              {!isPrivileged && pdp.status !== 'completed' && (
                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                  Concluir <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {pdps.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><Target size={48} color="var(--text-tertiary)" /></div>
          <div className="empty-title">Nenhum plano ativo</div>
          <div className="empty-description">Você ainda não tem metas de desenvolvimento criadas.</div>
          {!isPrivileged && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '16px' }}>
              Criar Primeira Meta
            </button>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px',
            width: '100%', maxWidth: '500px',
          }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Nova Meta de Desenvolvimento</h3>
            <form onSubmit={createPdp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label>Área de Competência</label>
                <select className="input-field" value={formData.competency_area} onChange={e => setFormData({...formData, competency_area: e.target.value})}>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Título da Meta</label>
                <input required type="text" className="input-field" placeholder="Ex: Tirar certificação AWS" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Descrição e Passos</label>
                <textarea rows={3} className="input-field" placeholder="O que você vai fazer exatamente?" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Data Alvo (Opcional)</label>
                <input type="date" className="input-field" value={formData.target_date} onChange={e => setFormData({...formData, target_date: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
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
