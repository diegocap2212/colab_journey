'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from './layout';
import {
  Hand, ClipboardList, Edit3, Star, Bell, Inbox, PenSquare,
  Zap, CheckCircle2, Circle, ArrowRight, RefreshCw, Target, AlertCircle,
} from 'lucide-react';

const SCORE_LABELS = ['Não conhece', 'Pouca exp.', 'Executa', 'Domina'];
const DIMENSION_LABELS: Record<string, string> = {
  execution: 'Execução', communication: 'Comunicação', dev: 'Desenvolvimento',
  maintain: 'Manutenção', study: 'Estudo', ownership: 'Ownership', cultural: 'Cultura',
};

function ScoreBar({ value, max = 3 }: { value: number | null; max?: number }) {
  if (value === null || value === undefined) return <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>—</span>;
  const pct = (value / max) * 100;
  const color = value === 0 ? 'var(--red)' : value === 1 ? 'var(--yellow)' : value === 2 ? 'var(--green)' : 'var(--brand-primary)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color, minWidth: '16px' }}>{value}</span>
    </div>
  );
}

// ── Journey Step Component ──────────────────────────────────────────────────
type StepStatus = 'done' | 'active' | 'locked';
function JourneyStep({ label, sub, status, isLast }: { label: string; sub: string; status: StepStatus; isLast?: boolean }) {
  const colors: Record<StepStatus, string> = {
    done: 'var(--green)',
    active: 'var(--brand-primary)',
    locked: 'var(--border-default)',
  };
  const bg: Record<StepStatus, string> = {
    done: 'var(--green-bg)',
    active: 'rgba(0,23,81,0.08)',
    locked: 'var(--bg-elevated)',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: bg[status], border: `2px solid ${colors[status]}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginBottom: 6,
          transition: 'all 0.3s',
        }}>
          {status === 'done'
            ? <CheckCircle2 size={18} color={colors[status]} />
            : status === 'active'
              ? <Circle size={18} color={colors[status]} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              : <Circle size={18} color={colors[status]} />}
        </div>
        <span style={{
          fontSize: '0.75rem', fontWeight: status === 'active' ? 700 : 500,
          color: status === 'locked' ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textAlign: 'center', whiteSpace: 'nowrap',
        }}>{label}</span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>{sub}</span>
      </div>
      {!isLast && (
        <div style={{
          height: 2, flex: 1, maxWidth: 40,
          background: status === 'done' ? 'var(--green)' : 'var(--border-subtle)',
          transition: 'background 0.3s',
          margin: '0 4px', marginBottom: 22,
        }} />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const user = useUser();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [cycle, setCycle] = useState<any>(null);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [pdis, setPdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/feedbacks').then(r => r.json()),
      fetch('/api/cycles').then(r => r.json()),
      fetch('/api/competencies').then(r => r.ok ? r.json() : null),
      fetch('/api/pdi').then(r => r.ok ? r.json() : []),
    ]).then(([fbs, cycles, matrix, pdi]) => {
      setFeedbacks(Array.isArray(fbs) ? fbs : []);
      const active = Array.isArray(cycles) ? cycles.find((c: any) => c.is_active) : null;
      setCycle(active || null);
      setMatrixData(matrix);
      setPdis(Array.isArray(pdi) ? pdi : []);
      setLoading(false);
    });
  }, []);

  const isPrivileged = user?.role !== 'user';
  const published = feedbacks.filter(f => !f.is_draft);
  const drafts = feedbacks.filter(f => f.is_draft);
  const unread = feedbacks.filter(f => !f.is_read && f.engineer_email === user?.email && !f.is_draft);
  const userSubmitted = matrixData?.user_submitted ?? false;
  const hasReceivedFeedback = published.some(f => f.engineer_email === user?.email);
  const hasPdi = pdis.length > 0;

  // ── Journey step resolution ──────────────────────────────────────────────
  const journeySteps: Array<{ label: string; sub: string; status: StepStatus }> = isPrivileged
    ? [
        { label: 'Ciclo aberto', sub: cycle ? cycle.name : 'Aguardando', status: cycle ? 'done' : 'active' },
        { label: 'Equipe avaliando', sub: `${matrixData?.participants?.length ?? 0} participantes`, status: cycle ? (userSubmitted ? 'done' : 'active') : 'locked' },
        { label: 'Feedbacks enviados', sub: `${published.length} publicados`, status: published.length > 0 ? 'done' : cycle ? 'active' : 'locked' },
        { label: 'PDIs criados', sub: `${pdis.length} metas`, status: hasPdi ? 'done' : published.length > 0 ? 'active' : 'locked' },
      ]
    : [
        { label: 'Ciclo aberto', sub: cycle ? cycle.name : 'Aguardando gestor', status: cycle ? 'done' : 'active' },
        { label: 'Autoavaliação', sub: userSubmitted ? 'Submetida ✓' : 'Pendente', status: !cycle ? 'locked' : userSubmitted ? 'done' : 'active' },
        { label: 'Feedback do gestor', sub: hasReceivedFeedback ? `${published.filter(f => f.engineer_email === user?.email).length} recebidos` : 'Aguardando', status: !userSubmitted ? 'locked' : hasReceivedFeedback ? 'done' : 'active' },
        { label: 'Plano de dev (PDI)', sub: hasPdi ? `${pdis.length} metas` : 'Não iniciado', status: !hasReceivedFeedback ? 'locked' : hasPdi ? 'done' : 'active' },
      ];

  // ── Next step CTA ────────────────────────────────────────────────────────
  type NextStep = { title: string; desc: string; href: string; label: string; variant: string } | null;
  let nextStep: NextStep = null;
  if (!isPrivileged) {
    if (!cycle) {
      nextStep = { title: 'Aguardando ciclo', desc: 'Um administrador precisa abrir um novo ciclo de avaliação antes de você iniciar.', href: '', label: '', variant: 'info' };
    } else if (!userSubmitted) {
      nextStep = { title: 'Preencha sua autoavaliação', desc: `O ciclo "${cycle?.name}" está aberto. Avalie suas competências técnicas agora.`, href: '/dashboard/matrix', label: 'Ir para Autoavaliação →', variant: 'primary' };
    } else if (!hasReceivedFeedback) {
      nextStep = { title: 'Autoavaliação enviada!', desc: 'Aguarde seu gestor publicar o feedback. Você será notificado quando estiver disponível.', href: '/dashboard/feedbacks', label: 'Ver meus feedbacks', variant: 'success' };
    } else if (!hasPdi) {
      nextStep = { title: 'Crie seu Plano de Desenvolvimento', desc: 'Você já tem feedbacks! Use os resultados para criar metas de crescimento no seu PDI.', href: '/dashboard/pdi', label: 'Ir para o PDI →', variant: 'primary' };
    } else {
      nextStep = { title: 'Você está em dia! 🎉', desc: 'Autoavaliação feita, feedback recebido e PDI ativo. Continue evoluindo.', href: '/dashboard/pdi', label: 'Ver meu PDI', variant: 'success' };
    }
  } else {
    if (!cycle) {
      nextStep = { title: 'Nenhum ciclo ativo', desc: 'Abra um novo ciclo de avaliação para que o time possa iniciar as autoavaliações.', href: '/dashboard/cycles', label: 'Gerenciar Ciclos →', variant: 'primary' };
    } else if (published.length === 0) {
      nextStep = { title: `Ciclo "${cycle?.name}" está aberto`, desc: 'Comece a avaliar os engenheiros do seu time e publique os feedbacks.', href: '/dashboard/new-feedback', label: 'Avaliar Engenheiro →', variant: 'primary' };
    }
  }

  // ── Averages ─────────────────────────────────────────────────────────────
  const dims = ['execution_score', 'communication_score', 'dev_score', 'maintain_score', 'study_score', 'ownership_score', 'cultural_score'];
  function avgScore(fbs: any[]) {
    const scores = fbs.flatMap(f => dims.map(d => f[d]).filter(v => v !== null && v !== undefined));
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
  }

  const recentFeedbacks = feedbacks.filter(f => !f.is_draft).slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div className="animate-fade">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {greeting}, {user?.name?.split(' ')[0]} <Hand size={26} color="var(--brand-accent)" />
          </h1>
          {isPrivileged && (
            <Link href="/dashboard/new-feedback" className="btn btn-primary">
              <PenSquare size={16} /> Avaliar Engenheiro
            </Link>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          {cycle
            ? <>Ciclo ativo: <strong style={{ color: 'var(--brand-primary)' }}>{cycle.name}</strong></>
            : <span style={{ color: 'var(--yellow)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={15} /> Nenhum ciclo aberto no momento</span>
          }
        </p>
      </div>

      {/* ── Journey Progress Bar ────────────────────────────────────────── */}
      <div className="card-elevated" style={{ marginBottom: '28px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Jornada do Ciclo
          </span>
          {cycle && <span className="badge badge-green"><RefreshCw size={10} /> {cycle.name}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          {journeySteps.map((step, i) => (
            <JourneyStep key={i} {...step} isLast={i === journeySteps.length - 1} />
          ))}
        </div>
      </div>

      {/* ── Next Step CTA ───────────────────────────────────────────────── */}
      {nextStep && (
        <div style={{
          background: nextStep.variant === 'success'
            ? 'linear-gradient(135deg, rgba(40,125,107,0.07), rgba(40,125,107,0.03))'
            : nextStep.variant === 'info'
              ? 'linear-gradient(135deg, rgba(42,75,155,0.07), rgba(42,75,155,0.03))'
              : 'linear-gradient(135deg, rgba(0,23,81,0.07), rgba(42,75,155,0.04))',
          border: `1px solid ${nextStep.variant === 'success' ? 'rgba(40,125,107,0.2)' : 'var(--border-brand)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{nextStep.title}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{nextStep.desc}</p>
          </div>
          {nextStep.href && nextStep.label && (
            <Link href={nextStep.href} className={`btn ${nextStep.variant === 'success' ? 'btn-secondary' : 'btn-primary'}`} style={{ flexShrink: 0 }}>
              {nextStep.label}
            </Link>
          )}
        </div>
      )}

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,23,81,0.08)', color: 'var(--brand-primary)' }}><ClipboardList size={22} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--brand-primary)' }}>{published.length}</div>
            <div className="stat-label">Feedbacks publicados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.1)', color: 'var(--yellow)' }}><Edit3 size={22} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--yellow)' }}>{drafts.length}</div>
            <div className="stat-label">Rascunhos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(40,125,107,0.1)', color: 'var(--green)' }}><Star size={22} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{avgScore(published)}</div>
            <div className="stat-label">Score médio geral</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(218,20,20,0.08)', color: 'var(--red)' }}><Bell size={22} /></div>
          <div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{unread.length}</div>
            <div className="stat-label">Não lidos</div>
          </div>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
        {/* Recent feedbacks */}
        <div className="card-elevated">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem' }}>Feedbacks Recentes</h3>
            <Link href="/dashboard/feedbacks" className="btn btn-ghost btn-sm">Ver todos →</Link>
          </div>
          {recentFeedbacks.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div className="empty-icon"><Inbox size={40} color="var(--text-tertiary)" /></div>
              <div className="empty-title">Nenhum feedback ainda</div>
              <div className="empty-description">
                {isPrivileged ? 'Avalie um engenheiro para começar.' : 'Aguardando seu gestor publicar o primeiro feedback.'}
              </div>
              {isPrivileged && (
                <Link href="/dashboard/new-feedback" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }}>
                  + Avaliar Engenheiro
                </Link>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Engenheiro</th>
                    <th>Ciclo</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFeedbacks.map(f => {
                    const scores = dims.map(d => f[d]).filter(v => v !== null && v !== undefined);
                    const avg = scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : '—';
                    const scoreNum = parseFloat(avg);
                    const scoreClass = isNaN(scoreNum) ? '' : scoreNum < 1 ? 'score-0' : scoreNum < 2 ? 'score-1' : scoreNum < 2.7 ? 'score-2' : 'score-3';
                    return (
                      <tr key={f.id}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {f.engineer_name}
                          {!f.is_read && f.engineer_email === user?.email && (
                            <span style={{ display: 'inline-block', width: 6, height: 6, background: 'var(--brand-primary)', borderRadius: '50%', marginLeft: 8 }} />
                          )}
                        </td>
                        <td><span className="badge badge-blue">{f.cycle}</span></td>
                        <td>
                          {avg !== '—' && <span className={`score-pill ${scoreClass}`}>{avg}</span>}
                          {avg === '—' && <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                        </td>
                        <td>
                          <span className={`badge ${f.is_draft ? 'badge-yellow' : 'badge-green'}`}>
                            {f.is_draft ? 'Rascunho' : 'Publicado'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {new Date(f.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Actions */}
          <div className="card-elevated">
            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Ações Rápidas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isPrivileged && (
                <Link href="/dashboard/new-feedback" className="btn btn-primary btn-full">
                  <PenSquare size={15} /> Avaliar Engenheiro
                </Link>
              )}
              {!isPrivileged && !userSubmitted && cycle && (
                <Link href="/dashboard/matrix" className="btn btn-primary btn-full">
                  <Zap size={15} /> Fazer Autoavaliação
                </Link>
              )}
              <Link href="/dashboard/matrix" className="btn btn-secondary btn-full">
                <Zap size={15} /> {isPrivileged ? 'Ver Matrix de Competências' : 'Minhas Competências'}
              </Link>
              <Link href="/dashboard/feedbacks" className="btn btn-secondary btn-full">
                <ClipboardList size={15} /> Ver Feedbacks
              </Link>
              {!isPrivileged && hasReceivedFeedback && (
                <Link href="/dashboard/pdi" className="btn btn-secondary btn-full">
                  <Target size={15} /> Meu PDI
                </Link>
              )}
              {isPrivileged && (
                <Link href="/dashboard/cycles" className="btn btn-secondary btn-full">
                  <RefreshCw size={15} /> Gerenciar Ciclos
                </Link>
              )}
            </div>
          </div>

          {/* Dimensions breakdown */}
          {published.length > 0 && (
            <div className="card-elevated">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem' }}>Scores por Dimensão</h3>
                <Link href="/dashboard/matrix" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                  Ver matrix <ArrowRight size={12} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
                  const dimKey = `${key}_score`;
                  const scores = published.map(f => f[dimKey]).filter(v => v !== null && v !== undefined) as number[];
                  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8125rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontWeight: 600 }}>{avg !== null ? avg.toFixed(1) : '—'}</span>
                      </div>
                      <ScoreBar value={avg !== null ? Math.round(avg * 10) / 10 : null} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
