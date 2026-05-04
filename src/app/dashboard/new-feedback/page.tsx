'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../layout';
import { Zap, MessageSquare, Wrench, ShieldCheck, BookOpen, Target, Users, Check, X, Lock, Lightbulb, AlertTriangle, ArrowRight, Rocket } from 'lucide-react';

const STEPS_ALL = [
  { id: 1, title: 'Sobre quem?', subtitle: 'Identifique o engenheiro e o ciclo' },
  { id: 2, title: 'Dimensões técnicas', subtitle: 'Avalie as competências com scores e contexto' },
  { id: 3, title: 'Contexto', subtitle: 'Observações finais e impactos' },
  { id: 4, title: 'Revisar & Publicar', subtitle: 'Confira o feedback antes de finalizar' },
];

const DIMENSIONS = [
  { key: 'execution', label: 'Execução', icon: Zap, description: 'Entrega, qualidade do código, resolução de bloqueios' },
  { key: 'communication', label: 'Comunicação', icon: MessageSquare, description: 'Clareza em rituais, documentação, proatividade em reports' },
  { key: 'dev', label: 'Desenvolvimento', icon: Wrench, description: 'PR reviews, boas práticas, testes, padrões de código' },
  { key: 'maintain', label: 'Manutenção', icon: ShieldCheck, description: 'Monitoramento, alertas, gestão de débito técnico' },
  { key: 'study', label: 'Estudo', icon: BookOpen, description: 'Aprendizado contínuo, compartilhamento de conhecimento' },
  { key: 'ownership', label: 'Ownership', icon: Target, description: 'Responsabilidade por resultados, iniciativa própria' },
  { key: 'cultural', label: 'Cultura', icon: Users, description: 'Colaboração, aderência aos valores da empresa' },
];

const SCORE_LABELS = ['0 – Não conhece', '1 – Pouca experiência', '2 – Executa com domínio', '3 – Domina e ensina'];

interface FormData {
  type: 'completo' | 'rapido';
  engineer_email: string;
  engineer_name: string;
  cycle: string;
  is_anonymous: boolean;
  general_text: string;
  impacts: string[];
  [key: string]: any;
}

