'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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
  LineChart,
  ChevronRight,
  Hexagon
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010204]">
        <div className="animate-pulse text-white flex items-center gap-2 font-mono text-sm tracking-widest">
          <Hexagon className="animate-spin w-4 h-4" />
          <span>INITIALIZING</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010204] text-white selection:bg-white/20 overflow-x-hidden font-sans">
      {/* Background Grid - Very subtle */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#010204]/80 backdrop-blur-xl border-b border-white/5">
        <nav className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 border border-white flex items-center justify-center bg-white text-black">
              <Hexagon className="w-5 h-5" fill="black" />
            </div>
            <span className="font-bold text-xl tracking-tighter uppercase italic">
              Money-Matters
            </span>
          </motion.div>
          
          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-10 text-[11px] uppercase tracking-[0.2em] font-bold text-white/40">
              <Link href="#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="/under-construction" className="hover:text-white transition-colors">Solutions</Link>
              <Link href="/under-construction" className="hover:text-white transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center gap-5">
              {isAuthenticated ? (
                <Button asChild className="rounded-none px-6 bg-white text-black hover:bg-white/90 font-bold uppercase text-[11px] tracking-widest h-10">
                  <Link href="/dashboard">Launch App</Link>
                </Button>
              ) : (
                <>
                  <Link href="/login" className="text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Login</Link>
                  <Button asChild className="rounded-none px-6 bg-white text-black hover:bg-white/90 font-bold uppercase text-[11px] tracking-widest h-10">
                    <Link href="/register">Enter</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1 border border-white/10 text-[10px] font-bold tracking-[0.3em] uppercase mb-8"
          >
            System Status: Operational
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tighter mb-10 leading-[0.8] uppercase"
          >
            Finance <br />
            <span className="text-white/20">Refined.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl text-base sm:text-lg text-white/40 mb-14 font-medium leading-relaxed"
          >
            The essential tool for modern wealth orchestration. 
            All-black intelligence for the monochromatic elite.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <Button size="lg" className="rounded-none h-14 px-10 bg-white text-black font-black uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform" asChild>
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                Open Command Center
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-none h-14 px-10 border-white/10 bg-transparent text-white font-bold uppercase tracking-widest text-sm" asChild>
              <Link href="#features">Documentation</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 sm:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/5 border border-white/5">
            <FeatureCard 
              icon={<TrendingUp className="w-5 h-5" />}
              title="Velocity"
              description="Monitor capital flow with surgical precision through my minimalist analytics core."
              index={0}
            />
            <FeatureCard 
              icon={<Wallet className="w-5 h-5" />}
              title="Identity"
              description="Seamlessly bridge your financial life into a single, encrypted monochromatic vault."
              index={1}
            />
            <FeatureCard 
              icon={<Shield className="w-5 h-5" />}
              title="Sovereignty"
              description="Zero-knowledge principles applied to your private financial orchestration."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-48 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center flex flex-col items-center"
        >
          <h2 className="text-5xl sm:text-7xl font-black mb-12 tracking-tighter uppercase italic">
            Begin the <br className="hidden sm:block" /> Ascension.
          </h2>
          <Button size="lg" className="rounded-none h-16 px-16 bg-white text-black font-black uppercase tracking-[0.2em] text-lg hover:invert transition-all" asChild>
            <Link href="/register">Join the Network</Link>
          </Button>
        </motion.div>
      </section>

      {/* Modern Footer */}
      <footer className="py-16 px-6 sm:px-8 border-t border-white/5 bg-[#010204]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-white flex items-center justify-center bg-white text-black">
              <Hexagon className="w-3.5 h-3.5" fill="black" />
            </div>
            <span className="font-bold text-base tracking-tighter uppercase">Money-Matters</span>
          </div>
          
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            <Link href="#" className="hover:text-white transition-colors">Vision</Link>
            <Link href="/under-construction" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/under-construction" className="hover:text-white transition-colors">Privacy</Link>
          </div>
          
          <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">
            MCXXVI © MM ORG
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, index }: { icon: React.ReactNode, title: string, description: string, index: number }) {
  return (
    <div className="bg-[#010204] p-12 group hover:bg-white hover:text-black transition-colors duration-500">
      <div className="w-10 h-10 border border-white/10 flex items-center justify-center mb-8 group-hover:border-black/10">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 uppercase tracking-tighter italic">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed font-medium group-hover:text-black/60">
        {description}
      </p>
    </div>
  );
}
