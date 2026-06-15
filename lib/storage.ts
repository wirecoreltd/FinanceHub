// ─── User Profile (Onboarding) ────────────────────────────────────────────────

export interface UserProfile {
  completed: boolean
  firstName: string
  situation: 'single' | 'couple' | 'family' | 'single-parent'
  children: number
  monthlyIncome: number
  incomeType: 'fixed' | 'variable' | 'mixed'
  mainGoal: 'survive' | 'stabilize' | 'build' | 'prosper'
  hasDebts: boolean
  currency: string
  language: string
  createdAt: string
}

export function getUserProfile(): UserProfile | null {
  return load<UserProfile | null>('mb_profile', null)
}

export function saveUserProfile(profile: UserProfile): void {
  save('mb_profile', profile)
}

export function clearUserProfile(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('mb_profile')
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  note: string
  date: string
  createdAt: string
}

export interface BudgetCategory {
  id: string
  name: string
  limit: number
  color: string
}

export interface SavingsGoal {
  id: string
  name: string
  target: number
  saved: number
  emoji: string
  createdAt: string
}

export interface Debt {
  id: string
  type: 'owe' | 'owed'
  person: string
  amount: number
  remaining: number
  minimumPayment: number
  interestRate?: number
  note: string
  dueDate?: string
  createdAt: string
}

export interface RecurringCharge {
  id: string
  name: string
  amount: number
  type: 'fixed' | 'variable'
  category: 'logement' | 'transport' | 'assurance' | 'école' | 'alimentation' | 'factures' | 'autre'
  frequency: 'monthly' | 'yearly' | 'once'
  note?: string
}

export interface MonthlyIncome {
  id: string
  label: string
  amount: number
  isFixed: boolean
  month: string
}

export interface RecurringPayment {
  id: string
  name: string
  defaultAmount: number
  category: 'logement' | 'transport' | 'assurance' | 'école' | 'alimentation' | 'factures' | 'dette' | 'autre'
  frequency: 'monthly' | 'yearly'
  note?: string
  payments: {
    month: string
    paid: boolean
    amount: number
  }[]
}

export interface Project {
  id: string
  name: string
  emoji: string
  type: 'savings' | 'investment' | 'purchase'| 'upcoming'
  targetAmount: number
  savedAmount: number
  targetDate: string
  monthlyContribution: number
  note?: string
  createdAt: string
}

// ─── Categories ──────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  'Logement', 'Alimentation', 'Transport', 'Santé', 'Loisirs',
  'Vêtements', 'Éducation', 'Factures', 'Restaurants', 'Épargne', 'Autre'
]

export const INCOME_CATEGORIES = [
  'Salaire', 'Freelance', 'Investissements', 'Cadeau', 'Remboursement', 'Autre'
]

export const RECURRING_CATEGORIES = [
  'logement', 'transport', 'assurance', 'école',
  'alimentation', 'factures', 'dette', 'autre'
] as const

