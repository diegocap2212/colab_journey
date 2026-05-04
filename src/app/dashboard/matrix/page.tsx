'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../layout';
import Link from 'next/link';
import {
  Zap, Check, AlertTriangle, Users, TrendingDown, CheckCircle2, XCircle,
  ArrowUp, ArrowDown, Target, ArrowRight, Info,
} from 'lucide-react';

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
    await fetch('/api/competencies/scores', {
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
      <div className="empty-description">
        Um administrador precisa criar um ciclo de avaliação antes de você preencher suas competências.
      </div>
    </div>
  );

  const isPrivileged = data.is_privileged;
  const submitted = data.user_submitted;

  // Group by category
  const categories: Record<string, any[]> = {};
  for (const def of data.definitions || []) {
    if (!categories[def.category]) categories[def.category] = [];
    categories[def.category].push(def);
  }

  const participants: string[] = data.participants?.map((p: any) => p.email) ?? [];

  return (
    <div className="animate-fade">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{isPrivileged ? 'Matrix de Competências' : 'Minhas Competências'}</h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            Ciclo: <strong style={{ color: 'var(--brand-primary)' }}>{data.cycle_name}</strong> ·{' '}
            {data.is_active
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--green)' }}><CheckCircle2 size={14} /> Aberto</span>
              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--red)' }}><XCircle size={14} /> Encerrado</span>
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

      {/* ── Context banner for engineer ───────────────────────────────── */}
      {!isPrivileged && !submitted && data.is_active && (
        <div className="alert alert-info" style={{ marginBottom: '24px' }}>
          <Info size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Como funciona:</strong> Avalie seu nível em cada competência de 0 a 3. Depois de submeter, seu gestor usará sua autoavaliação para comparar com o feedback dele.
            <span style={{ marginLeft: 8 }}>
              Escala: <strong>0</strong> Não conhece · <strong>1</strong> Pouca exp. · <strong>2</strong> Executa · <strong>3</strong> Domina
            </span>
          </div>
        </div>
      )}

      {/* ── Submitted state ───────────────────────────────────────────── */}
      {submitted && !isPrivileged && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(40,125,107,0.08), rgba(40,125,107,0.03))',
          border: '1px solid rgba(40,125,107,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <CheckCircle2 size={22} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>Autoavaliação enviada com sucesso!</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Aguarde seu gestor publicar o feedback. Você poderá editar novamente no próximo ciclo.
              </p>
            </div>
          </div>
          <Link href="/dashboard/feedbacks" className="btn btn-secondary" style={{ flexShrink: 0 }}>
            Ver meus feedbacks <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}><AlertTriangle size={18} /> {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}><CheckCircle2 size={18} /> {success}</div>}

      {/* ── Manager stats ─────────────────────────────────────────────── */}
      {isPrivileged && (
        <div className="grid-3" style={{ marginBottom: '28px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(0,23,81,0.08)', color: 'var(--brand-primary)' }}><Users size={22} /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--brand-primary)' }}>{participants.length}</div>
              <div className="stat-label">Participantes</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(40,125,107,0.1)', color: 'var(--green)' }}><Zap size={22} /></div>
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
            <div className="stat-icon" style={{ background: 'rgba(218,20,20,0.08)', color: 'var(--red)' }}><TrendingDown size={22} /></div>
            <div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>
                {data.definitions.filter((d: any) => d.avg_score !== null && d.avg_score < d.target_score).length}
              </div>
              <div className="stat-label">Abaixo do target</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Matrix ────────────────────────────────────────────────────── */}
      {Object.entries(categories).map(([category, defs]) => (
        <div key={category} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
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
                  border: `1px solid ${!isPrivileged && myScore !== null ? 'var(--border-brand)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'grid',
                  gridTemplateColumns: isPrivileged ? '1fr auto 220px' : '1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                  transition: 'border-color 0.15s',
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9375rem', marginBottom: '4px' }}>{def.sub_category}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Target:</span>
                      <span className={`score-pill score-${target}`}>{target}</span>
                      {isPrivileged && avg !== null && (
                        <>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '4px' }}>Média:</span>
                          <span className={`score-pill score-${Math.round(avg)}`}>{avg.toFixed(1)}</span>
                          <span style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center' }}>
                            {aboveTarget ? <ArrowUp size={14} color="var(--green)" /> : <ArrowDown size={14} color="var(--red)" />}
                          </span>
                        </>
                      )}
                      {!isPrivileged && myScore !== null && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                          {SCORE_LABELS[myScore]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score display for user (submitted) */}
                  {!isPrivileged && submitted && (
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      {myScore !== null ? (
                        <span className={`score-pill score-${myScore}`} style={{ width: 36, height: 36, fontSize: '1rem' }}>{myScore}</span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>—</span>
                      )}
                    </div>
                  )}

                  {/* Score selector */}
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

                  {/* Manager heatmap */}
                  {isPrivileged && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {Object.entries(def.scores_by_user || {}).map(([email, score]: [string, any]) => (
                        <div key={email} title={`${email}: ${score}`} className={`score-pill score-${score}`}>{score}</div>
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

      {/* ── Bottom CTA for user ───────────────────────────────────────── */}
      {!isPrivileged && submitted && (
        <div className="card-elevated" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Próximo passo: seu Plano de Desenvolvimento</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Quando o gestor publicar seu feedback, acesse o PDI para criar metas baseadas nos resultados.
            </p>
          </div>
          <Link href="/dashboard/pdi" className="btn btn-secondary">
            <Target size={15} /> Ver meu PDI
          </Link>
        </div>
      )}
    </div>
  );
}
