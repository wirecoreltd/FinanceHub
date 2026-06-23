'use client'
import { useEffect, useState, useRef } from 'react'
import type { UserProfile, MonthlyIncome } from '@/lib/storage'
import { RefreshCw, ChevronRight, AlertTriangle, TrendingUp, Shield, Zap } from 'lucide-react'
import {
  getUserProfile,
  getDebts,
  getSavings,
  getTransactions,
  getRecurringPayments,
  getMonthlyIncomes,
  getProjects,
  computeCoachPlan,
  currentYearMonth,
  formatAmount,
  formatDebtEndDate,
} from '@/lib/storage'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetRecommendation {
  category: string
  emoji: string
  recommended: number
  current: number
}

interface CoachAnalysis {
  greeting: string
  situation: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  score: number
  scoreEvolution: number
  contradictions: string[]
  actions: {
    label: string
    title: string
    detail: string
    impact: string
    priority: 'urgent' | 'important' | 'strategy'
  }[]
  budgetRecommendation?: BudgetRecommendation[]
  insight: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urgencyConfig(u: CoachAnalysis['urgency']) {
  return {
    low:      { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Situation saine' },
    medium:   { color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'À surveiller'   },
    high:     { color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',  label: 'Action requise' },
    critical: { color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Urgent'         },
  }[u]
}

function priorityConfig(p: 'urgent' | 'important' | 'strategy') {
  return {
    urgent:    { icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-500',    label: 'URGENT'    },
    important: { icon: Zap,           color: 'text-amber-500',  bg: 'bg-amber-500',  label: 'IMPORTANT' },
    strategy:  { icon: TrendingUp,    color: 'text-violet-500', bg: 'bg-violet-500', label: 'STRATÉGIE' },
  }[p]
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, evolution }: { score: number; evolution: number }) {
  const color = score >= 70 ? '#16A34A' : score >= 45 ? '#D97706' : '#DC2626'
  const r = 44
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F1F5F9" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>{score}</span>
          <span className="text-[10px] text-gray-400 font-semibold">/100</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Score financier</p>
        <p className="text-lg font-black text-gray-800">
          {score >= 70 ? 'Bonne santé' : score >= 45 ? 'À améliorer' : 'Situation critique'}
        </p>
        {evolution !== 0 && (
          <p className={`text-sm font-bold mt-1 ${evolution > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {evolution > 0 ? '↑' : '↓'} {Math.abs(evolution)} pts depuis le début
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Action card ──────────────────────────────────────────────────────────────

function ActionCard({ action, index }: { action: CoachAnalysis['actions'][0]; index: number }) {
  const [open, setOpen] = useState(index === 0)
  const cfg = priorityConfig(action.priority)
  const Icon = cfg.icon

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${open ? 'border-gray-200 shadow-md' : 'border-gray-100'}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left bg-white">
        <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-black tracking-widest ${cfg.color}`}>{cfg.label}</span>
            <span className="text-[10px] text-gray-400 font-semibold">{action.label}</span>
          </div>
          <p className="text-sm font-bold text-gray-800 truncate">{action.title}</p>
        </div>
        <ChevronRight size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 bg-white border-t border-gray-50">
          <p className="text-sm text-gray-600 leading-relaxed mt-3">{action.detail}</p>
          {action.impact && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100">
              <TrendingUp size={12} className="text-violet-600" />
              <span className="text-xs font-bold text-violet-700">{action.impact}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Budget recommendation card ───────────────────────────────────────────────

function BudgetCard({ item, currency }: { item: BudgetRecommendation; currency: string }) {
  const isOver = item.current > item.recommended && item.current > 0
  const hasData = item.current > 0
  const pct = item.recommended > 0
    ? Math.min(100, Math.round((item.current / item.recommended) * 100))
    : 0

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-xl w-8 text-center flex-shrink-0">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">{item.category}</p>
        <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              !hasData ? 'bg-gray-300' : isOver ? 'bg-red-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${hasData ? pct : 0}%` }}
          />
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className={`text-xs font-black ${
          !hasData ? 'text-gray-400' : isOver ? 'text-red-500' : 'text-emerald-600'
        }`}>
          {formatAmount(item.recommended, currency)}
        </p>
        {hasData && (
          <p className={`text-[10px] font-semibold mt-0.5 ${isOver ? 'text-red-400' : 'text-gray-400'}`}>
            actuel: {formatAmount(item.current, currency)}
          </p>
        )}
        {!hasData && (
          <p className="text-[10px] text-gray-300 mt-0.5">pas de données</p>
        )}
      </div>
    </div>
  )
}

// ─── Loading state ────────────────────────────────────────────────────────────

function CoachThinking({ name }: { name: string }) {
  const [phase, setPhase] = useState(0)
  const phases = [
    `J'analyse ton profil, ${name}...`,
    'Je regarde tes dettes et ton épargne...',
    "J'analyse les 3 derniers mois...",
    "Je construis ton budget recommandé...",
  ]

  useEffect(() => {
    const t = setInterval(() => setPhase(p => Math.min(p + 1, phases.length - 1)), 1400)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full bg-violet-100 animate-ping opacity-30" />
        <div className="relative w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
          <span className="text-3xl">🧠</span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="font-bold text-gray-800 text-lg">Analyse en cours</p>
        <p className="text-sm text-gray-400 transition-all">{phases[phase]}</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CoachPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    async function init() {
      const p = await getUserProfile()
      setProfile(p)
      if (p && !hasFetched.current) {
        hasFetched.current = true
        fetchAnalysis(p)
      } else {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function fetchAnalysis(p: UserProfile) {
    setLoading(true)

    try {
      const month = currentYearMonth()

      // 1. Charger toutes les données réelles
      const [debts, savings, transactions, recurring, incomes, projects] = await Promise.all([
        getDebts(),
        getSavings(),
        getTransactions(),
        getRecurringPayments(),
        getMonthlyIncomes(month),
        getProjects(),
      ])

      // 2. Plan pré-calculé
      const effectiveIncomes: MonthlyIncome[] =
        incomes.length > 0
          ? incomes
          : [{ id: 'profile', label: 'Revenu déclaré', amount: p.monthlyIncome, isFixed: true, month }]

      const plan = computeCoachPlan(debts, recurring, effectiveIncomes, month)

      // 3. Dépenses des 30 derniers jours par catégorie
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentExpenses = transactions.filter(
        t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo
      )
      const expensesByCategory: Record<string, number> = {}
      for (const t of recentExpenses) {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount
      }
      const totalRecentExpenses = recentExpenses.reduce((s, t) => s + t.amount, 0)

      // 4. Historique des 3 derniers mois (par mois calendaire)
      const last3MonthsAnalysis = Array.from({ length: 3 }, (_, i) => {
        const d = new Date()
        d.setDate(1)
        d.setMonth(d.getMonth() - i - 1)
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        const txs = transactions.filter(t => t.date.startsWith(ym))
        const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        const bycat: Record<string, number> = {}
        txs.filter(t => t.type === 'expense').forEach(t => {
          bycat[t.category] = (bycat[t.category] || 0) + t.amount
        })
        const catLines = Object.entries(bycat)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, amt]) => `    • ${cat}: ${formatAmount(amt, p.currency)}`)
          .join('\n')
        return [
          `${label}:`,
          `  Revenus: ${formatAmount(inc, p.currency)} | Dépenses: ${formatAmount(exp, p.currency)} | Solde: ${formatAmount(inc - exp, p.currency)}`,
          catLines ? `  Détail dépenses:\n${catLines}` : '  Aucune dépense enregistrée',
        ].join('\n')
      })
      const historyBlock = last3MonthsAnalysis.join('\n\n')

      // 5. Bloc dettes — axé sur la MENSUALITÉ, pas le capital total
      const owedDebts = debts.filter(d => d.type === 'owe')
      const debtsBlock = owedDebts.length === 0
        ? "Aucune dette en cours."
        : owedDebts.map(d => {
            const monthsLeft = d.minimumPayment > 0 ? Math.ceil(d.remaining / d.minimumPayment) : null
            const endLabel = formatDebtEndDate(d)
            const debtRatioOfIncome = plan.totalIncome > 0
              ? Math.round((d.minimumPayment / plan.totalIncome) * 100)
              : 0
            return [
              `- "${d.person}" (catégorie: ${d.category})`,
              `  ⚠️ MENSUALITÉ = ce qui sort chaque mois: ${formatAmount(d.minimumPayment, p.currency)} (${debtRatioOfIncome}% du revenu mensuel)`,
              `  Capital restant à rembourser: ${formatAmount(d.remaining, p.currency)} — info contextuelle uniquement, NE PAS comparer au revenu`,
              `  Capital initial: ${formatAmount(d.amount, p.currency)} — info contextuelle uniquement`,
              d.interestRate ? `  Taux d'intérêt: ${d.interestRate}%` : null,
              monthsLeft !== null
                ? `  Durée restante au rythme actuel: ${monthsLeft} mois${endLabel ? ` (${endLabel})` : ''}`
                : null,
              d.dueDate ? `  Échéance: ${d.dueDate}` : null,
              d.recurring ? `  Type: récurrente (se renouvelle chaque mois)` : null,
            ].filter(Boolean).join('\n')
          }).join('\n\n')

      // 6. Bloc épargnes
      const savingsBlock = savings.length === 0
        ? "Aucune épargne en cours."
        : savings.map(s => {
            const pct = s.target > 0 ? Math.round((s.saved / s.target) * 100) : 0
            return `- "${s.name}" (${s.category}): ${formatAmount(s.saved, p.currency)} / ${formatAmount(s.target, p.currency)} (${pct}%)`
          }).join('\n')

      // 7. Bloc charges récurrentes
      const recurringBlock = recurring.length === 0
        ? "Aucune charge récurrente enregistrée."
        : recurring.map(r =>
            `- ${r.name} (${r.category}): ${formatAmount(r.defaultAmount, p.currency)}/${r.frequency === 'monthly' ? 'mois' : 'an'}`
          ).join('\n')

      // 8. Bloc projets
      const projectsBlock = projects.length === 0
        ? "Aucun projet en cours."
        : projects.map(pr =>
            `- ${pr.emoji} "${pr.name}" (${pr.type}): ${formatAmount(pr.savedAmount, p.currency)} / ${formatAmount(pr.targetAmount, p.currency)}, contribution mensuelle: ${formatAmount(pr.monthlyContribution, p.currency)}`
          ).join('\n')

      // 9. Bloc dépenses récentes
      const expensesBlock = Object.keys(expensesByCategory).length === 0
        ? "Pas de dépenses enregistrées sur les 30 derniers jours."
        : Object.entries(expensesByCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => `- ${cat}: ${formatAmount(amt, p.currency)}`)
            .join('\n')

      // 10. Bloc plan pré-calculé
      const planBlock = [
        `Revenu mensuel total: ${formatAmount(plan.totalIncome, p.currency)}`,
        `Charges fixes (loyer, factures, etc.): ${formatAmount(plan.fixedCharges, p.currency)}`,
        `Total mensualités dettes (somme des MENSUALITÉS, pas des capitaux): ${formatAmount(plan.debtMinimums, p.currency)}`,
        `Estimation dépenses variables: ${formatAmount(plan.variableEstimate, p.currency)}`,
        `💰 Argent libre disponible/mois (après tout): ${formatAmount(plan.freeMoney, p.currency)}`,
        plan.snowballTarget
          ? `Cible snowball recommandée: "${plan.snowballTarget.person}" (capital restant ${formatAmount(plan.snowballTarget.remaining, p.currency)}, mensualité actuelle ${formatAmount(plan.snowballTarget.minimumPayment, p.currency)}) — suggestion d'y ajouter ${formatAmount(plan.snowballSuggestion, p.currency)}/mois`
          : `Aucune cible snowball identifiée.`,
        `Suggestion épargne/mois: ${formatAmount(plan.savingsSuggestion, p.currency)}`,
        `Suggestion loisirs/mois: ${formatAmount(plan.leisureSuggestion, p.currency)}`,
        plan.alerts.length > 0
          ? `Alertes système:\n${plan.alerts.map(a => `  ${a}`).join('\n')}`
          : null,
      ].filter(Boolean).join('\n')

      // 11. Contexte complet pour le LLM
      const context = `
PROFIL UTILISATEUR :
Prénom : ${p.firstName}
Revenu mensuel déclaré dans le profil : ${formatAmount(p.monthlyIncome, p.currency)}
Situation familiale : ${p.situation}${p.children > 0 ? ` avec ${p.children} enfant(s)` : ''}
Type de revenu : ${p.incomeType}
Objectif principal : ${p.mainGoal}
Devise : ${p.currency}

═══ PLAN FINANCIER PRÉ-CALCULÉ (chiffres fiables — ne pas recalculer) ═══
${planBlock}

═══ DETTES DÉTAILLÉES ═══
IMPORTANT : Analyse uniquement les MENSUALITÉS pour évaluer la charge. Le capital total n'est pas une charge mensuelle.
${debtsBlock}

═══ ÉPARGNES EN COURS ═══
${savingsBlock}

═══ CHARGES FIXES RÉCURRENTES ═══
${recurringBlock}

═══ PROJETS ═══
${projectsBlock}

═══ HISTORIQUE 3 DERNIERS MOIS (analyse les tendances ici) ═══
${historyBlock}

═══ DÉPENSES DES 30 DERNIERS JOURS PAR CATÉGORIE (total: ${formatAmount(totalRecentExpenses, p.currency)}) ═══
${expensesBlock}
`.trim()

      const res = await fetch('/api/coach-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const parsed: CoachAnalysis = await res.json()
      if ((parsed as any).error) throw new Error((parsed as any).error)

      setAnalysis(parsed)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Coach analysis failed:', err)
      setAnalysis({
        greeting: `${p.firstName}, voici ton analyse.`,
        situation: "Impossible de charger l'analyse complète. Vérifie ta connexion et réessaie.",
        urgency: 'medium',
        score: 50,
        scoreEvolution: 0,
        contradictions: [],
        actions: [{
          label: 'Cette semaine',
          title: 'Note toutes tes dépenses fixes',
          detail: 'Loyer, abonnements, crédits — liste tout ce qui sort automatiquement chaque mois.',
          impact: 'Visibilité totale sur tes finances',
          priority: 'urgent',
        }],
        budgetRecommendation: [],
        insight: "La connaissance de ses finances est le premier pas vers la liberté financière.",
      })
      setLastUpdated(new Date())
    }

    setLoading(false)
  }

  function refresh() {
    if (profile) {
      hasFetched.current = false
      fetchAnalysis(profile)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-sm">Profil non trouvé. Complète l'onboarding d'abord.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-32 md:pb-10 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Coach <span className="text-violet-600">IA</span></h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Analysé à {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 text-violet-600 text-xs font-bold border border-violet-100 active:scale-95 transition-all disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <CoachThinking name={profile.firstName} />
      ) : analysis ? (
        <>
          {/* ── Greeting ── */}
          <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl p-5 shadow-xl shadow-violet-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🧠</span>
              </div>
              <div>
                <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-1">Ton coach</p>
                <p className="text-white font-bold text-base leading-snug">{analysis.greeting}</p>
              </div>
            </div>
          </div>

          {/* ── Score + Urgency ── */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <ScoreRing score={analysis.score} evolution={analysis.scoreEvolution} />
            <div className={`rounded-2xl px-4 py-3 border ${urgencyConfig(analysis.urgency).bg} ${urgencyConfig(analysis.urgency).border}`}>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={13} className={urgencyConfig(analysis.urgency).color} />
                <span className={`text-xs font-black uppercase tracking-widest ${urgencyConfig(analysis.urgency).color}`}>
                  {urgencyConfig(analysis.urgency).label}
                </span>
              </div>
              <p className={`text-sm font-semibold leading-snug ${urgencyConfig(analysis.urgency).color}`}>
                {analysis.situation}
              </p>
            </div>
          </div>

          {/* ── Contradictions ── */}
          {analysis.contradictions?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-black text-amber-700 uppercase tracking-widest">⚡ Ce que je dois te dire</p>
              {analysis.contradictions.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">▸</span>
                  <p className="text-sm text-amber-800 font-medium">{c}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Plan d'action ── */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Plan d'action</p>
            <div className="space-y-3">
              {analysis.actions.map((action, i) => (
                <ActionCard key={i} action={action} index={i} />
              ))}
            </div>
          </div>

          {/* ── Budget recommandé ── */}
          {analysis.budgetRecommendation && analysis.budgetRecommendation.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Budget recommandé / mois</p>
                <span className="text-[10px] text-gray-400 font-semibold">cible → actuel</span>
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {analysis.budgetRecommendation.map((item, i) => (
                  <BudgetCard key={i} item={item} currency={profile.currency} />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Basé sur ton argent libre après charges et dettes
              </p>
            </div>
          )}

          {/* ── Insight ── */}
          <div className="bg-gray-900 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">💡 Ce que tu dois retenir</p>
            <p className="text-white text-sm leading-relaxed font-medium italic">"{analysis.insight}"</p>
          </div>
        </>
      ) : null}
    </div>
  )
}
