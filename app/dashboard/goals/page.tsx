'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Target, Calendar, TrendingUp, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api, type Goal } from '@/lib/api';
import { toast } from 'sonner';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const goalCategoryLabels: Record<string, string> = {
  emergency_fund: 'Emergency Fund',
  retirement: 'Retirement',
  education: 'Education',
  home: 'Home',
  travel: 'Travel',
  wedding: 'Wedding',
  other: 'Other',
};

const goalCategoryOptions = [
  { value: 'emergency_fund', label: 'Emergency Fund' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'education', label: 'Education' },
  { value: 'home', label: 'Home' },
  { value: 'travel', label: 'Travel' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'other', label: 'Other' },
];

const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function GoalsPage() {
  const { data, isLoading } = useSWR('goals', () => api.getGoals());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Goal | null>(null);
  const [deletingItem, setDeletingItem] = useState<Goal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    priority: 'medium' as Goal['priority'],
    category: 'other' as Goal['category'],
  });

  const { data: summaryData } = useSWR('financial-summary', () => api.getSummary());
  const surplus = summaryData?.summary.monthlySurplus || 0;

  const goals = data?.goals || [];
  const totalTargetAmount = goals.reduce((sum, item) => sum + item.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, item) => sum + item.currentAmount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      priority: 'medium',
      category: 'other',
    });
    setEditingItem(null);
  };

  const openDialog = (item?: Goal) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        targetAmount: item.targetAmount.toString(),
        currentAmount: item.currentAmount.toString(),
        targetDate: item.targetDate.split('T')[0],
        priority: item.priority,
        category: item.category,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        targetDate: formData.targetDate,
        priority: formData.priority,
        category: formData.category,
      };

      if (editingItem) {
        await api.updateGoal(editingItem.id, payload);
        toast.success('Goal updated successfully');
      } else {
        await api.addGoal(payload);
        toast.success('Goal added successfully');
      }

      mutate('goals');
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await api.deleteGoal(deletingItem.id);
      toast.success('Goal deleted successfully');
      mutate('goals');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setDeletingItem(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getMonthsRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Goals</h1>
          <p className="text-muted-foreground mt-1">
            Set and track your financial goals.
          </p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </div>

      {/* Stat Strip */}
      {(() => {
        const totalMonthlyRequired = goals.reduce((sum, goal) => {
          const months = getMonthsRemaining(goal.targetDate);
          if (months <= 0) return sum;
          return sum + (goal.targetAmount - goal.currentAmount) / months;
        }, 0);
        const isAchievable = surplus >= totalMonthlyRequired && totalMonthlyRequired > 0;
        const isNearing = surplus > 0 && surplus < totalMonthlyRequired;

        return (
          <div className="border border-white/10 bg-[#050505] overflow-hidden relative">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Top label bar */}
            <div className="px-6 pt-4 pb-0 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3 pb-3">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Financial Objective Matrix</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 pb-3">{goals.length} Target{goals.length !== 1 ? 's' : ''} Active</span>
            </div>

            {/* Main 3-col stat grid */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              {/* Left: Saved */}
              <div className="px-6 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Saved Magnitude</p>
                <p className="text-5xl font-black text-white italic tracking-tighter leading-none">{formatCurrency(totalCurrentAmount)}</p>
              </div>

              {/* Center: Progress column */}
              <div className="flex flex-col items-center gap-2 px-6 py-5 border-x border-white/5 min-w-[120px]">
                <span className={`text-4xl font-black italic tracking-tighter leading-none ${
                  overallProgress >= 75 ? 'text-emerald-400' : overallProgress >= 40 ? 'text-amber-400' : 'text-white'
                }`}>{overallProgress.toFixed(0)}%</span>
                <div className="w-full h-1.5 bg-white/5 overflow-hidden mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 1.5, ease: 'circOut' }}
                    className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                  />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">Complete</span>
              </div>

              {/* Right: Target */}
              <div className="px-6 py-5 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-1">Target Threshold</p>
                <p className="text-5xl font-black text-white/30 italic tracking-tighter leading-none">{formatCurrency(totalTargetAmount)}</p>
              </div>
            </div>

            {/* Bottom: Achievability strip */}
            <div className="border-t border-white/5 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  isAchievable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]' : 
                  isNearing   ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.9)]' : 
                                'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                }`} />
                <span className={`text-xs font-black uppercase tracking-[0.3em] italic ${
                  isAchievable ? 'text-emerald-400' : isNearing ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {isAchievable ? 'Objective Achievable' : isNearing ? 'Objective Strained' : 'Objective High Risk'}
                </span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 group/info">
                    <span className="text-[10px] font-black text-white/40 italic group-hover/info:text-white transition-colors">
                      {formatCurrency(surplus)} surplus <span className="text-white/20">vs</span> {formatCurrency(totalMonthlyRequired)} needed
                    </span>
                    <Info className="w-3.5 h-3.5 text-white/20 group-hover/info:text-white transition-colors" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="bg-white text-black border-none text-[9px] font-black uppercase tracking-widest px-4 py-3 rounded-none shadow-2xl z-[110] max-w-[240px]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-black" />
                      Feasibility Audit
                    </div>
                    <p className="text-[8px] leading-relaxed text-black/60 normal-case font-medium">
                      Monthly surplus of {formatCurrency(surplus)} compared against {formatCurrency(totalMonthlyRequired)} required across all active objectives.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );
      })()}

      {/* Goals Grid / Empty State */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-40 bg-muted rounded mb-4" />
                <div className="h-3 w-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-8 text-center bg-[#050505] border-white/10 group cursor-pointer hover:border-emerald-500/30 transition-colors" onClick={() => openDialog()}>
          <Target className="w-8 h-8 text-white/20 mx-auto mb-4 group-hover:text-emerald-500 group-hover:scale-110 transition-all duration-500" />
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">No Objectives Mapped</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-1 mb-4">
            Initialize your financial future by setting your first milestone.
          </p>
          <Button onClick={() => openDialog()} className="rounded-none bg-white text-black font-black uppercase tracking-widest text-[10px] hover:invert px-8">Initialize First Goal</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const monthsRemaining = getMonthsRemaining(goal.targetDate);
              const monthlyRequired = monthsRemaining > 0 
                ? (goal.targetAmount - goal.currentAmount) / monthsRemaining 
                : 0;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={goal.id}
                >
                  <Card className="bg-[#050505] border-white/10 overflow-hidden group hover:border-white/20 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-black uppercase italic tracking-tighter text-white group-hover:text-emerald-400 transition-colors">
                            {goal.name}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge className="rounded-none bg-white/5 text-white/40 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                              {goalCategoryLabels[goal.category]}
                            </Badge>
                            <Badge className={`rounded-none border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 ${
                              goal.priority === 'high' ? 'bg-destructive/20 text-destructive' : 
                              goal.priority === 'medium' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-white/60'
                            }`}>
                              {goal.priority}
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-white/20 hover:text-white hover:bg-white/5 rounded-none" 
                          onClick={() => openDialog(goal)}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xl font-black text-white italic">{formatCurrency(goal.currentAmount)}</span>
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">/ {formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-white"
                          />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 italic">{progress.toFixed(1)}% Completed</p>
                      </div>
                      
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-none flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-white/20" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{monthsRemaining} Months</span>
                        </div>
                        {monthlyRequired > 0 && (
                          <div className="text-right">
                             <div className="text-[8px] font-black uppercase text-white/20 tracking-tighter">Required Magnitude</div>
                             <div className="text-[10px] font-black text-emerald-400 italic">{formatCurrency(monthlyRequired)}/mo</div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 rounded-none border-white/10 bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[9px] h-8" 
                          onClick={() => openDialog(goal)}
                        >
                          Update
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-none text-white/20 hover:text-destructive hover:bg-destructive/5 font-black uppercase tracking-widest text-[9px] h-8" 
                          onClick={() => setDeletingItem(goal)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}



      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AnimatePresence>
          {isDialogOpen && (
            <DialogContent forceMount className="bg-transparent border-none p-0 max-w-lg shadow-none overflow-visible" showCloseButton={false}>
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.99 }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="bg-[#050505] border border-white/10 rounded-lg overflow-hidden shadow-2xl"
              >
                <DialogHeader className="p-6 border-b border-white/10">
                  <DialogTitle className="text-white">
                    {editingItem ? 'Refine Objective' : 'Initialize Objective'}
                  </DialogTitle>
                  <DialogDescription className="text-white/60">
                    {editingItem ? 'Adjusting target parameters.' : 'Mapping new financial milestone to matrix.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-5">
                  <FieldGroup className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="name" className="text-white text-xs">Goal Identifier</FieldLabel>
                        <Input
                          id="name"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="e.g., Retirement"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="category" className="text-white text-xs">Objective Type</FieldLabel>
                        <Select
                          value={formData.category}
                          onValueChange={(value: Goal['category']) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-white/10">
                            {goalCategoryOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-neutral-900 focus:bg-neutral-100 focus:text-black">{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="targetAmount" className="text-white text-xs">Target Threshold (INR)</FieldLabel>
                        <Input
                          id="targetAmount"
                          type="number"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="500000"
                          value={formData.targetAmount}
                          onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                          required
                          min="0"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="currentAmount" className="text-white text-xs">Current Magnitude (INR)</FieldLabel>
                        <Input
                          id="currentAmount"
                          type="number"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="100000"
                          value={formData.currentAmount}
                          onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                          required
                          min="0"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field>
                        <div className="flex justify-between items-end mb-1">
                          <FieldLabel htmlFor="targetDate" className="text-white text-xs">Deadline</FieldLabel>
                          {formData.targetAmount && formData.targetDate && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">
                                 <span className="text-white">= </span>
                                 <span className="text-emerald-400">
                                   {(() => {
                                      const threshold = parseFloat(formData.targetAmount);
                                      const current = parseFloat(formData.currentAmount) || 0;
                                      const diff = threshold - current;
                                      const months = getMonthsRemaining(formData.targetDate);
                                      if (diff <= 0 || months <= 0) return '---';
                                      return formatCurrency(diff / months);
                                   })()}
                                   <span className="text-white/20 ml-1">/mo</span>
                                 </span>
                               </span>
                               <Popover>
                                 <PopoverTrigger asChild>
                                   <button 
                                     type="button" 
                                     className="w-5 h-5 bg-emerald-500 text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                   >
                                     <Info className="w-3 h-3 fill-black font-black" />
                                   </button>
                                 </PopoverTrigger>
                                 <PopoverContent 
                                   side="top" 
                                   align="end" 
                                   className="bg-white text-black border-none text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] z-[110]"
                                 >
                                   <div className="flex items-center gap-2">
                                     <div className="w-1 h-3 bg-emerald-500" />
                                     Required Inflow Velocity to reach threshold.
                                   </div>
                                 </PopoverContent>
                               </Popover>
                            </div>
                          )}
                        </div>
                        <Input
                          id="targetDate"
                          type="date"
                          className="bg-white/5 border-white/10 text-white h-10 [color-scheme:dark]"
                          value={formData.targetDate}
                          onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="priority" className="text-white text-xs">Priority State</FieldLabel>
                        <Select
                          value={formData.priority}
                          onValueChange={(value: Goal['priority']) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-white/10">
                            {priorityOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-neutral-900 focus:bg-neutral-100 focus:text-black">{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </FieldGroup>
                  <DialogFooter className="mt-5 gap-3">
                    <Button 
                      type="button" 
                      className="bg-white text-black hover:bg-white/90 h-9 text-xs font-bold" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="bg-white text-black hover:bg-white/90 rounded-none h-9 text-[10px] font-black uppercase tracking-widest px-6"
                    >
                      {isSubmitting ? '...' : editingItem ? 'Refine Objective' : 'Initialize Objective'}
                    </Button>
                  </DialogFooter>
                </form>
              </motion.div>
            </DialogContent>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
