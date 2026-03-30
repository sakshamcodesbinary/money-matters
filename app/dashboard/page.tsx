'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  PieChart,
  Building2,
  Target,
  Sparkles,
  ArrowRight,
  Wallet,
  Database,
  Search,
  Plus,
  Cpu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { api, type FinancialSummary, type HealthScore, type Income, type Expense, type Debt, type Investment, type Asset, type Goal } from '@/lib/api';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const assetTypeLabels: Record<string, string> = {
  cash: 'Liquid Capital (Bank)',
  emergency_fund: 'Resilience Strategy (Emergency Fund)',
  property: 'Property',
  vehicle: 'Vehicle',
  jewelry: 'Jewelry',
  electronics: 'Electronics',
  other: 'Other',
};

function StatCard({
  title,
  value,
  icon: Icon,
  onClick,
  trend,
  trendValue,
  color = 'primary',
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  onClick: () => void;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'primary' | 'accent' | 'destructive' | 'warning' | 'chart-2';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    destructive: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-warning',
    'chart-2': 'bg-chart-2/10 text-chart-2',
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer bg-card border-white/5 group"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {trend && trendValue && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${
            trend === 'up' ? 'text-accent' : 'text-destructive'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  );
}

function HealthScoreCard({ healthScore }: { healthScore: HealthScore }) {
  const gradeColors: Record<string, string> = {
    A: 'text-accent',
    B: 'text-chart-1',
    C: 'text-warning',
    D: 'text-destructive',
    F: 'text-destructive',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Financial Health Score</CardTitle>
            <CardDescription>Your overall financial wellness</CardDescription>
          </div>
          <div className={`text-4xl font-bold ${gradeColors[healthScore.grade] || 'text-foreground'}`}>
            {healthScore.grade}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-foreground">{healthScore.score}</span>
          <span className="text-sm text-muted-foreground">out of 100</span>
        </div>
        <Progress value={healthScore.score} className="h-3" />
        
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div>
            <div className="text-xs text-muted-foreground">Savings Rate</div>
            <div className="text-sm font-medium">{healthScore.breakdown.savingsRate}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Debt-to-Income</div>
            <div className="text-sm font-medium">{healthScore.breakdown.debtToIncome}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Emergency Fund</div>
            <div className="text-sm font-medium">{healthScore.breakdown.emergencyFund}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Investment Diversity</div>
            <div className="text-sm font-medium">{healthScore.breakdown.investmentDiversity}%</div>
          </div>
        </div>

        <Button className="w-full mt-4" asChild>
          <Link href="/dashboard/recommendations">
            <Sparkles className="w-4 h-4 mr-2" />
            Get AI Recommendations
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  const actions = [
    { label: 'Add Income', href: '/dashboard/income', icon: TrendingUp },
    { label: 'Add Expense', href: '/dashboard/expenses', icon: TrendingDown },
    { label: 'Add Debt', href: '/dashboard/debts', icon: CreditCard },
    { label: 'Set Goal', href: '/dashboard/goals', icon: Target },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Add new financial data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="justify-start gap-2 h-auto py-3"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="w-4 h-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardOverview() {
  const [activeModal, setActiveModal] = useState<'income' | 'expenses' | 'debts' | 'investments' | 'assets' | 'goals' | null>(null);

  const { data: summaryData, isLoading: summaryLoading } = useSWR(
    'financial-summary',
    () => api.getSummary()
  );
  const { data: healthData, isLoading: healthLoading } = useSWR(
    'health-score',
    () => api.getHealthScore()
  );

  // Detail Data Fetching
  const { data: incomeData } = useSWR(activeModal === 'income' ? 'income-list' : null, () => api.getIncome());
  const { data: expenseData } = useSWR(activeModal === 'expenses' ? 'expense-list' : null, () => api.getExpenses());
  const { data: debtData } = useSWR(activeModal === 'debts' ? 'debt-list' : null, () => api.getDebts());
  const { data: investmentData } = useSWR(activeModal === 'investments' ? 'investment-list' : null, () => api.getInvestments());
  const { data: assetData } = useSWR(activeModal === 'assets' ? 'asset-list' : null, () => api.getAssets());
  const { data: goalData } = useSWR(activeModal === 'goals' ? 'goal-list' : null, () => api.getGoals());

  const summary: FinancialSummary = summaryData?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    totalDebts: 0,
    totalInvestments: 0,
    totalAssets: 0,
    netWorth: 0,
    monthlySurplus: 0,
    savingsRate: 0,
  };

  const hasNoData = summary.totalIncome === 0 && summary.totalExpenses === 0 && summary.totalDebts === 0;

  if (!summaryLoading && hasNoData) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center bg-[#000000] border border-white/10 p-8 sm:p-16 relative overflow-hidden group">
          {/* Precision Accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-white/20" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-white/20" />
          
          <div className="space-y-10 z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-white flex items-center justify-center bg-white text-black">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">System Idle</span>
              </div>
              <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter italic leading-[0.8] transition-all duration-1000">
                <span className="text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">Initialize</span> <br /> <span className="text-white">Protocol.</span>
              </h1>
              <p className="text-sm sm:text-base text-white/40 font-medium uppercase tracking-widest leading-relaxed max-w-sm">
                Your command center is offline. Inundate the central matrix with your capital streams to begin AI orchestration.
              </p>
            </div>

            <Button size="lg" className="rounded-none h-16 px-12 bg-white text-black font-black uppercase tracking-[0.3em] text-xs hover:invert transition-all flex items-center gap-4 group/btn shadow-[0_0_50px_rgba(255,255,255,0.1)]" asChild>
              <Link href="/dashboard/income">
                Inundate System
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 pt-8 border-t border-white/10 opacity-20">
              <Sparkles className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-[0.5em]">Neural Engine Awaiting Data Signal</span>
            </div>
          </div>

          <div className="relative aspect-square hidden lg:flex items-center justify-center transition-transform duration-1000">
             <div className="absolute inset-0 bg-white/[0.02] rounded-full blur-[80px]" />
             <div className="relative w-48 h-48 border border-white/10 flex items-center justify-center p-8 transition-colors group-hover:border-white/30">
                 <div className="absolute inset-0 border border-dashed border-white/10 animate-[spin_20s_linear_infinity]" />
                 <div className="absolute inset-4 border border-dashed border-white/20 animate-[spin_15s_linear_infinity_reverse]" />
                 <div className="w-20 h-20 bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                   <Target className="w-10 h-10 text-black" />
                 </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your complete financial overview at a glance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Monthly Income"
              value={formatCurrency(summary.totalIncome)}
              icon={TrendingUp}
              onClick={() => setActiveModal('income')}
              color="accent"
            />
            <StatCard
              title="Monthly Expenses"
              value={formatCurrency(summary.totalExpenses)}
              icon={TrendingDown}
              onClick={() => setActiveModal('expenses')}
              color="destructive"
            />
            <StatCard
              title="Total Debts"
              value={formatCurrency(summary.totalDebts)}
              icon={CreditCard}
              onClick={() => setActiveModal('debts')}
              color="warning"
            />
            <StatCard
              title="Investments"
              value={formatCurrency(summary.totalInvestments)}
              icon={PieChart}
              onClick={() => setActiveModal('investments')}
              color="chart-2"
            />
          </>
        )}
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Assets"
              value={formatCurrency(summary.totalAssets)}
              icon={Building2}
              onClick={() => setActiveModal('assets')}
              color="primary"
            />
            <StatCard
              title="Net Worth"
              value={formatCurrency(summary.netWorth)}
              icon={Wallet}
              onClick={() => setActiveModal('assets')}
              trend={summary.netWorth >= 0 ? 'up' : 'down'}
              trendValue={summary.netWorth >= 0 ? 'Positive' : 'Negative'}
              color="accent"
            />
            <StatCard
              title="Monthly Surplus"
              value={formatCurrency(summary.monthlySurplus)}
              icon={Target}
              onClick={() => setActiveModal('goals')}
              trend={summary.monthlySurplus >= 0 ? 'up' : 'down'}
              trendValue={`${summary.savingsRate.toFixed(1)}% savings rate`}
              color={summary.monthlySurplus >= 0 ? 'accent' : 'destructive'}
            />
            <Link href="/dashboard/recommendations">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-sidebar text-sidebar-foreground h-full">
                <CardContent className="flex flex-col justify-center h-full pt-6">
                  <Sparkles className="w-8 h-8 text-sidebar-primary mb-2" />
                  <div className="font-semibold">AI Insights</div>
                  <div className="text-sm text-sidebar-foreground/80 flex items-center gap-1 mt-1">
                    View recommendations <ArrowRight className="w-3 h-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Health Score and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {healthLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-3 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : healthData?.healthScore ? (
          <HealthScoreCard healthScore={healthData.healthScore} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Financial Health Score</CardTitle>
              <CardDescription>Add financial data to see your score</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Start by adding your income, expenses, debts, and investments to get personalized insights.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard/income">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <QuickActionsCard />
      </div>

      {/* Detail Modals */}
      <AnimatePresence>
        {activeModal && (
          <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
            <DialogContent className="max-w-4xl bg-[#050505] border-white/10 p-0 overflow-hidden shadow-2xl shadow-white/5 border-none bg-transparent">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="bg-[#050505] border border-white/10 rounded-lg overflow-hidden"
              >
                <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between relative">
                  <div>
                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">
                      {activeModal === 'income' && "Revenue Matrix"}
                      {activeModal === 'expenses' && "Capital Velocity"}
                      {activeModal === 'debts' && "Liability Audit"}
                      {activeModal === 'investments' && "Asset Orchestration"}
                      {activeModal === 'assets' && "Wealth Catalog"}
                      {activeModal === 'goals' && "Terminal Objectives"}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mt-1">
                      Detailed Transaction and Asset Mapping
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button size="sm" className="rounded-none bg-white text-black font-black uppercase tracking-widest text-[10px] hover:invert" asChild>
                      <Link href={`/dashboard/${activeModal === 'expenses' ? 'expenses' : activeModal}`}>
                        Configure Protocol
                      </Link>
                    </Button>
                    <DialogClose className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </DialogClose>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                  <Table>
                    <TableHeader className="border-b border-white/10">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/20">Identity</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/20">Magnitude</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/20">Frequency</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/20 text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeModal === 'income' && incomeData?.income.map((item) => (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-bold text-sm text-white italic">{item.source}</TableCell>
                          <TableCell className="font-black text-sm text-emerald-500">{formatCurrency(item.amount)}</TableCell>
                          <TableCell className="text-[10px] font-bold uppercase text-white/40">{item.frequency}</TableCell>
                          <TableCell className="text-right">
                             <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${item.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/20'}`}>
                               {item.isActive ? 'Active' : 'Archived'}
                             </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {activeModal === 'expenses' && expenseData?.expenses.map((item) => (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-bold text-sm text-white italic">{item.description}</TableCell>
                          <TableCell className="font-black text-sm text-rose-500">{formatCurrency(item.amount)}</TableCell>
                          <TableCell className="text-[10px] font-bold uppercase text-white/40">{item.category}</TableCell>
                          <TableCell className="text-right">
                             <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${item.isEssential ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-white/20'}`}>
                               {item.isEssential ? 'Essential' : 'Discretionary'}
                             </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {activeModal === 'debts' && debtData?.debts.map((item) => (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-bold text-sm text-white italic">{item.name}</TableCell>
                          <TableCell className="font-black text-sm text-rose-500">{formatCurrency(item.principal)}</TableCell>
                          <TableCell className="text-[10px] font-bold uppercase text-white/40">{item.interestRate}% APR</TableCell>
                          <TableCell className="text-right">
                             <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-white/5 text-white/40">
                               {item.remainingTenure} Periods Remaining
                             </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {activeModal === 'investments' && investmentData?.investments.map((item) => (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-bold text-sm text-white italic">{item.name}</TableCell>
                          <TableCell className="font-black text-sm text-emerald-500">{formatCurrency(item.currentValue)}</TableCell>
                          <TableCell className="text-[10px] font-bold uppercase text-white/40">{item.type}</TableCell>
                          <TableCell className="text-right">
                             <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500">
                               +{item.expectedReturn}% Yield
                             </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {activeModal === 'assets' && assetData?.assets.map((item) => (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-bold text-sm text-white italic">{item.name}</TableCell>
                          <TableCell className="font-black text-sm text-white">{formatCurrency(item.currentValue)}</TableCell>
                          <TableCell className="text-[10px] font-bold uppercase text-white/40">{assetTypeLabels[item.type] || item.type}</TableCell>
                          <TableCell className="text-right">
                             <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${['cash', 'emergency_fund'].includes(item.type) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-white/40'}`}>
                               {['cash', 'emergency_fund'].includes(item.type) ? 'Liquid' : 'Verified'}
                             </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {activeModal === 'goals' && goalData?.goals.map((item) => (
                        <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-bold text-sm text-white italic">{item.name}</TableCell>
                          <TableCell className="font-black text-sm text-white">{formatCurrency(item.targetAmount)}</TableCell>
                          <TableCell className="text-[10px] font-bold uppercase text-white/40">{item.priority} Priority</TableCell>
                          <TableCell className="text-right">
                             <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-white/5 text-white/40">
                               {Math.round((item.currentAmount / item.targetAmount) * 100)}% Complete
                             </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!activeModal || 
                        (activeModal === 'income' && !incomeData?.income.length) ||
                        (activeModal === 'expenses' && !expenseData?.expenses.length) ||
                        (activeModal === 'debts' && !debtData?.debts.length) ||
                        (activeModal === 'investments' && !investmentData?.investments.length) ||
                        (activeModal === 'assets' && !assetData?.assets.length) ||
                        (activeModal === 'goals' && !goalData?.goals.length)
                      ) && (
                        <TableRow>
                          <TableCell colSpan={4} className="h-40 text-center text-[10px] font-black uppercase tracking-widest text-white/10 italic">
                            Zero Signals Detected in this Coordinate
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-center">
                   <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em] text-white/20">
                      <Sparkles className="w-3 h-3" />
                      Orchestration Complete
                   </div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
