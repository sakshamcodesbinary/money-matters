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
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';
import { api, type FinancialSummary, type HealthScore } from '@/lib/api';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  trend,
  trendValue,
  color = 'primary',
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  href: string;
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
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
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
    </Link>
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
  const { data: summaryData, isLoading: summaryLoading } = useSWR(
    'financial-summary',
    () => api.getSummary()
  );
  const { data: healthData, isLoading: healthLoading } = useSWR(
    'health-score',
    () => api.getHealthScore()
  );

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
              href="/dashboard/income"
              color="accent"
            />
            <StatCard
              title="Monthly Expenses"
              value={formatCurrency(summary.totalExpenses)}
              icon={TrendingDown}
              href="/dashboard/expenses"
              color="destructive"
            />
            <StatCard
              title="Total Debts"
              value={formatCurrency(summary.totalDebts)}
              icon={CreditCard}
              href="/dashboard/debts"
              color="warning"
            />
            <StatCard
              title="Investments"
              value={formatCurrency(summary.totalInvestments)}
              icon={PieChart}
              href="/dashboard/investments"
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
              href="/dashboard/assets"
              color="primary"
            />
            <StatCard
              title="Net Worth"
              value={formatCurrency(summary.netWorth)}
              icon={Wallet}
              href="/dashboard/assets"
              trend={summary.netWorth >= 0 ? 'up' : 'down'}
              trendValue={summary.netWorth >= 0 ? 'Positive' : 'Negative'}
              color="accent"
            />
            <StatCard
              title="Monthly Surplus"
              value={formatCurrency(summary.monthlySurplus)}
              icon={Target}
              href="/dashboard/goals"
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
    </div>
  );
}
