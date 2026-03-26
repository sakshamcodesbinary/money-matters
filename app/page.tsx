'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Shield, 
  Target, 
  Sparkles, 
  ArrowRight,
  PieChart,
  Wallet,
  LineChart
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">WealthWise</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance">
              Finance without the complexity.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl text-pretty">
              Take control of your financial future with AI-powered insights. 
              Track everything, understand your money, and build lasting wealth.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                  {isAuthenticated ? "Go to Dashboard" : "Start for Free"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">$2.5B</div>
              <div className="text-sm text-muted-foreground mt-1">Assets Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">98%</div>
              <div className="text-sm text-muted-foreground mt-1">User Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything you need to manage your finances
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to help you understand, track, and grow your wealth.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-card-foreground">Income Tracking</h3>
                <p className="mt-2 text-muted-foreground">
                  Track all your income sources in one place. Salary, freelance, investments - see where your money comes from.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-semibold text-lg text-card-foreground">Expense Management</h3>
                <p className="mt-2 text-muted-foreground">
                  Categorize and monitor your spending. Identify where you can save and optimize your budget.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-semibold text-lg text-card-foreground">Debt Strategy</h3>
                <p className="mt-2 text-muted-foreground">
                  Smart debt avalanche strategy to pay off high-interest debts first and save thousands in interest.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                  <PieChart className="w-6 h-6 text-chart-2" />
                </div>
                <h3 className="font-semibold text-lg text-card-foreground">Investment Tracking</h3>
                <p className="mt-2 text-muted-foreground">
                  Monitor your portfolio across stocks, mutual funds, FDs, crypto, and more. Track gains and losses.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg text-card-foreground">Goal Planning</h3>
                <p className="mt-2 text-muted-foreground">
                  Set financial goals and track your progress. Emergency fund, retirement, education - plan for it all.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-card-foreground">AI Recommendations</h3>
                <p className="mt-2 text-muted-foreground">
                  Get personalized advice based on your financial data. Budget optimization, investment allocation, and more.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-sidebar text-sidebar-foreground">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm mb-6">
            <LineChart className="w-4 h-4" />
            <span>Start your financial journey today</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-balance">
            Ready to take control of your finances?
          </h2>
          <p className="mt-4 text-sidebar-foreground/80 max-w-xl mx-auto">
            Join thousands of users who have transformed their financial lives with WealthWise.
          </p>
          <div className="mt-8">
            <Button size="lg" variant="secondary" className="gap-2" asChild>
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">WealthWise</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with care for your financial freedom.
          </p>
        </div>
      </footer>
    </div>
  );
}
