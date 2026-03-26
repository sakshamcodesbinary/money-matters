'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sparkles,
  Heart,
  CreditCard,
  PieChart,
  Wallet,
  Target,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lightbulb,
} from 'lucide-react';
import { api, type FinancialRoadmap } from '@/lib/api';
import { toast } from 'sonner';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function HealthScoreSection({ roadmap }: { roadmap: FinancialRoadmap }) {
  const { healthScore } = roadmap;
  const gradeColors: Record<string, string> = {
    A: 'bg-accent text-accent-foreground',
    B: 'bg-chart-1 text-white',
    C: 'bg-warning text-warning-foreground',
    D: 'bg-destructive text-destructive-foreground',
    F: 'bg-destructive text-destructive-foreground',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-destructive" />
          <CardTitle>Financial Health Score</CardTitle>
        </div>
        <CardDescription>Your overall financial wellness assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${gradeColors[healthScore.grade] || 'bg-muted'}`}>
            {healthScore.grade}
          </div>
          <div>
            <div className="text-4xl font-bold text-foreground">{healthScore.score}</div>
            <div className="text-muted-foreground">out of 100</div>
          </div>
        </div>

        <Progress value={healthScore.score} className="h-4" />

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-secondary">
            <div className="text-xs text-muted-foreground">Savings Rate</div>
            <div className="text-lg font-semibold">{healthScore.breakdown.savingsRate}%</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <div className="text-xs text-muted-foreground">Debt-to-Income</div>
            <div className="text-lg font-semibold">{healthScore.breakdown.debtToIncome}%</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <div className="text-xs text-muted-foreground">Emergency Fund</div>
            <div className="text-lg font-semibold">{healthScore.breakdown.emergencyFund}%</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <div className="text-xs text-muted-foreground">Investment Diversity</div>
            <div className="text-lg font-semibold">{healthScore.breakdown.investmentDiversity}%</div>
          </div>
        </div>

        {healthScore.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Key Recommendations</h4>
            <ul className="space-y-2">
              {healthScore.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DebtStrategySection({ roadmap }: { roadmap: FinancialRoadmap }) {
  const { debtStrategy } = roadmap;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-warning" />
          <CardTitle>Debt Payoff Strategy</CardTitle>
        </div>
        <CardDescription>
          {debtStrategy.strategy} - Prioritizing high-interest debts first
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {debtStrategy.prioritizedDebts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <div className="text-sm text-muted-foreground">Interest Saved</div>
                <div className="text-2xl font-bold text-accent">
                  {formatCurrency(debtStrategy.totalInterestSaved)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-sm text-muted-foreground">Debt-Free By</div>
                <div className="text-2xl font-bold text-primary">
                  {new Date(debtStrategy.debtFreeDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Payoff Priority Order</h4>
              {debtStrategy.prioritizedDebts.map((debt, i) => (
                <div key={debt.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{debt.name}</div>
                    <div className="text-sm text-muted-foreground">{debt.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-foreground">
                      {formatCurrency(debt.suggestedPayment)}/mo
                    </div>
                    <div className="text-xs text-muted-foreground">Suggested</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
            <h4 className="font-medium text-foreground">You are debt free!</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Great job! Focus on building your investments and emergency fund.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InvestmentSection({ roadmap }: { roadmap: FinancialRoadmap }) {
  const { investmentRecommendation } = roadmap;

  const colorMap: Record<string, string> = {
    equity: 'bg-chart-1',
    debt: 'bg-chart-2',
    gold: 'bg-chart-3',
    cash: 'bg-chart-5',
    real_estate: 'bg-chart-4',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-chart-2" />
          <CardTitle>Investment Recommendation</CardTitle>
        </div>
        <CardDescription>
          Based on your risk profile: {investmentRecommendation.riskProfile}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Suggested Allocation</h4>
          {Object.entries(investmentRecommendation.suggestedAllocation).map(([type, allocation]) => (
            <div key={type} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${colorMap[type] || 'bg-muted'}`} />
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-foreground">{type.replace('_', ' ')}</span>
                  <span className="font-medium">{allocation}%</span>
                </div>
                <Progress value={allocation} className="h-2 mt-1" />
              </div>
            </div>
          ))}
        </div>

        {investmentRecommendation.recommendations.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="recommendations">
              <AccordionTrigger>Detailed Recommendations</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {investmentRecommendation.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-foreground capitalize">
                          {rec.type.replace('_', ' ')}
                        </span>
                        <Badge variant="outline">{rec.allocation}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

function BudgetSection({ roadmap }: { roadmap: FinancialRoadmap }) {
  const { budgetRecommendation } = roadmap;
  const totalSavings = budgetRecommendation.savingsOpportunities.reduce(
    (sum, opp) => sum + opp.potentialSavings, 0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <CardTitle>Budget Optimization</CardTitle>
        </div>
        <CardDescription>
          Potential monthly savings: {formatCurrency(totalSavings)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {budgetRecommendation.savingsOpportunities.length > 0 ? (
          <div className="space-y-4">
            {budgetRecommendation.savingsOpportunities.map((opp, i) => (
              <div key={i} className="p-4 rounded-lg border border-border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-foreground">{opp.category}</div>
                    <div className="text-sm text-muted-foreground">
                      Current: {formatCurrency(opp.currentSpend)}/mo
                    </div>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">
                    Save {formatCurrency(opp.potentialSavings)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Suggested:</span>
                  <span className="font-medium text-foreground">{formatCurrency(opp.suggestedSpend)}/mo</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-accent">-{((opp.potentialSavings / opp.currentSpend) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
            <h4 className="font-medium text-foreground">Budget looks great!</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Your spending is well-optimized. Keep up the good work!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GoalsSection({ roadmap }: { roadmap: FinancialRoadmap }) {
  const { goalAnalysis } = roadmap;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          <CardTitle>Goal Progress Analysis</CardTitle>
        </div>
        <CardDescription>
          Overall progress: {goalAnalysis.overallProgress.toFixed(1)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        {goalAnalysis.goals.length > 0 ? (
          <div className="space-y-4">
            {goalAnalysis.goals.map((goal) => (
              <div key={goal.id} className="p-4 rounded-lg border border-border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-foreground">{goal.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Est. completion: {new Date(goal.estimatedCompletion).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <Badge variant={goal.onTrack ? 'default' : 'destructive'}>
                    {goal.onTrack ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        On Track
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Behind
                      </>
                    )}
                  </Badge>
                </div>
                <Progress value={goal.progress} className="h-2 mb-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{goal.progress.toFixed(1)}% complete</span>
                  <span className="text-foreground font-medium">
                    Need {formatCurrency(goal.monthlyRequired)}/mo
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium text-foreground">No goals set yet</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Add financial goals to get personalized progress analysis.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionPlanSection({ roadmap }: { roadmap: FinancialRoadmap }) {
  return (
    <Card className="bg-sidebar text-sidebar-foreground">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sidebar-primary" />
          <CardTitle>Your Action Plan</CardTitle>
        </div>
        <CardDescription className="text-sidebar-foreground/70">
          Prioritized steps to improve your finances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {roadmap.actionPlan.length > 0 ? (
          <div className="space-y-3">
            {roadmap.actionPlan.map((action, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg bg-sidebar-accent">
                <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shrink-0">
                  {action.priority}
                </div>
                <div>
                  <div className="font-medium text-sidebar-foreground">{action.action}</div>
                  <div className="text-sm text-sidebar-foreground/70 mt-1">
                    Impact: {action.impact}
                  </div>
                  <Badge variant="outline" className="mt-2 border-sidebar-border text-sidebar-foreground/70">
                    <Clock className="w-3 h-3 mr-1" />
                    {action.timeframe}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sidebar-foreground/70">
            Add more financial data to get personalized action items.
          </p>
        )}

        {roadmap.motivationalMessage && (
          <div className="p-4 rounded-lg bg-sidebar-primary/10 border border-sidebar-primary/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-sidebar-primary shrink-0 mt-0.5" />
              <p className="text-sidebar-foreground italic">{roadmap.motivationalMessage}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RecommendationsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? 'roadmap' : null,
    () => api.getFullRoadmap(),
    { 
      revalidateOnFocus: false,
      shouldRetryOnError: false 
    }
  );

  const handleRefresh = async () => {
    setIsGenerating(true);
    setShouldFetch(true);
    try {
      await mutate();
      toast.success('Recommendations updated!');
    } catch {
      toast.error('Failed to update recommendations');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Recommendations</h1>
            <p className="text-muted-foreground mt-1">Generating your personalized insights...</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Handle both the initial state (shouldFetch is false) and the case where no data is returned
  if (!shouldFetch || error || !data?.roadmap) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Recommendations</h1>
            <p className="text-muted-foreground mt-1 text-premium">Get personalized financial insights</p>
          </div>
        </div>
        <Card className="p-12 text-center border-none shadow-premium bg-gradient-to-br from-card to-secondary/30 backdrop-blur-xl">
          <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4">Your Financial Roadmap Awaits</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Click the button below to analyze your data and generate a comprehensive, AI-powered financial plan.
          </p>
          <Button 
            onClick={handleRefresh} 
            disabled={isGenerating} 
            size="lg"
            className="rounded-xl px-8 font-semibold shadow-premium-hover transition-all duration-300 transform hover:scale-105"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Roadmap
              </>
            )}
          </Button>
          {error && (
            <p className="text-destructive mt-4 text-sm font-medium">
              We encountered a slight delay. Please try again in a moment.
            </p>
          )}
        </Card>
      </div>
    );
  }

  const roadmap = data.roadmap;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            Personalized insights based on your financial data
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isGenerating} variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          {isGenerating ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Action Plan Card */}
      <ActionPlanSection roadmap={roadmap} />

      {/* Tabs for different sections */}
      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="debt">Debt</TabsTrigger>
          <TabsTrigger value="invest">Invest</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <HealthScoreSection roadmap={roadmap} />
        </TabsContent>

        <TabsContent value="debt">
          <DebtStrategySection roadmap={roadmap} />
        </TabsContent>

        <TabsContent value="invest">
          <InvestmentSection roadmap={roadmap} />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetSection roadmap={roadmap} />
        </TabsContent>

        <TabsContent value="goals">
          <GoalsSection roadmap={roadmap} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
