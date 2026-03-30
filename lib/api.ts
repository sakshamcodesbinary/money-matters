// The frontend talks to our backend via Next.js route handlers under `/api`.
// When you later switch to Firebase, you can either update these route handlers
// or point `NEXT_PUBLIC_API_URL` to Firebase endpoints and revert this default.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL as string | undefined) ?? '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    
    const token = this.getToken();
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };
    
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: { email: string; password: string; name: string; age?: number }) {
    return this.request<{ message: string; user: { uid: string; email: string } }>('/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{ message: string; token: string; user: { uid: string; email: string; name: string } }>('/auth/login', {
      method: 'POST',
      body: data,
    });
    this.setToken(response.token);
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  // User endpoints
  async getProfile() {
    return this.request<{ user: UserProfile }>('/user/profile');
  }

  async updateProfile(data: Partial<UserProfile>) {
    return this.request<{ message: string; user: UserProfile }>('/user/profile', {
      method: 'PUT',
      body: data,
    });
  }

  // Financial data endpoints
  async getIncome() {
    return this.request<{ income: Income[] }>('/financial/income');
  }

  async addIncome(data: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request<{ message: string; income: Income }>('/financial/income', {
      method: 'POST',
      body: data,
    });
  }

  async updateIncome(id: string, data: Partial<Income>) {
    return this.request<{ message: string; income: Income }>(`/financial/income/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteIncome(id: string) {
    return this.request<{ message: string }>(`/financial/income/${id}`, { method: 'DELETE' });
  }

  async getExpenses() {
    return this.request<{ expenses: Expense[] }>('/financial/expenses');
  }

  async addExpense(data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request<{ message: string; expense: Expense }>('/financial/expenses', {
      method: 'POST',
      body: data,
    });
  }

  async updateExpense(id: string, data: Partial<Expense>) {
    return this.request<{ message: string; expense: Expense }>(`/financial/expenses/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteExpense(id: string) {
    return this.request<{ message: string }>(`/financial/expenses/${id}`, { method: 'DELETE' });
  }

  async getDebts() {
    return this.request<{ debts: Debt[] }>('/financial/debts');
  }

  async addDebt(data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request<{ message: string; debt: Debt }>('/financial/debts', {
      method: 'POST',
      body: data,
    });
  }

  async updateDebt(id: string, data: Partial<Debt>) {
    return this.request<{ message: string; debt: Debt }>(`/financial/debts/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteDebt(id: string) {
    return this.request<{ message: string }>(`/financial/debts/${id}`, { method: 'DELETE' });
  }

  async getInvestments() {
    return this.request<{ investments: Investment[] }>('/financial/investments');
  }

  async addInvestment(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request<{ message: string; investment: Investment }>('/financial/investments', {
      method: 'POST',
      body: data,
    });
  }

  async updateInvestment(id: string, data: Partial<Investment>) {
    return this.request<{ message: string; investment: Investment }>(`/financial/investments/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteInvestment(id: string) {
    return this.request<{ message: string }>(`/financial/investments/${id}`, { method: 'DELETE' });
  }

  async getAssets() {
    return this.request<{ assets: Asset[] }>('/financial/assets');
  }

  async addAsset(data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request<{ message: string; asset: Asset }>('/financial/assets', {
      method: 'POST',
      body: data,
    });
  }

  async updateAsset(id: string, data: Partial<Asset>) {
    return this.request<{ message: string; asset: Asset }>(`/financial/assets/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAsset(id: string) {
    return this.request<{ message: string }>(`/financial/assets/${id}`, { method: 'DELETE' });
  }

  async getGoals() {
    return this.request<{ goals: Goal[] }>('/financial/goals');
  }

  async addGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.request<{ message: string; goal: Goal }>('/financial/goals', {
      method: 'POST',
      body: data,
    });
  }

  async updateGoal(id: string, data: Partial<Goal>) {
    return this.request<{ message: string; goal: Goal }>(`/financial/goals/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteGoal(id: string) {
    return this.request<{ message: string }>(`/financial/goals/${id}`, { method: 'DELETE' });
  }

  async getSummary() {
    return this.request<{ summary: FinancialSummary }>('/financial/summary');
  }

  // Recommendation endpoints
  async getHealthScore() {
    return this.request<{ healthScore: HealthScore }>('/recommendations/health-score');
  }

  async getDebtStrategy() {
    return this.request<{ debtStrategy: DebtStrategy }>('/recommendations/debt-strategy');
  }

  async getInvestmentRecommendation() {
    return this.request<{ investmentRecommendation: InvestmentRecommendation }>('/recommendations/investment');
  }

  async getBudgetRecommendation() {
    return this.request<{ budgetRecommendation: BudgetRecommendation }>('/recommendations/budget');
  }

  async getGoalAnalysis() {
    return this.request<{ goalAnalysis: GoalAnalysis }>('/recommendations/goals');
  }

  async getFullRoadmap(force: boolean = false) {
    const url = force ? '/recommendations/roadmap?force=true' : '/recommendations/roadmap';
    return this.request<{ 
      roadmap: FinancialRoadmap;
      fromCache?: boolean;
      generatedAt?: string;
      fingerprint?: string;
      rateLimited?: boolean;
      retryAfter?: number;
      isFallback?: boolean;
      aiError?: string;
    }>(url);
  }
}

// Types
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: 'monthly' | 'annual' | 'one-time';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  frequency: 'monthly' | 'annual' | 'one-time';
  isEssential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  name: string;
  type: 'credit_card' | 'personal_loan' | 'car_loan' | 'home_loan' | 'education_loan' | 'other';
  principal: number;
  interestRate: number;
  emi: number;
  remainingTenure: number;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  name: string;
  type: 'mutual_fund' | 'stocks' | 'fixed_deposit' | 'ppf' | 'nps' | 'real_estate' | 'gold' | 'crypto' | 'other';
  currentValue: number;
  investedAmount: number;
  expectedReturn: number;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'property' | 'vehicle' | 'jewelry' | 'electronics' | 'other';
  currentValue: number;
  purchaseValue: number;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  category: 'emergency_fund' | 'retirement' | 'education' | 'home' | 'travel' | 'wedding' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalDebts: number;
  totalInvestments: number;
  totalAssets: number;
  netWorth: number;
  monthlySurplus: number;
  savingsRate: number;
}

export interface HealthScore {
  score: number;
  grade: string;
  breakdown: {
    savingsRate: number;
    debtToIncome: number;
    emergencyFund: number;
    investmentDiversity: number;
  };
  recommendations: string[];
}

export interface DebtStrategy {
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
}

export interface InvestmentRecommendation {
  riskProfile: string;
  suggestedAllocation: Record<string, number>;
  recommendations: Array<{
    type: string;
    allocation: number;
    reason: string;
  }>;
}

export interface BudgetRecommendation {
  currentBudget: Record<string, number>;
  suggestedBudget: Record<string, number>;
  savingsOpportunities: Array<{
    category: string;
    currentSpend: number;
    suggestedSpend: number;
    potentialSavings: number;
  }>;
}

export interface GoalAnalysis {
  goals: Array<{
    id: string;
    name: string;
    progress: number;
    onTrack: boolean;
    monthlyRequired: number;
    estimatedCompletion: string;
  }>;
  overallProgress: number;
}

export interface FinancialRoadmap {
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
}

export const api = new ApiClient();
