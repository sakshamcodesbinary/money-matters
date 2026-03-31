import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    endpoint?: string[];
  }>;
};

async function getSegments(ctx: RouteContext) {
  const { endpoint } = await ctx.params;
  return endpoint ?? [];
}

type StoredUser = {
  uid: string;
  email: string;
  name: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
};

type Frequency = 'monthly' | 'annual' | 'one-time';

type StoredIncome = {
  id: string;
  source: string;
  amount: number;
  frequency: Frequency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type StoredExpense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  frequency: Frequency;
  isEssential: boolean;
  createdAt: string;
  updatedAt: string;
};

type DebtType =
  | 'credit_card'
  | 'personal_loan'
  | 'car_loan'
  | 'home_loan'
  | 'education_loan'
  | 'other';

type StoredDebt = {
  id: string;
  name: string;
  type: DebtType;
  principal: number;
  interestRate: number;
  emi: number;
  remainingTenure: number;
  createdAt: string;
  updatedAt: string;
};

type InvestmentType =
  | 'mutual_fund'
  | 'stocks'
  | 'fixed_deposit'
  | 'ppf'
  | 'nps'
  | 'real_estate'
  | 'gold'
  | 'crypto'
  | 'other';

type StoredInvestment = {
  id: string;
  name: string;
  type: InvestmentType;
  currentValue: number;
  investedAmount: number;
  expectedReturn: number;
  createdAt: string;
  updatedAt: string;
};

type AssetType = 'property' | 'vehicle' | 'jewelry' | 'electronics' | 'other';

type StoredAsset = {
  id: string;
  name: string;
  type: AssetType;
  currentValue: number;
  purchaseValue: number;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
};

type GoalCategory =
  | 'emergency_fund'
  | 'retirement'
  | 'education'
  | 'home'
  | 'travel'
  | 'wedding'
  | 'other';

type GoalPriority = 'high' | 'medium' | 'low';

type StoredGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: GoalPriority;
  category: GoalCategory;
  createdAt: string;
  updatedAt: string;
};

type Db = {
  user: StoredUser;
  income: StoredIncome[];
  expenses: StoredExpense[];
  debts: StoredDebt[];
  investments: StoredInvestment[];
  assets: StoredAsset[];
  goals: StoredGoal[];
};

type HealthScore = {
  score: number;
  grade: string;
  breakdown: {
    savingsRate: number;
    debtToIncome: number;
    emergencyFund: number;
    investmentDiversity: number;
  };
  recommendations: string[];
};

type DebtStrategy = {
  strategy: string;
  prioritizedDebts: Array<{
    id: string;
    name: string;
    priority: number;
    reason: string;
    suggestedPayment: number;
  }>;
  totalInterestSaved: number;
  debtFreeDate: string;
};

type InvestmentRecommendation = {
  riskProfile: string;
  suggestedAllocation: Record<string, number>;
  recommendations: Array<{
    type: string;
    allocation: number;
    reason: string;
  }>;
};

type BudgetRecommendation = {
  currentBudget: Record<string, number>;
  suggestedBudget: Record<string, number>;
  savingsOpportunities: Array<{
    category: string;
    currentSpend: number;
    suggestedSpend: number;
    potentialSavings: number;
  }>;
};

type GoalAnalysis = {
  goals: Array<{
    id: string;
    name: string;
    progress: number;
    onTrack: boolean;
    monthlyRequired: number;
    estimatedCompletion: string;
  }>;
  overallProgress: number;
};

type FinancialRoadmap = {
  debtTrapStatus?: {
    inTrap: boolean;
    actionableAdvice: string;
    monthsSavedByPrepaying: number;
    emiIncomeRatioPct: number;
  };
  emergencyFundStatus?: {
    currentAmount: number;
    requiredAmount: number;
    allotmentPlan: string;
  };
  longTermProjections?: {
    blendedGrowthRatePct: number;
    corpus20Years: number;
    corpus30Years: number;
  };
  healthScore: HealthScore;
  debtStrategy: DebtStrategy;
  investmentRecommendation: InvestmentRecommendation;
  budgetRecommendation: BudgetRecommendation;
  goalAnalysis: GoalAnalysis;
  actionPlan: Array<{
    priority: number;
    action: string;
    impact: string;
    timeframe: string;
  }>;
  netWorthTrajectory: {
    current: number;
    in5YearsIfNoChange: number;
    in5YearsIfFollowed: number;
  };
  motivationalMessage: string;
};

const lastAiGenerationTimestamp = new Map<string, number>();
const AI_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown per user

// ── AI Insights Cache ──────────────────────────────────────────────────────
type AiCache = {
  roadmap: FinancialRoadmap;
  fingerprint: string;
  generatedAt: string;
};
const aiInsightsCache = new Map<string, AiCache>();

function computeDataFingerprint(db: Db): string {
  const snapshot = {
    incomeSig: db.income.map(i => `${i.source}:${i.amount}:${i.frequency}:${i.isActive}`).join('|'),
    expenseSig: db.expenses.map(e => `${e.category}:${e.amount}:${e.frequency}`).join('|'),
    debtSig: db.debts.map(d => `${d.name}:${d.principal}:${d.interestRate}:${d.emi}:${d.remainingTenure}`).join('|'),
    investSig: db.investments.map(i => `${i.name}:${i.currentValue}:${i.type}`).join('|'),
    assetSig: db.assets.map(a => `${a.name}:${a.currentValue}`).join('|'),
    goalSig: db.goals.map(g => `${g.name}:${g.targetAmount}:${g.currentAmount}:${g.targetDate}`).join('|'),
  };
  const str = JSON.stringify(snapshot);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * Firestore Helpers
 */
async function getDb(uid: string): Promise<Db> {
  const firestore = getFirebaseAdminFirestore();
  const userDoc = await firestore.collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    // Return default empty structure if no data yet
    let email = 'unknown@local';
    let name = 'User';
    let createdAt = nowIso();
    let updatedAt = nowIso();
    
    try {
      const u = await getFirebaseAdminAuth().getUser(uid);
      email = u.email || email;
      name = u.displayName || name;
      createdAt = u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : createdAt;
      updatedAt = u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : updatedAt;
    } catch { /* ignore */ }

    return {
      user: { uid, email, name, createdAt, updatedAt },
      income: [],
      expenses: [],
      debts: [],
      investments: [],
      assets: [],
      goals: []
    };
  }

  const data = userDoc.data() as any;
  return {
    user: data.user || { uid, email: 'unknown@local', name: 'User', createdAt: nowIso(), updatedAt: nowIso() },
    income: data.income || [],
    expenses: data.expenses || [],
    debts: data.debts || [],
    investments: data.investments || [],
    assets: data.assets || [],
    goals: data.goals || []
  };
}

