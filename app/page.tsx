'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
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
  Hexagon,
  ArrowDown,
  Lock,
  Layers,
  Cpu,
  Brain,
  Zap,
  BarChart3,
  Database
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { scrollYProgress } = useScroll();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010204]">
        <div className="animate-pulse text-white flex items-center gap-2 font-mono text-sm tracking-widest">
          <Hexagon className="animate-spin w-4 h-4" />
          <span>INITIALIZING PROTOCOL</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#000000] text-white selection:bg-white/20 font-sans leading-relaxed overflow-x-hidden">
      {/* Precision Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:30px_30px] sm:bg-[size:50px_50px] pointer-events-none z-0" />

      {/* Institutional Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#000000]/90 backdrop-blur-2xl border-b border-white/5 px-4 sm:px-8">
        <nav className="max-w-7xl mx-auto h-16 sm:h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 sm:gap-3 shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 h-10 border border-white flex items-center justify-center bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Hexagon className="w-5 h-5 sm:w-6 h-6" fill="black" />
            </div>
            <span className="font-black text-lg sm:text-2xl tracking-tighter uppercase italic hidden sm:block">
              Money-Matters
            </span>
          </motion.div>
          
          <div className="flex items-center gap-4 sm:gap-10">
            <div className="hidden lg:flex items-center gap-12 text-[11px] uppercase tracking-[0.3em] font-black text-white/40">
              <Link href="#protocol" className="hover:text-white transition-colors">The Protocol</Link>
              <Link href="#vault" className="hover:text-white transition-colors">The Vault</Link>
              <Link href="/under-construction" className="hover:text-white transition-colors">Capital</Link>
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <Button asChild className="rounded-none px-4 sm:px-8 bg-white text-black hover:bg-white/90 font-black uppercase text-[10px] sm:text-[11px] tracking-[0.2em] h-9 sm:h-11 border-none transition-all hover:scale-105">
                  <Link href="/dashboard">Access Command</Link>
                </Button>
              ) : (
                <div className="flex items-center gap-4 sm:gap-6">
                  <Link href="/login" className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Identify</Link>
                  <Button asChild className="rounded-none px-4 sm:px-8 bg-white text-black hover:bg-white/90 font-black uppercase text-[10px] sm:text-[11px] tracking-[0.2em] h-9 sm:h-11 border-none transition-all hover:scale-105">
                    <Link href="/register">Initialize</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* HERO: The Monolithic Entrance */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 sm:px-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square bg-white/[0.02] rounded-full blur-[100px] sm:blur-[150px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 w-full"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 sm:px-5 sm:py-2 border border-white/10 bg-white/5 text-[8px] sm:text-[10px] font-black tracking-[0.4em] uppercase mb-10 sm:mb-12 italic"
          >
            System Status: Total Control
          </motion.div>

          <h1 className="text-6xl sm:text-[120px] lg:text-[180px] font-black tracking-tighter leading-[0.8] uppercase italic mb-12 sm:mb-16">
            Wealth <br />
            <span className="text-white/10 decoration-white/5 underline underline-offset-[10px] sm:underline-offset-[20px]">Defined.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-white/40 mb-12 sm:mb-20 font-medium leading-relaxed uppercase tracking-wide px-4">
            The institutional-grade interface for ultra-high-precision capital management. 
            No noise. Just data.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center items-center px-4">
            <Button size="lg" className="w-full sm:w-auto rounded-none h-14 sm:h-16 px-10 sm:px-16 bg-white text-black font-black uppercase tracking-[0.2em] text-xs sm:text-sm hover:invert transition-all" asChild>
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                Open Command Center
              </Link>
            </Button>
            <motion.div 
               animate={{ y: [0, 10, 0] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="text-white/20 flex flex-col items-center gap-3 cursor-pointer"
               onClick={() => document.getElementById('protocol')?.scrollIntoView({ behavior: 'smooth' })}
            >
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em]">Scroll Protocol</span>
                <ArrowDown className="w-4 h-4 sm:w-5 h-5" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CHRONOLOGICAL JOURNEY: The Financial Protocol */}
      <section id="protocol" className="relative py-32 sm:py-60 px-6 sm:px-8 border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-32 sm:space-y-60">
          
          {/* 01 & 02: INCOME & EXPENSES */}
          <div className="grid lg:grid-cols-2 gap-20 sm:gap-32 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8 sm:space-y-10"
            >
              <div className="flex items-center gap-4 text-white/20">
                  <Layers className="w-8 h-8 sm:w-10 h-10" />
                  <div className="h-[1px] w-24 sm:w-40 bg-white/10" />
              </div>
              <h2 className="text-5xl sm:text-8xl font-black tracking-tighter uppercase italic leading-none">
                Income <br /> <span className="text-white/20">& Expenses.</span>
              </h2>
              <p className="text-base sm:text-lg text-white/50 max-w-lg font-medium leading-relaxed uppercase">
                The core of your flow. First, inundate the system with your income streams. Then, map every expense to understand the velocity of your capital.
              </p>
              <div className="grid grid-cols-2 gap-8 sm:gap-10 pt-8 sm:pt-10 border-t border-white/5">
                  <div>
                      <span className="block text-3xl sm:text-4xl font-black text-white mb-2">01.</span>
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">Salary Inundation</span>
                  </div>
                  <div>
                      <span className="block text-3xl sm:text-4xl font-black text-white mb-2">02.</span>
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">Expense Mapping</span>
                  </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-square bg-white/[0.02] border border-white/10 flex items-center justify-center relative p-10 sm:p-20"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
              <div className="relative text-center space-y-6 sm:space-y-8 w-full">
                  <div className="w-16 h-16 sm:w-24 h-24 border-2 border-white mx-auto flex items-center justify-center animate-pulse">
                      <Hexagon className="w-8 h-8 sm:w-12 h-12" />
                  </div>
                  <div className="h-2 sm:h-4 w-3/4 max-w-[240px] bg-white/10 mx-auto rounded-full overflow-hidden">
                      <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: "100%" }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-full bg-white" 
                      />
                  </div>
                  <span className="block text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-white/20">Analyzing Flow Dynamics</span>
              </div>
            </motion.div>
          </div>

          {/* 03 & 04: DEBTS & INVESTMENTS */}
          <div className="grid lg:grid-cols-2 gap-20 sm:gap-32 items-center">
              <motion.div
                  initial={{ opacity: 0, order: 2 }}
                  whileInView={{ opacity: 1, order: 2 }}
                  viewport={{ once: true }}
                  className="aspect-video bg-white text-black p-8 sm:p-12 flex flex-col justify-between"
              >
                  <div>
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] mb-6 sm:mb-8 block">Liquidation Protocol</span>
                      <h4 className="text-3xl sm:text-4xl font-black tracking-tight uppercase italic leading-none mb-4 sm:mb-6">Debt <br /> Terminal.</h4>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between border-b border-black/10 py-2">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase">EMIs Normalized</span>
                          <span className="text-[8px] sm:text-[9px] font-black uppercase">Active</span>
                      </div>
                      <div className="flex justify-between border-b border-black/10 py-2">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase">Investment Alpha</span>
                          <span className="text-[8px] sm:text-[9px] font-black uppercase">Scaling</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                      <Cpu className="w-5 h-5 sm:w-6 h-6 animate-spin" />
                      <span className="text-[8px] sm:text-[10px] font-black">AI OPTIMIZATION READY</span>
                  </div>
              </motion.div>

              <motion.div
                  initial={{ opacity: 0, x: 50, order: 1 }}
                  whileInView={{ opacity: 1, x: 0, order: 1 }}
                  viewport={{ once: true }}
                  className="space-y-8 sm:space-y-10"
              >
                  <div className="flex items-center gap-4 text-white/20">
                      <Lock className="w-8 h-8 sm:w-10 h-10" />
                      <div className="h-[1px] w-24 sm:w-40 bg-white/10" />
                  </div>
                  <h2 className="text-5xl sm:text-8xl font-black tracking-tighter uppercase italic leading-none">
                      Debts <br /> <span className="text-white/20">& Growth.</span>
                  </h2>
                  <p className="text-base sm:text-lg text-white/50 max-w-lg font-medium leading-relaxed uppercase">
                      Liabilities are constraints; Investments are accelerators. We neutralize your debts through strategic liquidation while simultaneously plotting your growth through diversified investment tracking.
                  </p>
                  <div className="grid grid-cols-2 gap-8 sm:gap-10 pt-8 sm:pt-10 border-t border-white/5">
                      <div>
                          <span className="block text-3xl sm:text-4xl font-black text-white mb-2">03.</span>
                          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">Debt Liquidation</span>
                      </div>
                      <div>
                          <span className="block text-3xl sm:text-4xl font-black text-white mb-2">04.</span>
                          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">Investment Scaling</span>
                      </div>
                  </div>
              </motion.div>
          </div>

          {/* 05 & 06: ASSETS & GOALS (Animated Orchestration) */}
          <div className="grid lg:grid-cols-2 gap-20 sm:gap-32 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8 sm:space-y-10"
            >
              <div className="flex items-center gap-4 text-white/20">
                  <Target className="w-8 h-8 sm:w-10 h-10" />
                  <div className="h-[1px] w-24 sm:w-40 bg-white/10" />
              </div>
              <h2 className="text-5xl sm:text-8xl font-black tracking-tighter uppercase italic leading-none">
                Assets <br /> <span className="text-white/20">& Ambition.</span>
              </h2>
              <p className="text-base sm:text-lg text-white/50 max-w-lg font-medium leading-relaxed uppercase">
                The final phase. Catalog your tangible and intangible assets to calculate your true Net Worth. Then, set your goals and let our AI calculate the shortest distance between your current state and your destination.
              </p>
              <div className="grid grid-cols-2 gap-8 sm:gap-10 pt-8 sm:pt-10 border-t border-white/5">
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                      <span className="block text-3xl sm:text-4xl font-black text-white mb-2">05.</span>
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">Asset Cataloging</span>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
                      <span className="block text-3xl sm:text-4xl font-black text-white mb-2">06.</span>
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">Goal Optimization</span>
                  </motion.div>
              </div>
            </motion.div>

            {/* HIGH-IMPACT MOTION CORE: Net Worth Pulse */}
            <div className="relative aspect-square flex items-center justify-center p-12 sm:p-20 group overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.01] border border-white/10" />
                
                {/* Orbital Rings - React to Scroll */}
                <motion.div 
                    style={{ rotate: scrollYProgress }}
                    className="absolute w-[80%] h-[80%] border border-dashed border-white/10 rounded-full" 
                />
                <motion.div 
                    style={{ rotate: scrollYProgress, scale: 1.2 }}
                    className="absolute w-[60%] h-[60%] border border-dashed border-white/20 rounded-full" 
                />
                
                {/* Glowing Pulsing Core */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center space-y-8"
                >
                    <div className="relative">
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-0 bg-white blur-[40px] rounded-full"
                        />
                        <div className="relative w-20 h-20 sm:w-28 h-28 bg-white text-black flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                            <Sparkles className="w-10 h-10 sm:w-14 h-14" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <motion.h4 
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="text-2xl sm:text-4xl font-black uppercase tracking-tighter italic leading-none"
                        >
                            Net Worth <br /> Orchestration.
                        </motion.h4>
                        <div className="flex items-center justify-center gap-3">
                            <span className="h-[1px] w-12 bg-white/20" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Active Final Protocol</span>
                            <span className="h-[1px] w-12 bg-white/20" />
                        </div>
                    </div>

                    {/* Dynamic Data Stream */}
                    <div className="grid grid-cols-3 gap-4 w-full pt-8">
                        {[...Array(3)].map((_, i) => (
                            <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                whileInView={{ height: "40px" }}
                                transition={{ delay: i * 0.2, duration: 1 }}
                                className="w-full bg-white/5 border border-white/10 flex items-center justify-center"
                            >
                                <div className="w-1 h-1 bg-white animate-ping" />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/40" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/40" />
            </div>
          </div>

          {/* 07: THE INTELLIGENCE HUB (AI INSIGHTS) */}
          <div className="pt-32 sm:pt-60 border-t border-white/5">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-24 sm:mb-40"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 border border-white/10 bg-white/5 text-[9px] sm:text-[10px] font-black tracking-[0.4em] uppercase mb-10 italic">
                <Cpu className="w-4 h-4 animate-pulse" />
                Neural Core v3.1 Engine
              </div>
              <h2 className="text-6xl sm:text-9xl font-black tracking-tighter uppercase italic leading-[0.8] mb-12">
                Predictive <br /> <span className="text-white/20">Intelligence.</span>
              </h2>
              <p className="max-w-3xl mx-auto text-base sm:text-lg text-white/40 font-medium uppercase tracking-widest leading-relaxed px-4">
                Architecture built specifically for capital orchestration.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-10 sm:gap-20">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-10 sm:p-16 border border-white/10 bg-[#050505] space-y-8 group hover:bg-white hover:text-black transition-all duration-700"
              >
                <div className="w-12 h-12 border border-white/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">The Custom <br /> Advantage.</h3>
                <p className="text-sm sm:text-base font-medium opacity-40 group-hover:opacity-70 leading-relaxed uppercase">
                  Generic LLMs are jacks-of-all-trades, masters of none. We utilize a <span className="text-white group-hover:text-black font-black underline decoration-white/20">Custom Trained Financial Advisory Model</span>, specifically calibrated for debt-equity ratios, tax-saving maneuvers, and long-term wealth compounding.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-10 sm:p-16 border border-white/10 bg-[#050505] space-y-8 group hover:bg-white hover:text-black transition-all duration-700"
              >
                <div className="w-12 h-12 border border-white/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Gemini <br /> Enhancement.</h3>
                <p className="text-sm sm:text-base font-medium opacity-40 group-hover:opacity-70 leading-relaxed uppercase">
                  Our model is <span className="text-white group-hover:text-black font-black underline decoration-white/20">Feature Engineered with the Gemini API</span>, providing multi-modal reasoning over your financial documents and real-time market sentiment analysis. We don't just chat about money; we orchestrate its growth.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2 p-10 sm:p-16 border border-white/10 bg-white text-black space-y-10"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-10">
                  <div className="space-y-6 max-w-xl text-center sm:text-left">
                    <h3 className="text-4xl font-black uppercase italic tracking-tighter">Precision Over Gaps.</h3>
                    <p className="text-sm sm:text-base font-medium opacity-60 uppercase leading-relaxed">
                      Standard GPTs often "hallucinate" financial advice or miss the structural nuances of tax laws and debt liquidation math. Money-Matters eliminates this variance through high-fidelity data mapping and institutional-grade logic.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="p-4 border border-black/10 text-center w-32">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Accuracy</span>
                    </div>
                    <div className="p-4 border border-black/10 text-center w-32">
                        <Database className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Real-Time</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA: Final Conversion */}
      <section className="py-40 sm:py-64 flex items-center justify-center relative overflow-hidden px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] aspect-square bg-white/[0.05] rounded-full blur-[100px] sm:blur-[120px]" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center z-10 w-full"
        >
          <h2 className="text-5xl sm:text-7xl lg:text-9xl font-black mb-12 sm:mb-16 tracking-tighter uppercase italic leading-[0.8] text-center">
            Assume <br /> Sovereignty.
          </h2>
          <Button size="lg" className="w-full sm:w-auto rounded-none h-16 sm:h-20 px-10 sm:px-20 bg-white text-black font-black uppercase tracking-[0.3em] text-lg sm:text-xl hover:invert transition-all hover:scale-110 shadow-[0_0_50px_rgba(255,255,255,0.2)]" asChild>
            <Link href="/register">Initialize Access</Link>
          </Button>
        </motion.div>
      </section>

      {/* Institutional Footer */}
      <footer className="py-16 sm:py-24 px-6 sm:px-8 border-t border-white/5 bg-[#000000]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 sm:gap-16">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 sm:w-8 h-8 border border-white flex items-center justify-center bg-white text-black">
              <Hexagon className="w-4 h-4 sm:w-5 h-5" fill="black" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tighter uppercase italic">Money-Matters</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/30">
            <Link href="#" className="hover:text-white transition-colors">Infrastructure</Link>
            <Link href="/under-construction" className="hover:text-white transition-colors">Legal</Link>
            <Link href="/under-construction" className="hover:text-white transition-colors">Privacy</Link>
          </div>
          
          <p className="text-[9px] sm:text-[10px] font-black text-white/10 uppercase tracking-[0.3em] sm:tracking-[0.4em]">
            Institutional Control v2.6.0
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, index }: { icon: React.ReactNode, title: string, description: string, index: number }) {
  return (
    <div className="bg-[#000000] p-16 group hover:bg-white hover:text-black transition-all duration-700 border border-transparent hover:border-black cursor-crosshair">
      <div className="w-12 h-12 border border-white/10 flex items-center justify-center mb-10 group-hover:border-black/20 group-hover:bg-black group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter italic">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed font-medium group-hover:text-black/60 uppercase tracking-wide">
        {description}
      </p>
    </div>
  );
}
