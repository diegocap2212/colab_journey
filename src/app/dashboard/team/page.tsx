'use client';

import { useState, useEffect } from 'react';
import { Users, X } from 'lucide-react';

const DIMS = ['execution', 'communication', 'dev', 'maintain', 'study', 'ownership', 'cultural'];
const DIM_LABELS: Record<string, string> = {
  execution: 'Execução', communication: 'Comunicação', dev: 'Dev',
  maintain: 'Manutenção', study: 'Estudo', ownership: 'Ownership', cultural: 'Cultura',
};

function MiniBar({ value, max = 3, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ flex: 1, height: '5px', background: 'var(--bg-elevated)', borderRadius: '999px', overflow: 'hidden', minWidth: '40px' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: '20px' }}>{value.toFixed(1)}</span>
    </div>
  );
}

export default function TeamPage() {
  const [dashData, setDashData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      setDashData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const engineers = Object.entries(dashData);

  function getLatestScores(fbs: any[]) {
    const pub = fbs.filter(f => !f.is_draft);
    if (!pub.length) return null;
    const latest = pub[pub.length - 1];
    const result: Record<string, number | null> = {};
    for (const d of DIMS) result[d] = latest[`${d}_score`] ?? null;
    return result;
  }

  function getAvg(scores: Record<string, number | null> | null) {
    if (!scores) return null;
    const vals = Object.values(scores).filter(v => v !== null) as number[];
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }

  function getScoreColor(v: number) {
    if (v < 1) return 'var(--red)';
    if (v < 2) return 'var(--yellow)';
    if (v < 2.7) return 'var(--green)';
    return 'var(--brand-primary)';
  }

  const selectedFbs = selected ? dashData[selected] : null;
  const selectedPub = selectedFbs?.filter((f: any) => !f.is_draft) ?? [];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visão do Time</h1>
          <p className="page-subtitle">Performance e evolução de cada engenheiro</p>
        </div>
      </div>

      {engineers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={48} color="var(--text-tertiary)" /></div>
          <div className="empty-title">Nenhum dado ainda</div>
          <div className="empty-description">Publique feedbacks para ver a performance do time aqui.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 480px' : '1fr', gap: '24px' }}>
          {/* Team cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', alignContent: 'start' }}>
            {engineers.map(([email, fbs]) => {
              const latestScores = getLatestScores(fbs);
              const avg = getAvg(latestScores);
              const pub = fbs.filter(f => !f.is_draft);
              const name = fbs[0]?.engineer_name || email.split('@')[0];
              const color = avg !== null ? getScoreColor(avg) : 'var(--text-tertiary)';
              const isSelected = selected === email;

              return (
                <div
                  key={email}
                  className="card"
                  onClick={() => setSelected(isSelected ? null : email)}
                  style={{
                    cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(99,102,241,0.06)' : 'var(--bg-card)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${color}, var(--brand-primary))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9375rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{pub.length} feedback{pub.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    {avg !== null && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{avg.toFixed(1)}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>média</div>
                      </div>
                    )}
                  </div>

                  {latestScores && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {DIMS.map(d => {
                        const v = latestScores[d];
                        if (v === null) return null;
                        return (
                          <div key={d} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{DIM_LABELS[d]}</span>
                            <MiniBar value={v} color={getScoreColor(v)} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!latestScores && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px' }}>
                      Nenhum feedback publicado
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timeline panel */}
          {selected && selectedPub.length > 0 && (
            <div className="card-elevated animate-slide-up" style={{ position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 48px)', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3>{selectedPub[0]?.engineer_name}</h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{selectedPub.length} avaliações</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={16} /></button>
              </div>

              <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Evolução por Ciclo
              </h4>

              {selectedPub.map((fb: any, i: number) => {
                const scores: Record<string, number | null> = {};
                for (const d of DIMS) scores[d] = fb[`${d}_score`] ?? null;
                const avg = getAvg(scores);
                const color = avg !== null ? getScoreColor(avg) : 'var(--text-tertiary)';

                return (
                  <div key={fb.id} style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    marginBottom: '10px',
                    borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <span className="badge badge-purple">{fb.cycle}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                          {new Date(fb.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {avg !== null && (
                        <span style={{ fontWeight: 800, color, fontSize: '1.125rem' }}>{avg.toFixed(1)}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {DIMS.map(d => {
                        const v = scores[d];
                        if (v === null) return null;
                        return (
                          <div key={d} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{DIM_LABELS[d]}</span>
                            <MiniBar value={v} color={getScoreColor(v)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