export default function NewFeedbackPage() {
  const user = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    type: 'completo', engineer_email: '', engineer_name: '', cycle: '', is_anonymous: false,
    general_text: '', impacts: [''],
    ...Object.fromEntries(DIMENSIONS.flatMap(d => [[`${d.key}_score`, null], [`${d.key}_text`, '']])),
  });

  const ACTIVE_STEPS = form.type === 'rapido' ? STEPS_ALL.filter(s => s.id !== 2) : STEPS_ALL;
  const currentStepIndex = ACTIVE_STEPS.findIndex(s => s.id === step);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setUsers(data.filter((u: any) => u.email !== user?.email));
    });
  }, [user]);

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function selectEngineer(u: any) {
    set('engineer_email', u.email);
    set('engineer_name', u.name || u.email.split('@')[0]);
  }

  function addImpact() { setForm(f => ({ ...f, impacts: [...f.impacts, ''] })); }
  function setImpact(i: number, v: string) {
    setForm(f => { const impacts = [...f.impacts]; impacts[i] = v; return { ...f, impacts }; });
  }
  function removeImpact(i: number) {
    setForm(f => ({ ...f, impacts: f.impacts.filter((_: any, idx: number) => idx !== i) }));
  }

  function canGoNext() {
    if (step === 1) {
      if (form.type === 'rapido') return form.engineer_email;
      return form.engineer_email && form.cycle;
    }
    if (step === 2) return DIMENSIONS.some(d => form[`${d.key}_score`] !== null);
    if (step === 3 && form.type === 'rapido') return form.general_text.trim().length > 0;
    return true;
  }

  function goNext() {
    if (step === 1 && form.type === 'rapido') setStep(3);
    else setStep(s => s + 1);
  }

  function goPrev() {
    if (step === 3 && form.type === 'rapido') setStep(1);
    else setStep(s => s - 1);
  }

  async function save(isDraft: boolean) {
    setSaving(true);
    setError('');
    const payload = { ...form, is_draft: isDraft, impacts: form.impacts.filter(Boolean) };
    const res = await fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Erro ao salvar');
      return;
    }
    router.push('/dashboard/feedbacks');
  }

  const progress = (currentStepIndex / (ACTIVE_STEPS.length - 1)) * 100;

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Novo Feedback</h1>
          <p className="page-subtitle">Preencha as informações passo a passo</p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}><X size={16} /> Cancelar</button>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          {ACTIVE_STEPS.map((s, idx) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: idx <= currentStepIndex ? 'var(--brand-primary)' : 'var(--bg-elevated)',
                border: `2px solid ${idx <= currentStepIndex ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                color: idx <= currentStepIndex ? '#fff' : 'var(--text-tertiary)',
                fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s',
              }}>
                {idx < currentStepIndex ? <Check size={14} strokeWidth={3} /> : (idx + 1)}
              </div>
              <div style={{ display: idx < ACTIVE_STEPS.length - 1 ? 'flex' : 'none', flex: 1, height: '2px', background: idx < currentStepIndex ? 'var(--brand-primary)' : 'var(--border-subtle)', transition: 'background 0.3s' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem' }}>{ACTIVE_STEPS[currentStepIndex].title}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{ACTIVE_STEPS[currentStepIndex].subtitle}</p>
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Etapa {currentStepIndex + 1} de {ACTIVE_STEPS.length}</span>
        </div>
      </div>

      <div className="card-elevated" style={{ marginBottom: '24px', minHeight: '400px' }}>
        {/* Step 1: Basic info */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="input-group">
              <label className="input-label">Tipo de Avaliação</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div 
                  onClick={() => set('type', 'completo')}
                  style={{ 
                    padding: '16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `2px solid ${form.type === 'completo' ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                    background: form.type === 'completo' ? 'rgba(99,102,241,0.05)' : 'var(--bg-surface)'
                  }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}><Zap size={18} color="var(--brand-primary)" /> Avaliação Completa</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Avalie as 7 dimensões técnicas no ciclo atual. Ideal para fechamento de quarter.</div>
                </div>
                <div 
                  onClick={() => set('type', 'rapido')}
                  style={{ 
                    padding: '16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `2px solid ${form.type === 'rapido' ? 'var(--green)' : 'var(--border-default)'}`,
                    background: form.type === 'rapido' ? 'rgba(34,197,94,0.05)' : 'var(--bg-surface)'
                  }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}><MessageSquare size={18} color="var(--green)" /> Feedback Rápido</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Um elogio ou toque rápido sobre uma entrega recente. Pula as notas.</div>
                </div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Engenheiro *</label>
              {users.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {users.map(u => (
                    <button
                      key={u.email}
                      onClick={() => selectEngineer(u)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${form.engineer_email === u.email ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                        background: form.engineer_email === u.email ? 'rgba(99,102,241,0.1)' : 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        textAlign: 'left', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: '32px', height: '32px', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                      }}>
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name || u.email.split('@')[0]}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{u.job_title || u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="alert alert-warning">
                  <AlertTriangle size={18} /> Nenhum engenheiro encontrado. Cadastre usuários primeiro em Usuários.
                </div>
              )}
            </div>

            {form.type === 'completo' && (
              <div className="input-group">
                <label className="input-label">Ciclo / Período *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Q2 2026, Abril 2026, Sprint 42..."
                  value={form.cycle}
                  onChange={e => set('cycle', e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="is_anon"
                checked={form.is_anonymous}
                onChange={e => set('is_anonymous', e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
              />
              <label htmlFor="is_anon" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Feedback anônimo (seu nome não será exibido para o engenheiro)
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Dimensions */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center' }}>
              <Lightbulb size={18} />
              <span><strong>Escala:</strong> 0 = Não conhece · 1 = Pouca experiência · 2 = Executa com domínio · 3 = Domina e ensina</span>
            </div>

            {DIMENSIONS.map(dim => (
              <div key={dim.key} style={{
                padding: '20px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                    <dim.icon size={20} color="var(--brand-primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{dim.label}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{dim.description}</div>
                  </div>
                </div>

                <div className="score-selector" style={{ marginBottom: '12px' }}>
                  {[0, 1, 2, 3].map(score => (
                    <button
                      key={score}
                      className={`score-btn ${form[`${dim.key}_score`] === score ? `active-${score}` : ''}`}
                      onClick={() => set(`${dim.key}_score`, score)}
                    >
                      {score}
                    </button>
                  ))}
                </div>

                {form[`${dim.key}_score`] !== null && (
                  <div style={{ marginBottom: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Selecionado: <strong>{SCORE_LABELS[form[`${dim.key}_score`]]}</strong>
                  </div>
                )}

                <textarea
                  className="textarea"
                  style={{ minHeight: '72px' }}
                  placeholder={`Contexto, exemplos e observações sobre ${dim.label.toLowerCase()}...`}
                  value={form[`${dim.key}_text`]}
                  onChange={e => set(`${dim.key}_text`, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 3: General */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label">{form.type === 'rapido' ? 'Mensagem do Feedback *' : 'Observações gerais'}</label>
              <textarea
                className="textarea"
                style={{ minHeight: '140px' }}
                placeholder={form.type === 'rapido' ? 'Escreva aqui o seu elogio ou ponto de atenção...' : 'Contexto geral do período, highlights, conquistas, desafios enfrentados...'}
                value={form.general_text}
                onChange={e => set('general_text', e.target.value)}
              />
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="input-label">Impactos & Próximos Passos</label>
                <button className="btn btn-ghost btn-sm" onClick={addImpact}>+ Adicionar</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {form.impacts.map((imp: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--brand-primary)', display: 'flex' }}><ArrowRight size={16} /></span>
                    <input
                      type="text"
                      className="input"
                      placeholder={`Ex: Melhorar cobertura de testes para ${'>'}80%`}
                      value={imp}
                      onChange={e => setImpact(i, e.target.value)}
                    />
                    {form.impacts.length > 1 && (
                      <button className="btn btn-ghost btn-sm" onClick={() => removeImpact(i)} style={{ color: 'var(--red)', padding: '0 8px' }}><X size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>ENGENHEIRO</div>
                <div style={{ fontWeight: 600 }}>{form.engineer_name || form.engineer_email}</div>
              </div>
              {form.type === 'completo' && (
                <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>CICLO</div>
                  <div style={{ fontWeight: 600 }}>{form.cycle}</div>
                </div>
              )}
            </div>

            {form.type === 'completo' && (
              <div>
                <h4 style={{ marginBottom: '12px' }}>Scores por Dimensão</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                {DIMENSIONS.map(dim => {
                  const score = form[`${dim.key}_score`];
                  if (score === null) return null;
                  const colors = ['var(--red)', 'var(--yellow)', 'var(--green)', 'var(--brand-primary)'];
                  const bgs = ['rgba(239,68,68,0.1)', 'rgba(245,158,11,0.1)', 'rgba(34,197,94,0.1)', 'rgba(99,102,241,0.1)'];
                  return (
                    <div key={dim.key} style={{
                      padding: '12px', borderRadius: 'var(--radius-md)',
                      background: bgs[score], border: `1px solid ${colors[score]}30`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><dim.icon size={16} /> {dim.label}</span>
                      <span style={{ fontWeight: 800, color: colors[score], fontSize: '1.125rem' }}>{score}</span>
                    </div>
                  );
                })}
              </div>
              </div>
            )}

            {form.general_text && (
              <div>
                <h4 style={{ marginBottom: '8px' }}>Observações Gerais</h4>
                <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {form.general_text}
                </div>
              </div>
            )}

            {form.impacts.filter(Boolean).length > 0 && (
              <div>
                <h4 style={{ marginBottom: '8px' }}>Próximos Passos</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {form.impacts.filter(Boolean).map((imp: string, i: number) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--brand-primary)', display: 'flex', marginTop: '2px' }}><ArrowRight size={14} /></span> {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {form.is_anonymous && (
              <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center' }}>
                <Lock size={18} /> Este feedback será enviado de forma anônima.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && <div className="alert alert-error" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}><AlertTriangle size={18} /> {error}</div>}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <button
          className="btn btn-secondary"
          onClick={goPrev}
          disabled={step === 1}
        >
          ← Anterior
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          {step === 4 ? (
            <>
              <button className="btn btn-secondary" onClick={() => save(true)} disabled={saving}>
                {saving ? <span className="spinner spinner-sm" /> : null}
                Salvar Rascunho
              </button>
              <button className="btn btn-primary" onClick={() => save(false)} disabled={saving}>
                {saving ? <span className="spinner spinner-sm" /> : <Rocket size={16} />}
                Publicar Feedback
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={goNext}
              disabled={!canGoNext()}
            >
              Próximo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