async function updateDb(uid: string, db: Db): Promise<void> {
  const firestore = getFirebaseAdminFirestore();
  await firestore.collection('users').doc(uid).set(db, { merge: true });
}

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function getAuthToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const [scheme, token] = auth.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null;
  return token || null;
}

async function requireFirebaseUid(req: NextRequest) {
  const token = getAuthToken(req);
  if (!token) return null;

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function getOrCreateDbForRequest(req: NextRequest) {
  const uid = await requireFirebaseUid(req);
  if (!uid) return null;
  return getDb(uid);
}

function requireFirebaseAuthApiKey() {
  const key = process.env.FIREBASE_WEB_API_KEY;
  if (!key) {
    throw new Error('Missing FIREBASE_WEB_API_KEY env var (Firebase Web API key).');
  }
  return key;
}

async function firebaseAuthPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const key = requireFirebaseAuthApiKey();
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as any;

  if (!res.ok) {
    const message = typeof json?.error?.message === 'string' ? json.error.message : 'Firebase Auth error';
    throw new Error(message);
  }

  return json as T;
}

async function readJsonBody<T>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

function monthlyFromFrequency(amount: number, frequency: Frequency) {
  if (Number.isNaN(amount)) return 0;
  if (frequency === 'monthly') return amount;
  if (frequency === 'annual') return amount / 12;
  // one-time: treat as immediate monthly impact (stub)
  return amount;
}

function computeSummary(db: Db) {
  const totalIncome = db.income.reduce((sum, item) => {
    if (!item.isActive) return sum;
    return sum + monthlyFromFrequency(item.amount, item.frequency);
  }, 0);

  const totalExpenses = db.expenses.reduce((sum, item) => {
    return sum + monthlyFromFrequency(item.amount, item.frequency);
  }, 0);

  const totalDebts = db.debts.reduce((sum, d) => sum + (Number.isFinite(d.principal) ? d.principal : 0), 0);
  const totalInvestments = db.investments.reduce((sum, i) => sum + (Number.isFinite(i.currentValue) ? i.currentValue : 0), 0);
  const totalAssets = db.assets.reduce((sum, a) => sum + (Number.isFinite(a.currentValue) ? a.currentValue : 0), 0);

  const netWorth = totalAssets + totalInvestments - totalDebts;
  const monthlySurplus = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, (monthlySurplus / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpenses,
    totalDebts,
    totalInvestments,
    totalAssets,
    netWorth,
    monthlySurplus,
    savingsRate,
  };
}

