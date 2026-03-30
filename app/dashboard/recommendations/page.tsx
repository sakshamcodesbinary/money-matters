'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, Target, ShieldAlert, ArrowUpRight, Clock, Zap, History } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const loadingMessages = [
  "Initializing Cognitive Engine...",
  "Running Debt Trap Parameters...",
  "Auditing 50/30/20 Efficiency...",
  "Calculating Emergency Fund Buffers...",
  "Formulating Age-Adjusted Investment Vectors...",
  "Running 20-Year Corpus Projections...",
  "Finalizing Terminal Directives..."
];

function LoadingMatrix() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-white/50">
      <Activity className="w-8 h-8 animate-pulse mb-6 text-emerald-500" />
      <div className="h-6 overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-[10px] uppercase tracking-widest font-black text-emerald-400/80"
          >
            {loadingMessages[step]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Fetch only when triggered
  const { data, error, isLoading, mutate } = useSWR(
    hasStarted ? 'roadmap' : null,
    () => api.getFullRoadmap(false),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const handleForceRefresh = async () => {
    setIsGenerating(true);
    setHasStarted(true);
    try {
      const freshData = await api.getFullRoadmap(true);
      await mutate(freshData, { revalidate: false });
      if (freshData.rateLimited) {
        toast.error(`Rate limited. Try again in ${freshData.retryAfter}s`);
      } else {
        toast.success('Matrix synced with new terminal directives.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync matrix.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInitialGenerate = () => {
    setHasStarted(true);
  };

  // If we're forcing a sync via the API directly, or SWR is naturally loading, wrap the UI in our loading matrix element.
  if (isGenerating || (hasStarted && isLoading && !data) || (hasStarted && !data && !error)) {
    return <LoadingMatrix />;
  }

  // If we haven't started, or there's an error, or the backend returned fake/fallback info due to AI limits
  if (!hasStarted || error || !data?.roadmap || data?.isFallback) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center group">
          <button
            onClick={error || data?.isFallback ? handleForceRefresh : handleInitialGenerate}
            disabled={isGenerating}
            className="w-32 h-32 bg-[#050505] border border-white/10 mx-auto rounded-full flex items-center justify-center mb-8 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-500 group-disabled:opacity-50"
          >
            <Sparkles className={`w-8 h-8 text-white/20 group-hover:text-emerald-500 transition-colors ${isGenerating ? 'animate-pulse text-emerald-500' : ''}`} />
          </button>
          <h2 className="text-3xl font-black italic tracking-tighter text-white mb-2 uppercase">Intelligence Offline</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-8 max-w-sm mx-auto">
            {error ? "Connection failed. Click to retry." : 
             data?.isFallback ? "AI Quota Exhausted. Click to force retry." : 
             "Click to initialize the cognitive engine and generate your terminal directives."}
          </p>
        </div>
      </div>
    );
  }

  const { roadmap, fromCache, generatedAt } = data;
  const { 
    healthScore, debtStrategy, investmentRecommendation, budgetRecommendation, 
    goalAnalysis, actionPlan, netWorthTrajectory, motivationalMessage,
    debtTrapStatus, emergencyFundStatus, longTermProjections
  } = roadmap;

  // Prepare chart data
  const chartData = [
    { year: 'Current', Baseline: netWorthTrajectory.current, Optimized: netWorthTrajectory.current },
    { year: 'Year 1', Baseline: netWorthTrajectory.current + (netWorthTrajectory.in5YearsIfNoChange - netWorthTrajectory.current) * 0.2, Optimized: netWorthTrajectory.current + (netWorthTrajectory.in5YearsIfFollowed - netWorthTrajectory.current) * 0.2 },
    { year: 'Year 2', Baseline: netWorthTrajectory.current + (netWorthTrajectory.in5YearsIfNoChange - netWorthTrajectory.current) * 0.4, Optimized: netWorthTrajectory.current + (netWorthTrajectory.in5YearsIfFollowed - netWorthTrajectory.current) * 0.4 },
    { year: 'Year 3', Baseline: netWorthTrajectory.current + (netWorthTrajectory.in5YearsIfNoChange - netWorthTrajectory.current) * 0.6, Optimized: netWorthTrajectory.current + (netWorthTrajectory.in5YearsIfFollowed - netWorthTrajectory.current) * 0.6 },
    { year: 'Year 4', Baseline: netWorthTrajectory.current + (netWorthTrajectory.in5YearsIfNoChange - netWorthTrajectory.current) * 0.8, Optimized: netWorthTrajectory.current + (netWorthTrajectory.in5YearsIfFollowed - netWorthTrajectory.current) * 0.8 },
    { year: 'Year 5', Baseline: netWorthTrajectory.in5YearsIfNoChange, Optimized: netWorthTrajectory.in5YearsIfFollowed },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Cache Indicator */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Cognitive Engine</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Terminal Directives Protocol</span>
            {fromCache ? (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 text-[8px] tracking-widest uppercase rounded-none px-2 py-0.5">
                <History className="w-3 h-3 mr-1 inline-block" /> Cached {new Date(generatedAt || Date.now()).toLocaleTimeString()}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5 text-[8px] tracking-widest uppercase rounded-none px-2 py-0.5">
                <Zap className="w-3 h-3 mr-1 inline-block animate-pulse" /> Live Generation
              </Badge>
            )}
          </div>
        </div>
        <button
          onClick={handleForceRefresh}
          disabled={isGenerating}
          className="bg-white text-black font-black uppercase tracking-widest text-[10px] px-6 py-3 hover:invert transition-all disabled:opacity-50 disabled:hover:invert-0 flex items-center gap-2"
        >
          {isGenerating ? <Activity className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Force Sync Matrix
        </button>
      </div>

      {/* Intro Quote */}
      <div className="border-l-4 border-emerald-500 bg-[#050505] p-6 text-white/70 italic text-sm tracking-wide">
        "{motivationalMessage}"
      </div>

      {/* Top Grid: Health Score & Net Worth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trajectory Heatmap (Chart) */}
        <div className="lg:col-span-2 border border-white/10 bg-[#050505] p-6 relative flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">5-Year Wealth Vector</h3>
              <p className="text-2xl font-black italic tracking-tighter text-white">
                Trajectory Analysis
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 block mb-1">Optimized Delta</span>
              <span className="text-xl font-black text-white italic">
                +{formatCurrency(netWorthTrajectory.in5YearsIfFollowed - netWorthTrajectory.in5YearsIfNoChange)}
              </span>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[250px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="optColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="baseColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#525252" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#525252" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="year" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#ffffff40" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `₹${(val/100000).toFixed(0)}L`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, textTransform: 'uppercase', fontSize: '10px', fontWeight: 900, letterSpacing: '1px' }}
                  itemStyle={{ fontStyle: 'italic' }}
                  formatter={(val: number) => [formatCurrency(val), '']}
                />
                <Area type="monotone" dataKey="Baseline" stroke="#525252" strokeWidth={2} fillOpacity={1} fill="url(#baseColor)" />
                <Area type="monotone" dataKey="Optimized" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#optColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Matrix */}
        <div className="border border-white/10 bg-[#050505] p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">System Integrity</h3>
            <div className="flex items-end gap-3 mb-6">
              <span className={`text-6xl font-black italic tracking-tighter leading-none ${healthScore.score >= 80 ? 'text-emerald-500' : healthScore.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                {healthScore.grade}
              </span>
              <span className="text-2xl font-black text-white/50 tracking-tighter mb-1">[{healthScore.score}/100]</span>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Savings Velocity', val: healthScore.breakdown.savingsRate },
                { label: 'Debt Load', val: healthScore.breakdown.debtToIncome },
                { label: 'Defense Grid', val: healthScore.breakdown.emergencyFund },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                    <span>{m.label}</span>
                    <span className="text-white">{m.val.toFixed(0)}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(100, m.val)}%` }} 
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-white/30"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-3 border-b border-white/5 pb-2">Critical Faults</h4>
            <ul className="space-y-2">
              {healthScore.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-xs text-white/60 items-start">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500/80 shrink-0 mt-0.5" />
                  <span className="leading-snug">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Protocol (The Steps) */}
      <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mt-12 mb-4">Execution Protocol</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {actionPlan.map((action, i) => (
          <div key={i} className="border border-white/10 bg-[#050505] p-5 relative group hover:border-emerald-500/30 transition-colors">
            <span className="absolute top-4 right-4 text-[40px] font-black italic text-white/5 group-hover:text-emerald-500/10 transition-colors">0{action.priority}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 block mb-3">{action.timeframe}</span>
            <p className="text-sm font-medium text-white mb-4 pr-6 leading-relaxed bg-transparent relative z-10">{action.action}</p>
            <div className="flex items-center gap-2 mt-auto text-[9px] font-black uppercase tracking-widest text-white/40">
              <ArrowUpRight className="w-3 h-3" /> {action.impact}
            </div>
          </div>
        ))}
      </div>

      {/* Second Row: Critical Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Debt Trap Analysis */}
        {debtTrapStatus && (
          <div className={`border p-6 relative ${debtTrapStatus.inTrap ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-[#050505]'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className={`w-5 h-5 ${debtTrapStatus.inTrap ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Debt Trap Diagnostics</h3>
              </div>
              <span className={`text-[10px] uppercase font-black tracking-[0.2em] px-2 py-1 ${debtTrapStatus.inTrap ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                {debtTrapStatus.inTrap ? 'CRITICAL RISK' : 'CLEAR'}
              </span>
            </div>
            
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">EMI / Income Ratio</span>
              <span className="text-xl font-black italic text-white">{Math.round(debtTrapStatus.emiIncomeRatioPct)}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 mb-6">
              <div className={`h-full ${debtTrapStatus.emiIncomeRatioPct > 40 ? 'bg-red-500' : debtTrapStatus.emiIncomeRatioPct > 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, debtTrapStatus.emiIncomeRatioPct)}%` }} />
            </div>

            {debtTrapStatus.inTrap ? (
              <div className="space-y-4">
                <p className="text-xs text-red-400 font-medium leading-relaxed uppercase border-l-2 border-red-500 pl-3">{debtTrapStatus.actionableAdvice}</p>
                <div className="flex justify-between items-center bg-black/50 p-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Interest Saved & Months Accelerated</span>
                  <span className="text-sm font-black italic text-emerald-500">+{debtTrapStatus.monthsSavedByPrepaying} Months</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/40 uppercase tracking-widest font-black">No &gt;18% APR debts detected. Protocol nominal.</p>
            )}
          </div>
        )}

        {/* Emergency Fund Analysis */}
        {emergencyFundStatus && (
          <div className="border border-white/10 bg-[#050505] p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Emergency Buffer</h3>
              </div>
              <span className="text-[10px] uppercase font-black tracking-[0.2em] px-2 py-1 bg-white/5 text-white/60">3x Monthly Rule</span>
            </div>

            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-black text-white italic">{formatCurrency(emergencyFundStatus.currentAmount)}</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Target: {formatCurrency(emergencyFundStatus.requiredAmount)}</span>
            </div>
            
            <div className="h-2 w-full bg-white/5 mb-6 relative overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${Math.min(100, (emergencyFundStatus.currentAmount / Math.max(1, emergencyFundStatus.requiredAmount)) * 100)}%` }} 
                className="h-full bg-amber-500" 
              />
            </div>

            <p className="text-xs text-white/60 leading-relaxed font-medium">{emergencyFundStatus.allotmentPlan}</p>
          </div>
        )}
      </div>

      {/* Dual Columns: Debt / Tactics & Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Debt Avalanche Strategy */}
        <div className="border border-white/10 bg-[#050505] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Avalanche Priority</h3>
          </div>
          <p className="text-xs text-white/50 mb-6 leading-relaxed">{debtStrategy.strategy}</p>
          
          <div className="space-y-3">
            {debtStrategy.prioritizedDebts.map((debt, i) => (
              <div key={debt.id} className="flex items-center justify-between p-4 border border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black italic text-white/20">{i+1}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">{debt.name}</h4>
                    <span className="text-[10px] uppercase font-black tracking-widest text-red-400">{debt.reason}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-black text-white italic">₹{debt.suggestedPayment}/mo</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/30">Target Vector</span>
                </div>
              </div>
            ))}
            {debtStrategy.prioritizedDebts.length === 0 && (
              <div className="text-center p-8 border border-white/5">
                <span className="text-emerald-500 uppercase tracking-[0.3em] font-black text-xs">No Debt Detected</span>
              </div>
            )}
          </div>
        </div>

        {/* Investment Allocations */}
        <div className="border border-white/10 bg-[#050505] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Capital Deployment</h3>
          </div>
          <div className="flex items-center gap-4 mb-6 text-[10px] font-black uppercase tracking-widest text-white/50">
            <span>Profile: <span className="text-emerald-400">{investmentRecommendation.riskProfile}</span></span>
          </div>
          
          <div className="space-y-4">
            {investmentRecommendation.recommendations.map((rec, i) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">{rec.type}</span>
                  <span className="text-emerald-500 font-black italic text-lg">{rec.allocation}%</span>
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-2">{rec.reason}</p>
                <div className="h-1.5 w-full bg-white/5">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${rec.allocation}%` }} 
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Dual Columns: Budget Optimization & Goal Feasibility */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Budget Audit */}
        <div className="border border-white/10 bg-[#050505] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Budget Audit (50/30/20)</h3>
          </div>
          
          <div className="space-y-4">
            {budgetRecommendation.savingsOpportunities.map((opp, i) => (
              <div key={i} className="border border-white/5 p-4 relative group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">{opp.category}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1">Save {formatCurrency(opp.potentialSavings)}/mo</span>
                </div>
                <div className="flex justify-between items-center mt-4 text-[10px] uppercase font-black tracking-widest text-white/40">
                  <span className="line-through">₹{Math.round(opp.currentSpend)}/mo</span>
                  <ArrowUpRight className="w-3 h-3 text-emerald-500 rotate-90" />
                  <span className="text-white">₹{Math.round(opp.suggestedSpend)}/mo</span>
                </div>
              </div>
            ))}
            {budgetRecommendation.savingsOpportunities.length === 0 && (
              <div className="text-center p-8 border border-white/5">
                <span className="text-emerald-500 uppercase tracking-[0.3em] font-black text-xs">No Leaks Detected</span>
              </div>
            )}
          </div>
        </div>

        {/* Goal Feasibility */}
        <div className="border border-white/10 bg-[#050505] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Goal Feasibility</h3>
          </div>

          <div className="space-y-4">
            {goalAnalysis.goals.map((goal, i) => (
              <div key={i} className="border border-white/5 p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{goal.name}</h4>
                  {goal.onTrack ? (
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Achievable</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Unrealistic</span>
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-widest font-black text-white/40 mb-3">Required: ₹{Math.round(goal.monthlyRequired)}/mo</p>
                <div className="h-1 w-full bg-white/5">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${Math.min(100, goal.progress)}%` }} 
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full ${goal.onTrack ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                </div>
              </div>
            ))}
            {goalAnalysis.goals.length === 0 && (
              <div className="text-center p-8 border border-white/5">
                <span className="text-white/30 uppercase tracking-[0.3em] font-black text-xs">No Goals Active</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
