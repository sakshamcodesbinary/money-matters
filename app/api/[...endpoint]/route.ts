import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  motivationalMessage: string;
};

const lastAiGenerationTimestamp = new Map<string, number>();
const AI_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown per user

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

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const segments = await getSegments(ctx);

  // Auth-free endpoints could be added here, if needed.
  if (segments[0] !== 'auth') {
    const db = await getOrCreateDbForRequest(_req);
    if (!db) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
  }

  const db = await getOrCreateDbForRequest(_req);

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

    // Rate limiting check
    const now = Date.now();
    const lastGen = lastAiGenerationTimestamp.get(db.user.uid) || 0;
    if (now - lastGen < AI_COOLDOWN_MS) {
      const waitSec = Math.ceil((AI_COOLDOWN_MS - (now - lastGen)) / 1000);
      return NextResponse.json({
        message: `Please wait ${waitSec} seconds before generating new insights.`,
        retryAfter: waitSec
      }, { status: 429 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Missing GEMINI_API_KEY');
      return NextResponse.json({ message: 'AI configuration missing' }, { status: 500 });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite-preview',
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 2048,
        },
      });

      lastAiGenerationTimestamp.set(db.user.uid, now);

      const summary = computeSummary(db);
      const userAge = db.user.age ?? 30;

      const masterPrompt = `
        You are a highly intelligent, empathetic, and practical financial advisor for Indian users.
        Your goal is to:
        1. Understand the user's full financial situation deeply
        2. Give structured, actionable, and realistic financial advice
        3. Balance emotional sensitivity with logical planning
        4. Focus on long-term stability, not risky shortcuts

        ----------------------------------------
        DEFAULT RULE
        ----------------------------------------
        - If user's age is NOT provided, assume age = 30 (Current User Age: ${userAge})

        ----------------------------------------
        CONTEXT UNDERSTANDING RULES
        ----------------------------------------
        - Carefully analyze:
          - Age: ${userAge}
          - Monthly Income: ₹${summary.totalIncome}
          - Monthly Expenses: ₹${summary.totalExpenses}
          - Total Debts: ₹${summary.totalDebts}
          - Total Investments: ₹${summary.totalInvestments}
          - Total Assets: ₹${summary.totalAssets}
          - Net Worth: ₹${summary.netWorth}
          - Monthly Surplus: ₹${summary.monthlySurplus}
          - Savings Rate: ${summary.savingsRate}%
          - Detailed Data: ${JSON.stringify({
        income: db.income,
        expenses: db.expenses,
        debts: db.debts,
        investments: db.investments,
        assets: db.assets,
        goals: db.goals
      })}

        - Identify hidden signals: Financial stress, lack of planning, emotional pressure, urgency.

        ----------------------------------------
        TONE & STYLE
        ----------------------------------------
        - Speak in simple English
        - Be calm, supportive, and non-judgmental
        - Avoid complex jargon unless explained
        - Sound like a real mentor, not a textbook

        ----------------------------------------
        OUTPUT FORMAT (STRICT JSON ONLY)
        ----------------------------------------
        Return response ONLY in valid JSON format. Do NOT include markdown blocks.

        {
          "situation_summary": "string (English analysis of the current state)",
          "key_problems": ["string (English problem statement)", "..."],
          "action_plan": {
            "salary_split": {
              "needs": "₹ amount",
              "personal_expenses": "₹ amount",
              "investments": "₹ amount"
            },
            "emergency_fund": "string (English advice)",
            "expense_control": "string (English advice)",
            "investment_plan": {
              "short_term": "string (English advice)",
              "long_term": "string (English advice)",
              "risk_explanation": "string (English explanation)"
            }
          },
          "investment_breakdown": [
            {
              "instrument": "Debt Fund / Gold ETF / Equity / FD",
              "amount": "₹ amount",
              "reason": "string (English reason)"
            }
          ],
          "goal_planning": {
            "goal": "string (Specific goal)",
            "estimated_cost": "₹ amount",
            "timeline": "string",
            "strategy": "string (English strategy)",
            "loan_feasibility": "string (English assessment)",
            "emi_estimate": "₹ amount"
          },
          "what_not_to_do": ["string (English warning)", "..."],
          "future_growth": {
            "side_income": "string (English advice)",
            "skills": "string (English advice)",
            "career_advice": "string (English advice)"
          }
        }

        ----------------------------------------
        IMPORTANT RULES
        ----------------------------------------
        - JSON keys MUST be in English
        - Values MUST be in simple English
        - Always give practical ₹ numbers
        - Avoid high-risk investments for beginners
        - For short-term goals -> safe options (FD, debt funds)
        - For long-term -> equity can be suggested
        - Never suggest unrealistic returns
        - Do NOT output anything outside JSON
      `;

      console.log('Sending Prompt to Gemini (Length:', masterPrompt.length, '):', masterPrompt.substring(0, 1000) + '...');
      
      // Add a timeout to the AI call to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API Timeout after 30s')), 30000)
      );
      
      const result = await Promise.race([
        model.generateContent(masterPrompt),
        timeoutPromise
      ]) as any;

      const responseTextRaw = await result.response.text();
      const responseText = responseTextRaw.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      const aiResponse = JSON.parse(responseText);

      // Now we wrap the AI response into the format the frontend expects.
      // The frontend expects the roadmap properties at the top level of the returned 'roadmap' key.
      
      const structuredRoadmap: FinancialRoadmap = {
        healthScore: {
          score: Math.min(100, Math.max(0, (summary.savingsRate * 2) + 20)), // Simple logic to fill UI
          grade: summary.savingsRate > 20 ? 'A' : summary.savingsRate > 10 ? 'B' : 'C',
          breakdown: {
            savingsRate: summary.savingsRate,
            debtToIncome: summary.totalIncome > 0 ? (summary.totalDebts / summary.totalIncome) * 100 : 0,
            emergencyFund: summary.totalExpenses > 0 ? (summary.totalAssets / summary.totalExpenses) * 100 : 0,
            investmentDiversity: 40,
          },
          recommendations: aiResponse.key_problems || [],
        },
        debtStrategy: {
          strategy: aiResponse.action_plan?.expense_control || 'Focus on paying off high-interest debts first.',
          prioritizedDebts: db.debts.map((d, i) => ({
            id: d.id,
            name: d.name,
            priority: i + 1,
            reason: 'High interest impact',
            suggestedPayment: d.emi,
          })),
          totalInterestSaved: 0,
          debtFreeDate: 'Analyzing...',
        },
        investmentRecommendation: {
          riskProfile: 'Balanced',
          suggestedAllocation: {
            Stocks: 40,
            Gold: 10,
            'Mutual Funds': 50,
          },
          recommendations: aiResponse.investment_breakdown?.map((ib: any) => ({
            type: ib.instrument,
            allocation: 0,
            reason: ib.reason,
          })) || [],
        },
        budgetRecommendation: {
          currentBudget: {
            income: summary.totalIncome,
            expenses: summary.totalExpenses,
          },
          suggestedBudget: {
            income: summary.totalIncome,
            expenses: summary.totalExpenses * 0.9,
          },
          savingsOpportunities: [],
        },
        goalAnalysis: {
          goals: db.goals.map((g) => {
            const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            return {
              id: g.id,
              name: g.name,
              progress,
              onTrack: progress >= 30,
              monthlyRequired: 0,
              estimatedCompletion: g.targetDate,
            };
          }),
          overallProgress: 0,
        },
        actionPlan: [
          {
            priority: 1,
            action: aiResponse.action_plan?.emergency_fund || 'Build an emergency fund.',
            impact: 'Financial Security',
            timeframe: '1-3 months',
          },
          ... (aiResponse.key_problems || []).map((p: string, i: number) => ({
            priority: i + 2,
            action: p,
            impact: 'Improve Health',
            timeframe: 'ASAP',
          })),
        ],
        motivationalMessage: aiResponse.situation_summary || 'You are on the right track!',
      };

      return NextResponse.json({ roadmap: structuredRoadmap });
    } catch (error: any) {
      console.error('Gemini AI Error - Falling back to local calculation:', error.message);
      
      // FALLBACK: Return a calculated roadmap if AI fails (e.g. Quota Exceeded)
      const summary = computeSummary(db);
      const fallbackRoadmap: FinancialRoadmap = {
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

