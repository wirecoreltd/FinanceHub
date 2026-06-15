'use client'
import { useState } from 'react'
import { UserProfile, saveUserProfile } from '@/lib/storage'

interface Props { onComplete: (profile: UserProfile) => void }

const STEPS = [
  { id: 'name',      total: 5 },
  { id: 'situation', total: 5 },
  { id: 'income',    total: 5 },
  { id: 'goal',      total: 5 },
  { id: 'debts',     total: 5 },
]

type Step = typeof STEPS[number]['id']

const GOALS = [
  { id: 'survive',   emoji: '🆘', label: 'Survivre',   desc: 'Les fins de mois sont difficiles' },
  { id: 'stabilize', emoji: '⚖️', label: 'Stabiliser', desc: 'Je veux contrôler mes dépenses' },
  { id: 'build',     emoji: '🏗️', label: 'Construire',  desc: 'Je veux épargner et investir' },
  { id: 'prosper',   emoji: '🚀', label: 'Prospérer',   desc: 'Optimiser et faire fructifier' },
]

const SITUATIONS = [
  { id: 'single',        emoji: '👤', label: 'Célibataire' },
  { id: 'couple',        emoji: '👫', label: 'En couple' },
  { id: 'family',        emoji: '👨‍👩‍👧', label: 'Famille' },
  { id: 'single-parent', emoji: '👩‍👧', label: 'Parent solo' },
]

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('name')
  const [data, setData] = useState({
    firstName: '',
    situation: 'family' as UserProfile['situation'],
    children: 0,
    monthlyIncome: 0,
    incomeType: 'fixed' as UserProfile['incomeType'],
    mainGoal: 'stabilize' as UserProfile['mainGoal'],
    hasDebts: false,
  })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState('')

  const stepIndex = STEPS.findIndex(s => s.id === step)

  async function handleComplete() {
    setAiLoading(true)

    // Appel API Anthropic pour générer un message de bienvenue personnalisé
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `Tu es un coach financier bienveillant et direct. Tu parles en français.
Tu reçois le profil d'un nouvel utilisateur et tu dois lui écrire un message de bienvenue personnalisé
de 2-3 phrases maximum. Sois chaleureux, honnête, et donne-lui UN conseil concret immédiat basé sur sa situation.
Réponds UNIQUEMENT avec le message, sans guillemets ni formatage.`,
          messages: [{
            role: 'user',
            content: `Profil utilisateur :
- Prénom : ${data.firstName}
- Situation : ${data.situation}
- Enfants : ${data.children}
- Revenu mensuel : ${data.monthlyIncome} Rs
- Type de revenu : ${data.incomeType}
- Objectif principal : ${data.mainGoal}
- A des dettes : ${data.hasDebts ? 'oui' : 'non'}`
          }]
        })
      })
      const result = await response.json()
      setAiMessage(result.content?.[0]?.text || '')
    } catch {
      setAiMessage(`Bienvenue ${data.firstName} ! Ton profil est prêt. Commençons par enregistrer tes revenus et charges du mois.`)
    }

    setAiLoading(false)
  }

  function finish() {
    const profile: UserProfile = {
      completed: true,
      firstName: data.firstName || 'Ami',
      situation: data.situation,
      children: data.children,
      monthlyIncome: data.monthlyIncome,
      incomeType: data.incomeType,
      mainGoal: data.mainGoal,
      hasDebts: data.hasDebts,
      currency: 'MUR',
      language: 'fr',
      createdAt: new Date().toISOString(),
    }
    saveUserProfile(profile)
    onComplete(profile)
  }

  function next(nextStep: Step) {
    setStep(nextStep)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500
                ${i <= stepIndex ? 'bg-white' : 'bg-white/30'}`}/>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-7 shadow-2xl">

          {/* Step 1: Prénom */}
          {step === 'name' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-ink-soft uppercase tracking-widest mb-2">1 / 5</p>
                <h1 className="text-2xl font-bold text-ink">Bienvenue 👋</h1>
                <p className="text-ink-soft mt-2">Comment tu t'appelles ?</p>
              </div>
              <input
                className="input text-xl font-semibold"
                placeholder="Ton prénom"
                value={data.firstName}
                onChange={e => setData(d => ({ ...d, firstName: e.target.value }))}
                autoFocus
              />
              <button
                className="btn-primary w-full py-4 text-base"
                onClick={() => next('situation')}
                disabled={!data.firstName.trim()}
              >
                Continuer →
              </button>
            </div>
          )}

          {/* Step 2: Situation */}
          {step === 'situation' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-ink-soft uppercase tracking-widest mb-2">2 / 5</p>
                <h1 className="text-2xl font-bold text-ink">Ta situation</h1>
                <p className="text-ink-soft mt-2">Pour adapter les conseils à ta réalité.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {SITUATIONS.map(s => (
                  <button key={s.id}
                    onClick={() => setData(d => ({ ...d, situation: s.id as UserProfile['situation'] }))}
                    className={`p-4 rounded-2xl border-2 text-center transition-all active:scale-95
                      ${data.situation === s.id
                        ? 'border-accent bg-accent-light'
                        : 'border-mist-dark bg-mist'}`}>
                    <p className="text-3xl mb-1">{s.emoji}</p>
                    <p className="text-sm font-semibold text-ink">{s.label}</p>
                  </button>
                ))}
              </div>

              {(data.situation === 'family' || data.situation === 'single-parent') && (
                <div>
                  <label className="label">Nombre d'enfants</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n}
                        onClick={() => setData(d => ({ ...d, children: n }))}
                        className={`flex-1 py-3 rounded-2xl border-2 font-bold transition-all
                          ${data.children === n ? 'border-accent bg-accent-light text-accent' : 'border-mist-dark text-ink-soft'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn-primary w-full py-4 text-base" onClick={() => next('income')}>
                Continuer →
              </button>
            </div>
          )}

          {/* Step 3: Revenus */}
          {step === 'income' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-ink-soft uppercase tracking-widest mb-2">3 / 5</p>
                <h1 className="text-2xl font-bold text-ink">Tes revenus</h1>
                <p className="text-ink-soft mt-2">Une estimation suffit. Tu pourras ajuster.</p>
              </div>
              <div>
                <label className="label">Revenu mensuel net (Rs)</label>
                <input
                  className="input text-2xl font-bold"
                  type="number"
                  placeholder="0"
                  value={data.monthlyIncome || ''}
                  onChange={e => setData(d => ({ ...d, monthlyIncome: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="label">Type de revenu</label>
                <div className="flex rounded-2xl overflow-hidden border-2 border-mist-dark">
                  {[
                    { id: 'fixed',    label: '📅 Fixe' },
                    { id: 'variable', label: '📈 Variable' },
                    { id: 'mixed',    label: '🔀 Mixte' },
                  ].map(t => (
                    <button key={t.id}
                      className={`flex-1 py-3 text-sm font-bold transition-colors
                        ${data.incomeType === t.id ? 'bg-accent text-white' : 'bg-white text-ink-soft'}`}
                      onClick={() => setData(d => ({ ...d, incomeType: t.id as UserProfile['incomeType'] }))}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="btn-primary w-full py-4 text-base"
                onClick={() => next('goal')}
                disabled={!data.monthlyIncome}>
                Continuer →
              </button>
            </div>
          )}

          {/* Step 4: Objectif */}
          {step === 'goal' && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-ink-soft uppercase tracking-widest mb-2">4 / 5</p>
                <h1 className="text-2xl font-bold text-ink">Ton objectif</h1>
                <p className="text-ink-soft mt-2">Sois honnête — ça change tout aux conseils.</p>
              </div>
              <div className="space-y-3">
                {GOALS.map(g => (
                  <button key={g.id}
                    onClick={() => setData(d => ({ ...d, mainGoal: g.id as UserProfile['mainGoal'] }))}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left
                                transition-all active:scale-[0.98]
                      ${data.mainGoal === g.id
                        ? 'border-accent bg-accent-light'
                        : 'border-mist-dark bg-mist'}`}>
                    <span className="text-2xl">{g.emoji}</span>
                    <div>
                      <p className="font-bold text-ink">{g.label}</p>
                      <p className="text-xs text-ink-soft">{g.desc}</p>
                    </div>
                    {data.mainGoal === g.id && (
                      <div className="ml-auto w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button className="btn-primary w-full py-4 text-base" onClick={() => next('debts')}>
                Continuer →
              </button>
            </div>
          )}

          {/* Step 5: Dettes */}
          {step === 'debts' && !aiLoading && !aiMessage && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-ink-soft uppercase tracking-widest mb-2">5 / 5</p>
                <h1 className="text-2xl font-bold text-ink">Les dettes</h1>
                <p className="text-ink-soft mt-2">Est-ce que tu as des crédits ou dettes en cours ?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setData(d => ({ ...d, hasDebts: false }))}
                  className={`p-5 rounded-2xl border-2 text-center transition-all
                    ${!data.hasDebts ? 'border-positive bg-positive-light' : 'border-mist-dark bg-mist'}`}>
                  <p className="text-3xl mb-2">✅</p>
                  <p className="font-bold text-sm text-ink">Non, zéro dette</p>
                </button>
                <button
                  onClick={() => setData(d => ({ ...d, hasDebts: true }))}
                  className={`p-5 rounded-2xl border-2 text-center transition-all
                    ${data.hasDebts ? 'border-danger bg-danger-light' : 'border-mist-dark bg-mist'}`}>
                  <p className="text-3xl mb-2">💳</p>
                  <p className="font-bold text-sm text-ink">Oui, j'en ai</p>
                </button>
              </div>
              <button
                className="btn-primary w-full py-4 text-base"
                onClick={handleComplete}>
                Créer mon profil →
              </button>
            </div>
          )}

          {/* Loading IA */}
          {aiLoading && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-accent-light flex items-center justify-center">
                <span className="text-3xl animate-pulse">🤖</span>
              </div>
              <p className="font-bold text-ink">Analyse de ton profil...</p>
              <p className="text-sm text-ink-soft">Le Coach IA prépare tes premiers conseils</p>
              <div className="flex justify-center gap-1.5 mt-4">
                {[0, 1, 2].map(i => (
                  <div key={i}
                    className="w-2 h-2 rounded-full bg-accent animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}/>
                ))}
              </div>
            </div>
          )}

          {/* Message IA de bienvenue */}
          {aiMessage && !aiLoading && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-accent flex items-center justify-center mb-4">
                  <span className="text-3xl">🤖</span>
                </div>
                <h2 className="text-xl font-bold text-ink mb-1">
                  Bonjour {data.firstName} !
                </h2>
              </div>
              <div className="bg-accent-light border border-blue-200 rounded-2xl p-4">
                <p className="text-sm text-accent font-medium leading-relaxed">
                  {aiMessage}
                </p>
              </div>
              <button className="btn-primary w-full py-4 text-base" onClick={finish}>
                Commencer 🚀
              </button>
            </div>
          )}
        </div>

        {/* Skip */}
        {step === 'name' && (
          <button
            onClick={finish}
            className="w-full mt-4 text-white/60 text-sm py-2 hover:text-white transition-colors">
            Passer l'introduction
          </button>
        )}
      </div>
    </div>
  )
}
