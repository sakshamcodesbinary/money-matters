'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Hammer, ArrowLeft, Hexagon } from 'lucide-react';

export default function UnderConstruction() {
  return (
    <div className="min-h-screen bg-[#030711] flex flex-col items-center justify-center p-4 text-white overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00C6FF]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass border-white/5 p-12 rounded-[2.5rem] flex flex-col items-center max-w-lg text-center relative z-10"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00C6FF] to-[#7F00FF] p-[1px] glow-purple mb-8">
          <div className="w-full h-full rounded-2xl bg-[#030711] flex items-center justify-center">
            <Hammer className="w-10 h-10 text-[#7F00FF]" />
          </div>
        </div>

        <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">
          Forge in Progress
        </h1>
        
        <p className="text-white/40 mb-8 leading-relaxed font-medium">
          Our pricing tiers are currently being calibrated to provide the best value in the ecosystem. Access is currently invite-only.
        </p>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#38bdf8] mb-10">
          <Hexagon className="w-3 h-3 animate-spin" />
          ESTIMATED TIME OF ARRIVAL: Q3 2026
        </div>

        <Button asChild className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-8 h-12">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Return to Core
          </Link>
        </Button>
      </motion.div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
    </div>
  );
}