export const RECURRING_CATEGORY_EMOJI: Record<string, string> = {
  logement: '🏠', transport: '🚗', assurance: '🛡️',
  école: '🎓', alimentation: '🛒', factures: '⚡',
  dette: '💳', autre: '📦'
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function getTransactions(): Transaction[] { return load('mb_transactions', []) }
export function saveTransactions(txs: Transaction[]): void { save('mb_transactions', txs) }
export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const newTx: Transaction = { ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  saveTransactions([newTx, ...getTransactions()])
  return newTx
}
export function deleteTransaction(id: string): void {
  saveTransactions(getTransactions().filter(t => t.id !== id))
}

// ─── Budget ───────────────────────────────────────────────────────────────────

const DEFAULT_BUDGETS: BudgetCategory[] = [
  { id: '1', name: 'Alimentation', limit: 15000, color: '#F59E0B' },
  { id: '2', name: 'Transport',    limit: 5000,  color: '#3B82F6' },
  { id: '3', name: 'Loisirs',      limit: 8000,  color: '#8B5CF6' },
  { id: '4', name: 'Factures',     limit: 10000, color: '#EF4444' },
]
export function getBudgets(): BudgetCategory[] { return load('mb_budgets', DEFAULT_BUDGETS) }
export function saveBudgets(b: BudgetCategory[]): void { save('mb_budgets', b) }

// ─── Savings ─────────────────────────────────────────────────────────────────

export function getSavings(): SavingsGoal[] { return load('mb_savings', []) }
export function saveSavings(g: SavingsGoal[]): void { save('mb_savings', g) }

// ─── Debts ────────────────────────────────────────────────────────────────────

export function getDebts(): Debt[] { return load('mb_debts', []) }
export function saveDebts(d: Debt[]): void { save('mb_debts', d) }

// ─── Recurring Charges ────────────────────────────────────────────────────────

export function getRecurringCharges(): RecurringCharge[] { return load('mb_recurring', []) }
export function saveRecurringCharges(c: RecurringCharge[]): void { save('mb_recurring', c) }

// ─── Monthly Income ───────────────────────────────────────────────────────────

export function getMonthlyIncomes(): MonthlyIncome[] { return load('mb_incomes', []) }
export function saveMonthlyIncomes(i: MonthlyIncome[]): void { save('mb_incomes', i) }

// ─── Recurring Payments ───────────────────────────────────────────────────────

export function getRecurringPayments(): RecurringPayment[] { return load('mb_rec_payments', []) }
export function saveRecurringPayments(p: RecurringPayment[]): void { save('mb_rec_payments', p) }

export function toggleRecurringPayment(id: string, month: string, amount?: number): void {
  const payments = getRecurringPayments()
  const updated = payments.map(p => {
    if (p.id !== id) return p
    const existing = p.payments.find(x => x.month === month)
    if (existing) {
      return {
        ...p,
        payments: p.payments.map(x =>
          x.month === month
            ? { ...x, paid: amount !== undefined ? true : !x.paid, amount: amount ?? x.amount }
            : x
        )
      }
    }
    return {
      ...p,
      payments: [...p.payments, { month, paid: true, amount: amount ?? p.defaultAmount }]
    }
  })
  saveRecurringPayments(updated)
}

export function getPaymentForMonth(p: RecurringPayment, month: string) {
  return p.payments.find(x => x.month === month) ?? { month, paid: false, amount: p.defaultAmount }
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function getProjects(): Project[] { return load('mb_projects', []) }
export function saveProjects(p: Project[]): void { save('mb_projects', p) }

export function monthsUntil(targetDate: string): number {
  const now = new Date()
  const target = new Date(targetDate)
  return Math.max(0,
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  )
}

export function projectMonthlyNeeded(p: Project): number {
  const months = monthsUntil(p.targetDate)
  if (months <= 0) return 0
  return Math.ceil((p.targetAmount - p.savedAmount) / months)
}

// ─── Health Score ─────────────────────────────────────────────────────────────

export function computeHealthScore(transactions: Transaction[]): {
  score: number
  label: string
  color: string
  details: string[]
} {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthTxs = transactions.filter(t => t.date.startsWith(ym))
  const income   = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const debts    = getDebts().filter(d => d.type === 'owe')
  const savings  = getSavings()

  let score = 50
  const details: string[] = []

  if (income > 0) {
    const ratio = expenses / income
    if (ratio < 0.5)  { score += 20; details.push('✅ Dépenses < 50% des revenus') }
    else if (ratio < 0.7) { score += 10; details.push('🟡 Dépenses raisonnables') }
    else if (ratio < 0.9) { score -= 5;  details.push('⚠️ Dépenses élevées') }
    else                   { score -= 20; details.push('🔴 Dépenses > revenus') }
  }

  if (debts.length === 0) { score += 15; details.push('✅ Aucune dette') }
  else if (debts.length <= 2) { score += 5; details.push('🟡 Peu de dettes') }
  else { score -= 10; details.push('⚠️ Plusieurs dettes') }

  if (savings.length > 0) {
    const totalSaved = savings.reduce((s, g) => s + g.saved, 0)
    if (totalSaved > income * 3) { score += 15; details.push('✅ Fonds d\'urgence solide') }
    else { score += 5; details.push('🟡 Épargne en cours') }
  } else {
    score -= 5; details.push('⚠️ Pas encore d\'épargne')
  }

  const projects = getProjects()
  if (projects.length > 0) { score += 5; details.push('✅ Projets définis') }

  score = Math.max(0, Math.min(100, score))

  let label = 'Critique'
  let color = '#DC2626'
  if (score >= 80) { label = 'Excellent'; color = '#16A34A' }
  else if (score >= 60) { label = 'Bien'; color = '#2563EB' }
  else if (score >= 40) { label = 'À améliorer'; color = '#D97706' }
  else if (score >= 20) { label = 'Fragile'; color = '#EF4444' }

  return { score, label, color, details }
}

// ─── Coach Plan ───────────────────────────────────────────────────────────────

export interface CoachPlan {
  totalIncome: number
  fixedCharges: number
  debtMinimums: number
  variableEstimate: number
  freeMoney: number
  snowballTarget: Debt | null
  snowballSuggestion: number
  savingsSuggestion: number
  leisureSuggestion: number
  alerts: string[]
  debtsByPriority: Debt[]
}

export function computeCoachPlan(month: string): CoachPlan {
  const debts   = getDebts().filter(d => d.type === 'owe')
  const charges = getRecurringCharges()
  const incomes = getMonthlyIncomes().filter(i => i.month === month)

  const totalIncome      = incomes.reduce((s, i) => s + i.amount, 0)
  const fixedCharges     = charges.reduce((s, c) => {
    if (c.frequency === 'monthly') return s + c.amount
    if (c.frequency === 'yearly')  return s + c.amount / 12
    return s
  }, 0)
  const debtMinimums     = debts.reduce((s, d) => s + d.minimumPayment, 0)
  const variableEstimate = totalIncome * 0.15
  const freeMoney        = Math.max(0, totalIncome - fixedCharges - debtMinimums - variableEstimate)
  const debtsByPriority  = [...debts].sort((a, b) => a.remaining - b.remaining)
  const snowballTarget   = debtsByPriority[0] || null
  const snowballSuggestion = Math.round(freeMoney * 0.5)
  const savingsSuggestion  = Math.round(freeMoney * 0.3)
  const leisureSuggestion  = Math.round(freeMoney * 0.2)

  const alerts: string[] = []
  debtsByPriority.forEach(d => {
    if (d.minimumPayment > 0) {
      const ml = Math.ceil(d.remaining / d.minimumPayment)
      if (ml <= 3) alerts.push(`💡 "${d.person}" soldée dans ${ml} mois — prépare le snowball !`)
    }
    if (d.dueDate && new Date(d.dueDate) < new Date())
      alerts.push(`⚠️ La dette "${d.person}" est en retard !`)
  })
  if (snowballTarget && snowballSuggestion > 0) {
    const gain = Math.ceil(snowballTarget.remaining / snowballTarget.minimumPayment) -
                 Math.ceil(snowballTarget.remaining / (snowballTarget.minimumPayment + snowballSuggestion))
    if (gain > 0)
      alerts.push(`🚀 +${formatAmount(snowballSuggestion)}/mois sur "${snowballTarget.person}" = ${gain} mois gagnés !`)
  }
  if (totalIncome === 0)
    alerts.push('📝 Ajoute tes revenus du mois pour que le Coach calcule ton plan.')

  return {
    totalIncome, fixedCharges, debtMinimums, variableEstimate,
    freeMoney, snowballTarget, snowballSuggestion, savingsSuggestion,
    leisureSuggestion, alerts, debtsByPriority,
  }
}

// ─── Yearly Projection ────────────────────────────────────────────────────────

export interface MonthProjection {
  month: string; label: string
  projectedBalance: number
  projectedIncome: number
  projectedExpenses: number
}

export function computeYearlyProjection(transactions: Transaction[]): MonthProjection[] {
  const now    = new Date()
  const year   = now.getFullYear()
  const charges = getRecurringCharges()

  const last3 = Array.from({ length: 3 }, (_, i) => {
    const d  = new Date(now.getFullYear(), now.getMonth() - i - 1, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const txs = transactions.filter(t => t.date.startsWith(ym))
    return {
      income:   txs.filter(t => t.type==='income').reduce((s,t)=>s+t.amount,0),
      expenses: txs.filter(t => t.type==='expense').reduce((s,t)=>s+t.amount,0),
    }
  })
  const avgIncome   = last3.reduce((s,m)=>s+m.income,0)   / 3 || 0
  const avgExpenses = last3.reduce((s,m)=>s+m.expenses,0) / 3 || 0
  const fixedMonthly = charges.filter(c=>c.frequency==='monthly').reduce((s,c)=>s+c.amount,0)

  let runningBalance = 0
  return Array.from({ length: 12 }, (_, m) => {
    const d   = new Date(year, m, 1)
    const ym  = `${year}-${String(m+1).padStart(2,'0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'short' })
    const isPast = m < now.getMonth()
    const txs = transactions.filter(t => t.date.startsWith(ym))
    const realIncome   = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
    const realExpenses = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
    const savedIncome  = getMonthlyIncomes().filter(i=>i.month===ym).reduce((s,i)=>s+i.amount,0)
    const projIncome   = isPast ? realIncome   : (savedIncome || avgIncome)
    const projExpenses = isPast ? realExpenses : Math.max(avgExpenses, fixedMonthly)
    runningBalance += projIncome - projExpenses
    return { month: ym, label, projectedBalance: runningBalance, projectedIncome: projIncome, projectedExpenses: projExpenses }
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatAmount(amount: number, currency = 'MUR'): string {
  return new Intl.NumberFormat('fr-MU', {
    style: 'currency', currency, maximumFractionDigits: 0
  }).format(amount)
}

export function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
}

export function getMonthLabel(ym: string): string {
  const [year, month] = ym.split('-')
  return new Date(Number(year), Number(month)-1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