function computeHealthScore(db: Db) {
  const summary = computeSummary(db);

  const debtToIncome = summary.totalIncome > 0 ? Math.min(100, (summary.totalDebts / summary.totalIncome) * 100) : 0;

  // Placeholder emergency fund metric: current emergency-fund goal progress %
  const emergencyGoal = db.goals.find((g) => g.category === 'emergency_fund');
  const emergencyFund = emergencyGoal ? (emergencyGoal.targetAmount > 0 ? (emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100 : 0) : 0;

  // Placeholder investment diversity: number of distinct investment types
  const investmentDiversity =
    db.investments.length === 0
      ? 0
      : Math.min(100, (new Set(db.investments.map((i) => i.type)).size / Math.max(1, db.investments.length)) * 100);

  const savingsRate = summary.savingsRate;

  // Very rough scoring heuristic for the stub
  const scoreRaw = 0.45 * savingsRate + 0.35 * (100 - debtToIncome) + 0.1 * emergencyFund + 0.1 * investmentDiversity;
  const score = Math.max(0, Math.min(100, Math.round(scoreRaw)));

  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F';

  const recommendations: string[] = [
    savingsRate >= 20 ? 'Maintain your current savings rate to stay on track.' : 'Increase your savings rate gradually (start with small, consistent changes).',
    summary.totalDebts > 0 ? 'Prioritize high-interest debt first for faster payoff.' : 'Consider allocating surplus toward investments or goals.',
    emergencyFund >= 20 ? 'Your emergency fund progress looks good.' : 'Build an emergency fund to reduce financial stress.',
  ];

  return {
    score,
    grade,
    breakdown: {
      savingsRate,
      debtToIncome,
      emergencyFund,
      investmentDiversity,
    },
    recommendations,
  };
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const segments = await getSegments(ctx);

  // Auth-free endpoints could be added here, if needed.
  if (segments[0] !== 'auth') {
    const db = await getOrCreateDbForRequest(req);
    if (!db) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  const db = await getOrCreateDbForRequest(req);

  // User
  if (segments[0] === 'user' && segments[1] === 'profile') {
    if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ user: db.user });
  }

  // Financial lists
  if (segments[0] === 'financial' && segments[1] === 'income') return NextResponse.json({ income: db?.income ?? [] });
  if (segments[0] === 'financial' && segments[1] === 'expenses') return NextResponse.json({ expenses: db?.expenses ?? [] });
  if (segments[0] === 'financial' && segments[1] === 'debts') return NextResponse.json({ debts: db?.debts ?? [] });
  if (segments[0] === 'financial' && segments[1] === 'investments') return NextResponse.json({ investments: db?.investments ?? [] });
  if (segments[0] === 'financial' && segments[1] === 'assets') return NextResponse.json({ assets: db?.assets ?? [] });
  if (segments[0] === 'financial' && segments[1] === 'goals') return NextResponse.json({ goals: db?.goals ?? [] });

  if (segments[0] === 'financial' && segments[1] === 'summary') {
    if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ summary: computeSummary(db) });
  }

  // Recommendations
  if (segments[0] === 'recommendations' && segments[1] === 'health-score') {
    if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ healthScore: computeHealthScore(db) });
  }

  if (segments[0] === 'recommendations' && segments[1] === 'debt-strategy') {
    if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({
      debtStrategy: {
        strategy: 'Stub strategy: pay highest-interest debts first.',
        prioritizedDebts: (db.debts.length ? db.debts : []).slice(0, 5).map((d, idx) => ({
          id: d.id,
          name: d.name,
          priority: idx + 1,
          reason: 'Stub reason',
          suggestedPayment: d.emi || 0,
        })),
        totalInterestSaved: 0,
        debtFreeDate: '2099-01-01',
      },
    });
  }

  if (segments[0] === 'recommendations' && segments[1] === 'investment') {
    if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({
      investmentRecommendation: {
        riskProfile: db.user.age && db.user.age >= 45 ? 'conservative' : 'balanced',
        suggestedAllocation: { stocks: 50, mutual_fund: 30, gold: 20 },
        recommendations: [
          { type: 'stocks', allocation: 50, reason: 'Stub allocation' },
          { type: 'mutual_fund', allocation: 30, reason: 'Stub allocation' },
          { type: 'gold', allocation: 20, reason: 'Stub allocation' },
        ],
      },
    });
  }

  if (segments[0] === 'recommendations' && segments[1] === 'budget') {
    if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const summary = computeSummary(db);
    const savingsOpportunities = [
      {
        category: 'subscriptions',
        currentSpend: Math.round(summary.totalExpenses * 0.05),
        suggestedSpend: Math.round(summary.totalExpenses * 0.03),
        potentialSavings: Math.round(summary.totalExpenses * 0.02),
      },
    ];
    return NextResponse.json({
      budgetRecommendation: {
        currentBudget: { income: summary.totalIncome, expenses: summary.totalExpenses },
        suggestedBudget: { income: summary.totalIncome, expenses: Math.max(0, summary.totalExpenses * 0.95) },
        savingsOpportunities,
      },
    });
  }

  if (segments[0] === 'recommendations' && segments[1] === 'goals') {
    if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const goalsAnalysis = db.goals.map((g) => {
      const progress = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
      return {
        id: g.id,
        name: g.name,
        progress,
        onTrack: progress >= 30,
        monthlyRequired: 0,
        estimatedCompletion: g.targetDate,
      };
    });
    return NextResponse.json({
      goalAnalysis: {
        goals: goalsAnalysis,
        overallProgress: goalsAnalysis.length ? goalsAnalysis.reduce((s, g) => s + g.progress, 0) / goalsAnalysis.length : 0,
      },
    });
  }

  if (segments[0] === 'recommendations' && segments[1] === 'roadmap') {
    if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const forceRegen = req.nextUrl.searchParams.get('force') === 'true';
    const fingerprint = computeDataFingerprint(db);
    const cached = aiInsightsCache.get(db.user.uid);

    // Serve cached response if data fingerprint hasn't changed and not forced
    if (!forceRegen && cached && cached.fingerprint === fingerprint) {
      return NextResponse.json({
        roadmap: cached.roadmap,
        fromCache: true,
        generatedAt: cached.generatedAt,
        fingerprint,
      });
    }

    // Rate limiting (only for actual AI calls)
    const now = Date.now();
    const lastGen = lastAiGenerationTimestamp.get(db.user.uid) || 0;
    if (now - lastGen < AI_COOLDOWN_MS) {
      const waitSec = Math.ceil((AI_COOLDOWN_MS - (now - lastGen)) / 1000);
      if (cached) {
        return NextResponse.json({
          roadmap: cached.roadmap,
          fromCache: true,
          generatedAt: cached.generatedAt,
          fingerprint,
          rateLimited: true,
          retryAfter: waitSec,
        });
      }
      return NextResponse.json({
        message: `Please wait ${waitSec} seconds before generating new insights.`,
        retryAfter: waitSec
      }, { status: 429 });
    }

    const provider = process.env.AI_PROVIDER || 'gemini';
    const usingOpenAI = provider.toLowerCase() === 'openai';

    const apiKey = usingOpenAI ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error(`Missing ${usingOpenAI ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY'}`);
      return NextResponse.json({ message: 'AI configuration missing' }, { status: 500 });
    }

    try {

      lastAiGenerationTimestamp.set(db.user.uid, now);

      const summary = computeSummary(db);
      const userAge = db.user.age ?? 30;
      const nowDate = new Date();

      // Pre-compute derived analytics for the prompt
      const monthlyEmiTotal = db.debts.reduce((s, d) => s + d.emi, 0);
      const debtsSortedByRate = [...db.debts].sort((a, b) => b.interestRate - a.interestRate);
      const totalDebtPrincipal = db.debts.reduce((s, d) => s + d.principal, 0);
      const totalInterestBurden = db.debts.reduce((s, d) => {
        const mr = d.interestRate / 100 / 12;
        if (mr === 0 || d.remainingTenure === 0) return s;
        return s + Math.max(0, d.emi * d.remainingTenure - d.principal);
      }, 0);
      const goalsSerialized = db.goals.map(g => {
        const monthsLeft = Math.max(0, (new Date(g.targetDate).getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24 * 30.5));
        const remaining = g.targetAmount - g.currentAmount;
        const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : Infinity;
        return {
          name: g.name, category: g.category, priority: g.priority,
          targetAmount: g.targetAmount, currentAmount: g.currentAmount,
          targetDate: g.targetDate, monthsLeft: Math.round(monthsLeft),
          monthlyNeeded: isFinite(monthlyNeeded) ? Math.round(monthlyNeeded) : 99999,
          progressPct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
          achievable: isFinite(monthlyNeeded) && summary.monthlySurplus >= monthlyNeeded && monthlyNeeded > 0,
        };
      });
      const expensesByCategory = db.expenses.reduce((acc, e) => {
        const mo = e.frequency === 'annual' ? e.amount / 12 : e.amount;
        acc[e.category] = (acc[e.category] || 0) + mo;
        return acc;
      }, {} as Record<string, number>);
      const top3Expenses = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, a]) => `${c}: ₹${Math.round(a)}/mo`);
      const totalInvested = db.investments.reduce((s, i) => s + i.investedAmount, 0);
      const totalCurrentValue = db.investments.reduce((s, i) => s + i.currentValue, 0);
      const portfolioReturn = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;
      const yearsToRetirement = Math.max(0, 60 - userAge);
      const retirementCorpusNeeded = summary.totalExpenses * 12 * 25;
      const investableSurplus = Math.max(0, summary.monthlySurplus - monthlyEmiTotal);

      const masterPrompt = `You are an elite institutional financial advisor for Indian users. Analyze the complete data below and return ONLY valid JSON with no markdown.

══ USER PROFILE ══
Name: ${db.user.name} | Age: ${userAge}y | Years to retirement (age 60): ${yearsToRetirement}y

══ MONTHLY CASH FLOW ══
Total Income: ₹${Math.round(summary.totalIncome)}/mo
Total Expenses: ₹${Math.round(summary.totalExpenses)}/mo
Monthly Surplus: ₹${Math.round(summary.monthlySurplus)}/mo
Savings Rate: ${summary.savingsRate.toFixed(1)}%
Total EMI Burden: ₹${Math.round(monthlyEmiTotal)}/mo
Investable Surplus (after EMI): ₹${Math.round(investableSurplus)}/mo
50/30/20 Targets: Needs≤₹${Math.round(summary.totalIncome*0.5)} | Wants≤₹${Math.round(summary.totalIncome*0.3)} | Savings≥₹${Math.round(summary.totalIncome*0.2)}

══ INCOME STREAMS ══
${db.income.filter(i => i.isActive).map(i => `${i.source}: ₹${Math.round(monthlyFromFrequency(i.amount, i.frequency))}/mo (${i.frequency})`).join('\n') || 'None'}

══ EXPENSE BREAKDOWN ══
${Object.entries(expensesByCategory).sort((a,b)=>b[1]-a[1]).map(([c,a]) => `${c}: ₹${Math.round(a)}/mo`).join('\n') || 'None'}
Essential: ₹${Math.round(db.expenses.filter(e=>e.isEssential).reduce((s,e)=>s+(e.frequency==='annual'?e.amount/12:e.amount),0))}/mo

══ DEBTS (sorted highest APR first — Avalanche) ══
${debtsSortedByRate.map((d,i) => `${i+1}. ${d.name} (${d.type}): ₹${d.principal.toLocaleString('en-IN')} @ ${d.interestRate}% APR | EMI: ₹${d.emi}/mo | ${d.remainingTenure} months left`).join('\n') || 'No debts'}
Total Principal: ₹${totalDebtPrincipal.toLocaleString('en-IN')} | Est. Interest Burden: ₹${Math.round(totalInterestBurden).toLocaleString('en-IN')}

══ INVESTMENTS & ASSETS ══
${db.investments.map(i => `${i.name} (${i.type}): Current ₹${i.currentValue.toLocaleString('en-IN')} | Invested ₹${i.investedAmount.toLocaleString('en-IN')} | ${i.expectedReturn}% p.a.`).join('\n') || 'None'}
${db.assets.map(a => `${a.name}: ₹${a.currentValue.toLocaleString('en-IN')}`).join('\n') || 'None'}
Net Worth: ₹${summary.netWorth.toLocaleString('en-IN')}

══ GOALS ══
${goalsSerialized.map(g => `[${g.priority.toUpperCase()}] ${g.name} (${g.category}): Target ₹${g.targetAmount.toLocaleString('en-IN')} by ${g.targetDate}`).join('\n') || 'No goals'}

══ YOUR STRICT ALGORITHMIC MANDATE ══
FIRST PRIORITY - DEBT TRAP CHECK:
- If ANY debt > 18% APR exists, classify user as IN DEBT TRAP.
- If IN DEBT TRAP: STOP all monthly investments. Use entire monthly savings + old investments to pre-pay high-interest EMI immediately. Advise selling/mortgaging assets if extreme. Show exact calculation of how many months earlier the loan closes.
- Calculate portion of income eaten by EMI: (Total EMI / Total Income) * 100.

SECOND PRIORITY - EMERGENCY FUND:
- Check if Emergency Fund exists in Bank Accounts or Debt Mutual Funds.
- Minimum Required: 3x Monthly Expenses.
- If shortfall exists: Formulate a plan allotting a strict portion of savings to build this up.

THIRD PRIORITY - GOAL & INVESTMENT ALLOCATION BY AGE:
Allocate monthly surplus AFTER debt/emergency priorities are met. Focus on goals by priority. Use strict age brackets:
- AGE 20-30: 40% Small Cap, 40% Mid Cap, 20% Large Cap.
- AGE 30-40: 30% Small Cap, 40% Mid Cap, 30% Large Cap.
- AGE 40-50+: 20% Debt/FD, 30% Mid Cap, 50% Large Cap.
* Fixed Growth Rates to use for all projections (compounded annually): Small Cap=20%, Mid Cap=16%, Large Cap=12%, Debt Fund=7%, FD=5%.
* In your JSON, provide projected years to achieve each goal, and the total projected corpus after 20 years and 30 years if they continuously invest at their age-adjusted blended growth rate.

Return ONLY this JSON structure exactly:
{
  "emi_income_ratio_pct": number,
  "debt_trap_status": { "in_trap": boolean, "actionable_advice": "string", "months_saved_by_prepaying": number },
  "emergency_fund_status": { "current_amount": number, "required_amount": number, "allotment_plan": "string" },
  "health_score": number,
  "health_grade": "A|B|C|D|F",
  "health_breakdown": { "savings_rate_score": number, "debt_to_income_score": number, "emergency_fund_score": number, "investment_diversity_score": number },
  "key_problems": ["string"],
  "debt_payoff_plan": [{ "rank": number, "name": "string", "reason": "string", "current_emi": number, "recommended_extra_payment": number, "estimated_payoff_months": number }],
  "total_interest_saved": number,
  "goal_analysis": [{ "name": "string", "achievable": boolean, "verdict": "string", "monthly_needed": number, "projected_years_to_achieve": number }],
  "budget_audit": { "overall_verdict": "string", "suggested_cuts": ["string"] },
  "action_plan": [{ "priority": number, "action": "string", "impact": "string", "timeframe": "string" }],
  "investment_breakdown": [{ "instrument": "string", "monthly_amount": number, "allocation_pct": number, "reason": "string" }],
  "long_term_projections": { "blended_growth_rate_pct": number, "corpus_20_years": number, "corpus_30_years": number },
  "net_worth_trajectory": { "current": number, "in_5_years_if_no_change": number, "in_5_years_if_followed": number },
  "motivational_message": "string"
}`;


      console.log(`Sending Prompt to ${usingOpenAI ? 'OpenAI' : 'Gemini'} (Length: ${masterPrompt.length}):`, masterPrompt.substring(0, 1000) + '...');
      
      // Add a timeout to the AI call to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI API Timeout after 30s')), 30000)
      );
      
      let responseTextRaw = '';
      if (usingOpenAI) {
        const openai = new OpenAI({ apiKey });
        const result: any = await Promise.race([
          openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: masterPrompt }],
            response_format: { type: 'json_object' },
            max_tokens: 4096,
          }),
          timeoutPromise
        ]);
        responseTextRaw = result.choices[0].message.content || '{}';
      } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash-lite',
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096 },
        });
        const result: any = await Promise.race([
          model.generateContent(masterPrompt),
          timeoutPromise
        ]);
        responseTextRaw = await result.response.text();
      }

      const responseText = responseTextRaw.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      const aiResponse = JSON.parse(responseText);

      const hsTotal = Math.min(100, Math.max(0,
        (aiResponse.health_breakdown?.savings_rate_score || 0) +
        (aiResponse.health_breakdown?.debt_to_income_score || 0) +
        (aiResponse.health_breakdown?.emergency_fund_score || 0) +
        (aiResponse.health_breakdown?.investment_diversity_score || 0)
      )) || aiResponse.health_score || Math.min(100, Math.round((summary.savingsRate * 2) + 20));

      const structuredRoadmap: FinancialRoadmap = {
        debtTrapStatus: {
          inTrap: aiResponse.debt_trap_status?.in_trap || false,
          actionableAdvice: aiResponse.debt_trap_status?.actionable_advice || '',
          monthsSavedByPrepaying: aiResponse.debt_trap_status?.months_saved_by_prepaying || 0,
          emiIncomeRatioPct: aiResponse.emi_income_ratio_pct || 0,
        },
        emergencyFundStatus: {
          currentAmount: aiResponse.emergency_fund_status?.current_amount || 0,
          requiredAmount: aiResponse.emergency_fund_status?.required_amount || 0,
          allotmentPlan: aiResponse.emergency_fund_status?.allotment_plan || '',
        },
        healthScore: {
          score: hsTotal,
          grade: aiResponse.health_grade || (hsTotal >= 80 ? 'A' : hsTotal >= 60 ? 'B' : hsTotal >= 40 ? 'C' : 'D'),
          breakdown: {
            savingsRate: aiResponse.health_breakdown?.savings_rate_score ?? summary.savingsRate,
            debtToIncome: aiResponse.health_breakdown?.debt_to_income_score ?? (summary.totalIncome > 0 ? (summary.totalDebts / summary.totalIncome) * 100 : 0),
            emergencyFund: aiResponse.health_breakdown?.emergency_fund_score ?? (summary.totalExpenses > 0 ? (summary.totalAssets / summary.totalExpenses) * 100 : 0),
            investmentDiversity: aiResponse.health_breakdown?.investment_diversity_score ?? 40,
          },
          recommendations: [...(aiResponse.key_problems || []), ...(aiResponse.what_not_to_do || [])].slice(0, 5),
        },
        debtStrategy: {
          strategy: aiResponse.budget_audit?.overall_verdict || 'Avalanche method — pay highest APR debt first.',
          prioritizedDebts: (aiResponse.debt_payoff_plan || db.debts.map((d, i) => ({
            rank: i + 1, name: d.name, reason: `${d.interestRate}% APR`, current_emi: d.emi, recommended_extra_payment: 0, estimated_payoff_months: d.remainingTenure
          }))).map((d: any) => ({
            id: db.debts.find((dbD: any) => dbD.name === d.name)?.id || d.name,
            name: d.name,
            priority: d.rank,
            reason: d.reason,
            suggestedPayment: (d.current_emi || 0) + (d.recommended_extra_payment || 0),
          })),
          totalInterestSaved: aiResponse.total_interest_saved || 0,
          debtFreeDate: aiResponse.estimated_debt_free_date || 'Calculating...',
        },
        investmentRecommendation: {
          riskProfile: db.user.age && db.user.age >= 50 ? 'Conservative' : db.user.age && db.user.age >= 38 ? 'Balanced' : 'Growth-Oriented',
          suggestedAllocation: (aiResponse.investment_breakdown || []).reduce((acc: Record<string, number>, item: any) => {
            acc[item.instrument] = item.allocation_pct || 0;
            return acc;
          }, {}),
          recommendations: (aiResponse.investment_breakdown || []).map((ib: any) => ({
            type: ib.instrument,
            allocation: ib.allocation_pct || 0,
            reason: `₹${(ib.monthly_amount || 0).toLocaleString('en-IN')}/mo — ${ib.reason}`,
          })),
        },
        longTermProjections: {
          blendedGrowthRatePct: aiResponse.long_term_projections?.blended_growth_rate_pct || 12,
          corpus20Years: aiResponse.long_term_projections?.corpus_20_years || 0,
          corpus30Years: aiResponse.long_term_projections?.corpus_30_years || 0,
        },
        budgetRecommendation: {
          currentBudget: { income: summary.totalIncome, expenses: summary.totalExpenses },
          suggestedBudget: { income: summary.totalIncome, expenses: summary.totalExpenses * 0.9 },
          savingsOpportunities: (aiResponse.budget_audit?.suggested_cuts || []).map((cut: string, i: number) => ({
            category: cut.split(':')[0] || `Optimization #${i + 1}`,
            currentSpend: summary.totalExpenses,
            suggestedSpend: summary.totalExpenses * 0.9,
            potentialSavings: Math.round(summary.totalExpenses * 0.1 / Math.max(1, (aiResponse.budget_audit?.suggested_cuts?.length || 1))),
          })),
        },
        goalAnalysis: {
          goals: (aiResponse.goal_analysis && aiResponse.goal_analysis.length > 0
            ? aiResponse.goal_analysis.map((ga: any) => {
                const dbGoal = db.goals.find((g: any) => g.name === ga.name);
                const progress = dbGoal && dbGoal.targetAmount > 0 ? (dbGoal.currentAmount / dbGoal.targetAmount) * 100 : 0;
                return { 
                  id: dbGoal?.id || ga.name, 
                  name: ga.name, 
                  progress, 
                  onTrack: ga.achievable, 
                  monthlyRequired: ga.monthly_needed || 0, 
                  estimatedCompletion: dbGoal?.targetDate || (ga.projected_years_to_achieve ? `${ga.projected_years_to_achieve} yrs` : '') 
                };
              })
            : db.goals.map(g => ({ id: g.id, name: g.name, progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0, onTrack: true, monthlyRequired: 0, estimatedCompletion: g.targetDate }))
          ),
          overallProgress: db.goals.length > 0 ? db.goals.reduce((s, g) => s + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) / db.goals.length : 0,
        },
        actionPlan: (aiResponse.action_plan || []).map((a: any) => ({
          priority: a.priority, action: a.action, impact: a.impact, timeframe: a.timeframe,
        })),
        netWorthTrajectory: {
          current: aiResponse.net_worth_trajectory?.current || summary.netWorth,
          in5YearsIfNoChange: aiResponse.net_worth_trajectory?.in_5_years_if_no_change || summary.netWorth,
          in5YearsIfFollowed: aiResponse.net_worth_trajectory?.in_5_years_if_followed || summary.netWorth,
        },
        motivationalMessage: aiResponse.motivational_message || aiResponse.situation_summary || 'Every rupee tracked brings you closer to financial freedom.',
      };

      // Cache the result with the data fingerprint
      aiInsightsCache.set(db.user.uid, { roadmap: structuredRoadmap, fingerprint, generatedAt: new Date().toISOString() });

      return NextResponse.json({ roadmap: structuredRoadmap, fromCache: false, fingerprint, generatedAt: new Date().toISOString() });
    } catch (error: any) {
      console.error('AI Error - Falling back to local calculation:', error.message);
      
      // FALLBACK: Return a calculated roadmap if AI fails (e.g. Quota Exceeded)
      const summary = computeSummary(db);
      const fallbackRoadmap: FinancialRoadmap = {
        debtTrapStatus: {
          inTrap: false, actionableAdvice: '', monthsSavedByPrepaying: 0, emiIncomeRatioPct: 0
        },
        emergencyFundStatus: {
          currentAmount: 0, requiredAmount: 0, allotmentPlan: 'Fallback API active.'
        },
        longTermProjections: {
          blendedGrowthRatePct: 0, corpus20Years: 0, corpus30Years: 0
        },
        healthScore: computeHealthScore(db),
        debtStrategy: {
          strategy: 'Fallback Strategy: Prioritize high-interest debts while maintaining minimum payments.',
          prioritizedDebts: db.debts.map((d, i) => ({
            id: d.id, name: d.name, priority: i + 1, reason: 'Manual calculation', suggestedPayment: d.emi
          })),
          totalInterestSaved: 0,
          debtFreeDate: 'TBD'
        },
        investmentRecommendation: {
          riskProfile: db.user.age && db.user.age >= 45 ? 'conservative' : 'balanced',
          suggestedAllocation: { 'Stocks': 50, 'Mutual Funds': 30, 'Gold': 20 },
          recommendations: [
            { type: 'Equity', allocation: 50, reason: 'Long-term growth' },
            { type: 'Debt', allocation: 30, reason: 'Capital preservation' }
          ]
        },
        budgetRecommendation: {
          currentBudget: { income: summary.totalIncome, expenses: summary.totalExpenses },
          suggestedBudget: { income: summary.totalIncome, expenses: summary.totalExpenses * 0.8 },
          savingsOpportunities: [
            { category: 'General', currentSpend: summary.totalExpenses, suggestedSpend: summary.totalExpenses * 0.8, potentialSavings: summary.totalExpenses * 0.2 }
          ]
        },
        goalAnalysis: {
          goals: db.goals.map(g => ({
            id: g.id, name: g.name, progress: g.targetAmount > 0 ? (g.currentAmount/g.targetAmount)*100 : 0,
            onTrack: true, monthlyRequired: 0, estimatedCompletion: g.targetDate
          })),
          overallProgress: 0
        },
        actionPlan: [
          { priority: 1, action: 'AI quota reached. Using computed metrics.', impact: 'Informational', timeframe: 'Immediate' },
          { priority: 2, action: 'Focus on your highest interest debt.', impact: 'Interest saving', timeframe: 'Monthly' }
        ],
        netWorthTrajectory: {
          current: summary.netWorth,
          in5YearsIfNoChange: summary.netWorth * 1.2,
          in5YearsIfFollowed: summary.netWorth * 1.5,
        },
        motivationalMessage: "You're taking the right steps. Keep tracking your finances!"
      };

      return NextResponse.json({ 
        roadmap: fallbackRoadmap,
        isFallback: true,
        aiError: error.message 
      });
    }
  }

  return NextResponse.json({ message: 'Not implemented', path: segments.join('/') }, { status: 501 });
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const segments = await getSegments(ctx);

  // Auth
  if (segments[0] === 'auth' && segments[1] === 'register') {
    const body = await readJsonBody<{ email: string; password: string; name: string; age?: number }>(req);
    if (!body?.email || !body?.password || !body?.name) {
      return NextResponse.json({ message: 'Invalid register payload' }, { status: 400 });
    }
    try {
      // Create user (Firebase Auth REST API)
      const signUp = await firebaseAuthPost<{
        idToken: string;
        email: string;
        localId: string;
      }>('accounts:signUp', {
        email: body.email,
        password: body.password,
        returnSecureToken: true,
      });

      // Set displayName
      await firebaseAuthPost('accounts:update', {
        idToken: signUp.idToken,
        displayName: body.name,
        returnSecureToken: false,
      });

      // Initialize Firestore document for the new user
      const db: Db = {
        user: { uid: signUp.localId, email: signUp.email, name: body.name, age: body.age, createdAt: nowIso(), updatedAt: nowIso() },
        income: [],
        expenses: [],
        debts: [],
        investments: [],
        assets: [],
        goals: [],
      };
      await updateDb(signUp.localId, db);

      return NextResponse.json({
        message: 'Registered',
        user: { uid: signUp.localId, email: signUp.email },
      });
    } catch (err) {
      return NextResponse.json(
        { message: err instanceof Error ? err.message : 'Failed to register' },
        { status: 400 },
      );
    }
  }

  if (segments[0] === 'auth' && segments[1] === 'login') {
    const body = await readJsonBody<{ email: string; password: string }>(req);
    if (!body?.email || !body?.password) {
      return NextResponse.json({ message: 'Invalid login payload' }, { status: 400 });
    }
    try {
      const signIn = await firebaseAuthPost<{
        idToken: string;
        email: string;
        localId: string;
        displayName?: string;
      }>('accounts:signInWithPassword', {
        email: body.email,
        password: body.password,
        returnSecureToken: true,
      });

      // No-op for login, getOrCreateDbForRequest handles it
      
      return NextResponse.json({
        message: 'Logged in',
        token: signIn.idToken,
        user: {
          uid: signIn.localId,
          email: signIn.email,
          name: signIn.displayName || 'User',
        },
      });
    } catch (err) {
      return NextResponse.json(
        { message: err instanceof Error ? err.message : 'Failed to login' },
        { status: 400 },
      );
    }
  }

  if (segments[0] === 'auth' && segments[1] === 'logout') {
    // Allow logout even without auth (so the client can always clear local token).
    return NextResponse.json({ message: 'Logged out' });
  }

  if (segments[0] === 'auth' && segments[1] === 'google') {
    const body = await readJsonBody<{ idToken: string }>(req);
    if (!body?.idToken) {
      return NextResponse.json({ message: 'Missing idToken' }, { status: 400 });
    }

    try {
      const decoded = await getFirebaseAdminAuth().verifyIdToken(body.idToken);
      const u = await getFirebaseAdminAuth().getUser(decoded.uid);

      // No-op for Google login, getOrCreateDbForRequest handles it

      return NextResponse.json({
        message: 'Logged in with Google',
        token: body.idToken,
        user: {
          uid: decoded.uid,
          email: u.email || 'unknown@local',
          name: u.displayName || 'User',
        },
      });
    } catch (err) {
      return NextResponse.json(
        { message: err instanceof Error ? err.message : 'Invalid token' },
        { status: 401 },
      );
    }
  }

  // Everything below requires auth
  const db = await getOrCreateDbForRequest(req);
  if (!db) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Financial create endpoints
  if (segments[0] === 'financial') {
    const kind = segments[1];
    const body = await readJsonBody<any>(req);
    const t = nowIso();

    if (kind === 'income') {
      const income: StoredIncome = {
        id: genId('income'),
        source: String(body?.source ?? ''),
        amount: Number(body?.amount ?? 0),
        frequency: (body?.frequency as Frequency) ?? 'monthly',
        isActive: Boolean(body?.isActive ?? true),
        createdAt: t,
        updatedAt: t,
      };
      db.income.push(income);
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Income added', income });
    }

    if (kind === 'expenses') {
      const expense: StoredExpense = {
        id: genId('expense'),
        category: String(body?.category ?? ''),
        description: String(body?.description ?? ''),
        amount: Number(body?.amount ?? 0),
        frequency: (body?.frequency as Frequency) ?? 'monthly',
        isEssential: Boolean(body?.isEssential ?? true),
        createdAt: t,
        updatedAt: t,
      };
      db.expenses.push(expense);
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Expense added', expense });
    }

    if (kind === 'debts') {
      const debt: StoredDebt = {
        id: genId('debt'),
        name: String(body?.name ?? ''),
        type: (body?.type as DebtType) ?? 'other',
        principal: Number(body?.principal ?? 0),
        interestRate: Number(body?.interestRate ?? 0),
        emi: Number(body?.emi ?? 0),
        remainingTenure: Number(body?.remainingTenure ?? 0),
        createdAt: t,
        updatedAt: t,
      };
      db.debts.push(debt);
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Debt added', debt });
    }

    if (kind === 'investments') {
      const investment: StoredInvestment = {
        id: genId('inv'),
        name: String(body?.name ?? ''),
        type: (body?.type as InvestmentType) ?? 'other',
        currentValue: Number(body?.currentValue ?? 0),
        investedAmount: Number(body?.investedAmount ?? 0),
        expectedReturn: Number(body?.expectedReturn ?? 0),
        createdAt: t,
        updatedAt: t,
      };
      db.investments.push(investment);
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Investment added', investment });
    }

    if (kind === 'assets') {
      const asset: StoredAsset = {
        id: genId('asset'),
        name: String(body?.name ?? ''),
        type: (body?.type as AssetType) ?? 'other',
        currentValue: Number(body?.currentValue ?? 0),
        purchaseValue: Number(body?.purchaseValue ?? 0),
        purchaseDate: String(body?.purchaseDate ?? nowIso()),
        createdAt: t,
        updatedAt: t,
      };
      db.assets.push(asset);
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Asset added', asset });
    }

    if (kind === 'goals') {
      const goal: StoredGoal = {
        id: genId('goal'),
        name: String(body?.name ?? ''),
        targetAmount: Number(body?.targetAmount ?? 0),
        currentAmount: Number(body?.currentAmount ?? 0),
        targetDate: String(body?.targetDate ?? nowIso()),
        priority: (body?.priority as GoalPriority) ?? 'medium',
        category: (body?.category as GoalCategory) ?? 'other',
        createdAt: t,
        updatedAt: t,
      };
      db.goals.push(goal);
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Goal added', goal });
    }
  }

  return NextResponse.json({ message: 'Not implemented', path: segments.join('/') }, { status: 501 });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const segments = await getSegments(ctx);

  const db = await getOrCreateDbForRequest(req);
  if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  // User profile update
  if (segments[0] === 'user' && segments[1] === 'profile') {
    const body = await readJsonBody<Partial<StoredUser>>(req);
    const t = nowIso();
    
    if (body?.name) db.user.name = String(body.name);
    if (typeof body?.age === 'number') db.user.age = body.age;
    db.user.updatedAt = t;

    await updateDb(db.user.uid, db);
    
    try {
      await getFirebaseAdminAuth().updateUser(db.user.uid, { displayName: db.user.name });
    } catch { /* ignore */ }

    return NextResponse.json({ message: 'Profile updated', user: db.user });
  }

  // Financial update endpoints
  if (segments[0] === 'financial') {
    const kind = segments[1];
    const id = segments[2];
    const body = await readJsonBody<any>(req);
    const t = nowIso();

    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });

    if (kind === 'income') {
      const item = db.income.find((x) => x.id === id);
      if (!item) return NextResponse.json({ message: 'Not found' }, { status: 404 });
      if (body?.source !== undefined) item.source = String(body.source);
      if (body?.amount !== undefined) item.amount = Number(body.amount);
      if (body?.frequency !== undefined) item.frequency = body.frequency;
      if (body?.isActive !== undefined) item.isActive = Boolean(body.isActive);
      item.updatedAt = t;
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Income updated', income: item });
    }

    if (kind === 'expenses') {
      const item = db.expenses.find((x) => x.id === id);
      if (!item) return NextResponse.json({ message: 'Not found' }, { status: 404 });
      if (body?.category !== undefined) item.category = String(body.category);
      if (body?.description !== undefined) item.description = String(body.description);
      if (body?.amount !== undefined) item.amount = Number(body.amount);
      if (body?.frequency !== undefined) item.frequency = body.frequency;
      if (body?.isEssential !== undefined) item.isEssential = Boolean(body.isEssential);
      item.updatedAt = t;
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Expense updated', expense: item });
    }

    if (kind === 'debts') {
      const item = db.debts.find((x) => x.id === id);
      if (!item) return NextResponse.json({ message: 'Not found' }, { status: 404 });
      if (body?.name !== undefined) item.name = String(body.name);
      if (body?.type !== undefined) item.type = body.type;
      if (body?.principal !== undefined) item.principal = Number(body.principal);
      if (body?.interestRate !== undefined) item.interestRate = Number(body.interestRate);
      if (body?.emi !== undefined) item.emi = Number(body.emi);
      if (body?.remainingTenure !== undefined) item.remainingTenure = Number(body.remainingTenure);
      item.updatedAt = t;
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Debt updated', debt: item });
    }

    if (kind === 'investments') {
      const item = db.investments.find((x) => x.id === id);
      if (!item) return NextResponse.json({ message: 'Not found' }, { status: 404 });
      if (body?.name !== undefined) item.name = String(body.name);
      if (body?.type !== undefined) item.type = body.type;
      if (body?.currentValue !== undefined) item.currentValue = Number(body.currentValue);
      if (body?.investedAmount !== undefined) item.investedAmount = Number(body.investedAmount);
      if (body?.expectedReturn !== undefined) item.expectedReturn = Number(body.expectedReturn);
      item.updatedAt = t;
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Investment updated', investment: item });
    }

    if (kind === 'assets') {
      const item = db.assets.find((x) => x.id === id);
      if (!item) return NextResponse.json({ message: 'Not found' }, { status: 404 });
      if (body?.name !== undefined) item.name = String(body.name);
      if (body?.type !== undefined) item.type = body.type;
      if (body?.currentValue !== undefined) item.currentValue = Number(body.currentValue);
      if (body?.purchaseValue !== undefined) item.purchaseValue = Number(body.purchaseValue);
      if (body?.purchaseDate !== undefined) item.purchaseDate = String(body.purchaseDate);
      item.updatedAt = t;
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Asset updated', asset: item });
    }

    if (kind === 'goals') {
      const item = db.goals.find((x) => x.id === id);
      if (!item) return NextResponse.json({ message: 'Not found' }, { status: 404 });
      if (body?.name !== undefined) item.name = String(body.name);
      if (body?.targetAmount !== undefined) item.targetAmount = Number(body.targetAmount);
      if (body?.currentAmount !== undefined) item.currentAmount = Number(body.currentAmount);
      if (body?.targetDate !== undefined) item.targetDate = String(body.targetDate);
      if (body?.priority !== undefined) item.priority = body.priority;
      if (body?.category !== undefined) item.category = body.category;
      item.updatedAt = t;
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Goal updated', goal: item });
    }
  }

  return NextResponse.json({ message: 'Not implemented', path: segments.join('/') }, { status: 501 });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const segments = await getSegments(ctx);

  const db = await getOrCreateDbForRequest(req);
  if (!db) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (segments[0] !== 'financial') {
    return NextResponse.json({ message: 'Not implemented', path: segments.join('/') }, { status: 501 });
  }

  const kind = segments[1];
  const id = segments[2];
  if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });

  const t = nowIso();

  if (kind === 'income') {
    const before = db.income.length;
    db.income = db.income.filter((x) => x.id !== id);
    if (db.income.length !== before) {
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Income deleted' });
    }
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (kind === 'expenses') {
    const before = db.expenses.length;
    db.expenses = db.expenses.filter((x) => x.id !== id);
    if (db.expenses.length !== before) {
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Expense deleted' });
    }
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (kind === 'debts') {
    const before = db.debts.length;
    db.debts = db.debts.filter((x) => x.id !== id);
    if (db.debts.length !== before) {
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Debt deleted' });
    }
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (kind === 'investments') {
    const before = db.investments.length;
    db.investments = db.investments.filter((x) => x.id !== id);
    if (db.investments.length !== before) {
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Investment deleted' });
    }
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (kind === 'assets') {
    const before = db.assets.length;
    db.assets = db.assets.filter((x) => x.id !== id);
    if (db.assets.length !== before) {
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Asset deleted' });
    }
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (kind === 'goals') {
    const before = db.goals.length;
    db.goals = db.goals.filter((x) => x.id !== id);
    if (db.goals.length !== before) {
      await updateDb(db.user.uid, db);
      return NextResponse.json({ message: 'Goal deleted' });
    }
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  // Touch timestamp to avoid unused warning if we later add mutation tracking.
  void t;
  return NextResponse.json({ message: 'Not implemented', path: segments.join('/') }, { status: 501 });
}

