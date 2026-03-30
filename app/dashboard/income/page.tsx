'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { DataTable, type Column } from '@/components/dashboard/data-table';
import { Plus, TrendingUp, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api, type Income } from '@/lib/api';
import { toast } from 'sonner';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const frequencyLabels: Record<string, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
};

export default function IncomePage() {
  const { data, isLoading } = useSWR('income', () => api.getIncome());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Income | null>(null);
  const [deletingItem, setDeletingItem] = useState<Income | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'annual',
    isActive: true,
  });

  const income = data?.income || [];
  const totalMonthlyIncome = income.reduce((sum, item) => {
    if (!item.isActive) return sum;
    if (item.frequency === 'monthly') return sum + item.amount;
    if (item.frequency === 'annual') return sum + item.amount / 12;
    return sum;
  }, 0);

  const columns: Column<Income>[] = [
    { key: 'source', header: 'Source' },
    {
      key: 'amount',
      header: 'Amount',
      render: (item) => formatCurrency(item.amount),
    },
    {
      key: 'frequency',
      header: 'Frequency',
      render: (item) => (
        <Badge variant="secondary">{frequencyLabels[item.frequency]}</Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.isActive ? 'default' : 'outline'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const resetForm = () => {
    setFormData({
      source: '',
      amount: '',
      frequency: 'monthly',
      isActive: true,
    });
    setEditingItem(null);
  };

  const openDialog = (item?: Income) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        source: item.source,
        amount: item.amount.toString(),
        frequency: item.frequency as 'monthly' | 'annual',
        isActive: item.isActive,
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
        source: formData.source,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        isActive: formData.isActive,
      };

      if (editingItem) {
        await api.updateIncome(editingItem.id, payload);
        toast.success('Income updated successfully');
      } else {
        await api.addIncome(payload);
        toast.success('Income added successfully');
      }

      mutate('income');
      mutate('financial-summary');
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save income');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await api.deleteIncome(deletingItem.id);
      toast.success('Income deleted successfully');
      mutate('income');
      mutate('financial-summary');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete income');
    } finally {
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Income</h1>
          <p className="text-muted-foreground mt-1">
            Track all your income sources.
          </p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Income
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Monthly Income
            </CardTitle>
            <CardDescription>From all active sources</CardDescription>
          </div>
          <div className="p-2 rounded-lg bg-accent/10">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(totalMonthlyIncome)}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        data={income}
        columns={columns}
        isLoading={isLoading}
        onEdit={(item) => openDialog(item)}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="No income sources added yet. Add your first income source to get started."
      />

      {/* Add/Edit Dialog */}
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
                    {editingItem ? 'Edit Income' : 'Add Income'}
                  </DialogTitle>
                  <DialogDescription className="text-white/60">
                    {editingItem ? 'Update your income source details.' : 'Add a new income source to track.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-6">
                  <FieldGroup className="space-y-6">
                    <Field>
                      <FieldLabel htmlFor="source" className="text-white">Source Name</FieldLabel>
                      <Input
                        id="source"
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., Salary, Freelance, Dividends"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="frequency" className="text-white">Frequency</FieldLabel>
                      <Select
                        value={formData.frequency}
                        onValueChange={(value: 'monthly' | 'annual') =>
                          setFormData({ ...formData, frequency: value })
                        }
                      >
                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-white/10">
                          <SelectItem value="monthly" className="text-neutral-900 focus:bg-neutral-100 focus:text-black">Monthly</SelectItem>
                          <SelectItem value="annual" className="text-neutral-900 focus:bg-neutral-100 focus:text-black">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <div className="flex justify-between items-end mb-1">
                        <FieldLabel htmlFor="amount" className="text-white">Amount (INR)</FieldLabel>
                        {formData.frequency === 'annual' && formData.amount && !isNaN(parseFloat(formData.amount)) && (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">
                               <span className="text-white">= </span>
                               <span className="text-emerald-400">{formatCurrency(parseFloat(formData.amount) / 12)} / Month</span>
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
                                   Analytical Normalization: Divided by 12
                                 </div>
                               </PopoverContent>
                             </Popover>
                          </div>
                        )}
                      </div>
                      <Input
                        id="amount"
                        type="number"
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="50000"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                      />
                    </Field>
                    <Field className="flex items-center justify-between border border-white/5 p-3 rounded-none bg-white/[0.02]">
                      <div className="space-y-0.5">
                        <FieldLabel htmlFor="isActive" className="cursor-pointer font-bold text-xs text-white">Active Status</FieldLabel>
                        <p className="text-[9px] text-white/40 uppercase tracking-tighter">Include this source in financial analysis</p>
                      </div>
                      <div className="flex items-center h-full text-white">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                      </div>
                    </Field>
                  </FieldGroup>
                  <DialogFooter className="mt-6 gap-3">
                    <Button 
                      type="button" 
                      className="bg-white text-black hover:bg-white/90" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="bg-white text-black hover:bg-white/90"
                    >
                      {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Add'}
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
            <AlertDialogTitle>Delete Income Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.source}&quot;? This action cannot be undone.
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
