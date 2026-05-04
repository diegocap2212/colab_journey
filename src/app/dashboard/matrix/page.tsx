'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../layout';
import { Zap, Check, AlertTriangle, Users, TrendingDown, CheckCircle2, XCircle, ArrowUp, ArrowDown } from 'lucide-react';

const SCORE_LABELS = ['Não conhece', 'Pouca experiência', 'Executa com domínio', 'Domina e ensina'];
const SCORE_COLORS = ['var(--red)', 'var(--yellow)', 'var(--green)', 'var(--brand-primary)'];

export default function MatrixPage() {
  const user = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadMatrix(); }, []);

  async function loadMatrix() {
    setLoading(true);
    const res = await fetch('/api/competencies');
    if (res.ok) {
      const d = await res.json();
      setData(d);
      if (d.my_scores) setScores(d.my_scores);
    }
    setLoading(false);
  }

  async function saveScores() {
    setSaving(true);
    setError('');
    const res = await fetch('/api/competencies/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error);
    } else {
      setSuccess('Rascunho salvo com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    }
  }

  async function submitMatrix() {
    if (!confirm('Ao submeter, sua avaliação ficará bloqueada até o próximo ciclo. Confirmar?')) return;
    setSubmitting(true);
    setError('');
    const saveRes = await fetch('/api/competencies/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores }),
    });
    const subRes = await fetch('/api/competencies/submit', { method: 'POST' });
    setSubmitting(false);
    if (!subRes.ok) {
      const d = await subRes.json();
      setError(d.error);
    } else {
      loadMatrix();
      setSuccess('Autoavaliação submetida com sucesso!');
      setTimeout(() => setSuccess(''), 4000);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!data) return (
    <div className="empty-state">
      <div className="empty-icon"><Zap size={48} color="var(--text-tertiary)" /></div>
      <div className="empty-title">Nenhum ciclo ativo</div>
      <div className="empty-description">Um administrador precisa criar um ciclo de avaliação.</div>
    </div>
  );

  const isPrivileged = data.is_privileged;
  const submitted = data.user_submitted;

  // Group definitions by category
  const categories: Record<string, any[]> = {};
  for (const def of data.definitions || []) {
    if (!categories[def.category]) categories[def.category] = [];
    categories[def.category].push(def);
  }

  const participants: string[] = data.participants?.map((p: any) => p.email) ?? [];

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Minhas Competências</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Ciclo: <strong>{data.cycle_name}</strong> · 
            {data.is_active ? 
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--green)' }}><CheckCircle2 size={14} /> Ativo</span> : 
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--red)' }}><XCircle size={14} /> Encerrado</span>
            }
          </p>
        </div>
        {!isPrivileged && !submitted && data.is_active && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={saveScores} disabled={saving}>
              {saving ? <span className="spinner spinner-sm" /> : null}
              Salvar Rascunho
            </button>
            <button className="btn btn-primary" onClick={submitMatrix} disabled={submitting}>
              {submitting ? <span className="spinner spinner-sm" /> : <Check size={16} />}
              Submeter Avaliação
            </button>
          </div>
        )}
      </div>

      {/* Status alerts */}
      {submitted && !isPrivileged && (
        <div className="alert alert-success" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
          <CheckCircle2 size={18} /> Você já submeteu sua autoavaliação neste ciclo. Aguarde o próximo ciclo para editar.
        </div>
      )}
      {error && <div className="alert alert-error" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}><AlertTriangle size={18} /> {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}><CheckCircle2 size={18} /> {success}</div>}

      {/* Manager stats */}
      {isPrivileged && (
        <div className="grid-3" style={{ marginBottom: '28px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--brand-primary)' }}><Users size={24} /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--brand-primary-light)' }}>{participants.length}</div>
              <div className="stat-label">Participantes</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: 'var(--green)' }}><Zap size={24} /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>
                {(() => {
                  const allAvgs = data.definitions.map((d: any) => d.avg_score).filter((v: any) => v !== null);
                  return allAvgs.length ? (allAvgs.reduce((a: number, b: number) => a + b, 0) / allAvgs.length).toFixed(1) : '—';
                })()}
              </div>
              <div className="stat-label">Média geral do time</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--red)' }}><TrendingDown size={24} /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>
                {data.definitions.filter((d: any) => d.avg_score !== null && d.avg_score < d.target_score).length}
              </div>
              <div className="stat-label">Competências abaixo do target</div>
            </div>
          </div>
        </div>
      )}

      {/* Matrix */}
      {Object.entries(categories).map(([category, defs]) => (
        <div key={category} style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '12px', paddingBottom: '10px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ fontSize: '1rem' }}>{category}</h3>
            <div style={{ height: '1px', flex: 1, background: 'var(--border-subtle)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {defs.map((def: any) => {
              const myScore = scores[def.id] ?? null;
              const target = def.target_score;
              const avg = def.avg_score;
              const aboveTarget = avg !== null && avg >= target;

              return (
                <div key={def.id} style={{
                  padding: '16px 20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'grid',
                  gridTemplateColumns: isPrivileged ? '1fr auto 220px' : '1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                  transition: 'border-color 0.15s',
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9375rem', marginBottom: '2px' }}>{def.sub_category}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Target:</span>
                      <span className={`score-pill score-${target}`}>{target}</span>
                      {isPrivileged && avg !== null && (
                        <>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>Média:</span>
                          <span className={`score-pill score-${Math.round(avg)}`}>{avg.toFixed(1)}</span>
                          <span style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center' }}>
                            {aboveTarget ? <ArrowUp size={16} color="var(--green)" /> : <ArrowDown size={16} color="var(--red)" />}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* My score or avg */}
                  {!isPrivileged && (
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      {myScore !== null ? (
                        <div>
                          <span className={`score-pill score-${myScore}`} style={{ width: 36, height: 36 }}>{myScore}</span>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{SCORE_LABELS[myScore]}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>—</span>
                      )}
                    </div>
                  )}

                  {/* Score selector (user, not submitted) */}
                  {!isPrivileged && !submitted && data.is_active && (
                    <div className="score-selector">
                      {[0, 1, 2, 3].map(s => (
                        <button
                          key={s}
                          className={`score-btn ${myScore === s ? `active-${s}` : ''}`}
                          onClick={() => setScores(prev => ({ ...prev, [def.id]: s }))}
                          title={SCORE_LABELS[s]}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Manager: heatmap by user */}
                  {isPrivileged && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {Object.entries(def.scores_by_user || {}).map(([email, score]: [string, any]) => (
                        <div key={email} title={`${email}: ${score}`} className={`score-pill score-${score}`}>
                          {score}
                        </div>
                      ))}
                      {Object.keys(def.scores_by_user || {}).length === 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Sem respostas</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
