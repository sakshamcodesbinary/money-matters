'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { DataTable, type Column } from '@/components/dashboard/data-table';
import { Plus, CreditCard, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api, type Debt } from '@/lib/api';
import { toast } from 'sonner';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const debtTypeLabels: Record<string, string> = {
  credit_card: 'Credit Card',
  personal_loan: 'Personal Loan',
  car_loan: 'Car Loan',
  home_loan: 'Home Loan',
  education_loan: 'Education Loan',
  other: 'Other',
};

const debtTypeOptions = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'car_loan', label: 'Car Loan' },
  { value: 'home_loan', label: 'Home Loan' },
  { value: 'education_loan', label: 'Education Loan' },
  { value: 'other', label: 'Other' },
];

export default function DebtsPage() {
  const { data, isLoading } = useSWR('debts', () => api.getDebts());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Debt | null>(null);
  const [deletingItem, setDeletingItem] = useState<Debt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card' as Debt['type'],
    principal: '',
    interestRate: '',
    emi: '',
    remainingTenure: '',
  });

  const debts = data?.debts || [];
  const totalDebt = debts.reduce((sum, item) => sum + item.principal, 0);
  const totalEMI = debts.reduce((sum, item) => sum + item.emi, 0);
  const highInterestDebts = debts.filter(d => d.interestRate > 18);

  const columns: Column<Debt>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <Badge variant="secondary">{debtTypeLabels[item.type]}</Badge>
      ),
    },
    {
      key: 'principal',
      header: 'Outstanding',
      render: (item) => formatCurrency(item.principal),
    },
    {
      key: 'interestRate',
      header: 'Interest',
      render: (item) => (
        <span className={item.interestRate > 18 ? 'text-amber-500 font-bold' : 'text-white'}>
          {item.interestRate}%
        </span>
      ),
    },
    {
      key: 'emi',
      header: 'EMI',
      render: (item) => formatCurrency(item.emi),
    },
    {
      key: 'remainingTenure',
      header: 'Tenure Left',
      render: (item) => `${item.remainingTenure} months`,
    },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'credit_card',
      principal: '',
      interestRate: '',
      emi: '',
      remainingTenure: '',
    });
    setEditingItem(null);
  };

  const openDialog = (item?: Debt) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        type: item.type,
        principal: item.principal.toString(),
        interestRate: item.interestRate.toString(),
        emi: item.emi.toString(),
        remainingTenure: item.remainingTenure.toString(),
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
        type: formData.type,
        principal: parseFloat(formData.principal),
        interestRate: parseFloat(formData.interestRate),
        emi: parseFloat(formData.emi),
        remainingTenure: parseInt(formData.remainingTenure),
      };

      if (editingItem) {
        await api.updateDebt(editingItem.id, payload);
        toast.success('Debt updated successfully');
      } else {
        await api.addDebt(payload);
        toast.success('Debt added successfully');
      }

      mutate('debts');
      mutate('financial-summary');
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save debt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await api.deleteDebt(deletingItem.id);
      toast.success('Debt deleted successfully');
      mutate('debts');
      mutate('financial-summary');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete debt');
    } finally {
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Debts & EMIs</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your debts strategically.
          </p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Debt
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Outstanding Debt
              </CardTitle>
              <CardDescription>All loans combined</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-warning/10">
              <CreditCard className="w-5 h-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(totalDebt)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Monthly EMI
              </CardTitle>
              <CardDescription>Monthly outflow</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10">
              <CreditCard className="w-5 h-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(totalEMI)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {'High Interest Debts (>18%)'}
              </CardTitle>
              <CardDescription>Capital erosion threat</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {highInterestDebts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        data={debts}
        columns={columns}
        isLoading={isLoading}
        onEdit={(item) => openDialog(item)}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="No debts or loans added yet. Add your debts to get smart payoff strategies."
      />

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
                    {editingItem ? 'Update Debt Protocol' : 'Initialize Debt Protocol'}
                  </DialogTitle>
                  <DialogDescription className="text-white/60">
                    {editingItem ? 'Refining liability parameters.' : 'Mapping new capital liability to matrix.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-5">
                  <FieldGroup className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="name" className="text-white text-xs">Identifier</FieldLabel>
                        <Input
                          id="name"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="e.g., HDFC Card"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="type" className="text-white text-xs">Debt Category</FieldLabel>
                        <Select
                          value={formData.type}
                          onValueChange={(value: Debt['type']) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-white/10">
                            {debtTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-neutral-900 focus:bg-neutral-100 focus:text-black">{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="principal" className="text-white text-xs">Outstanding Principal</FieldLabel>
                        <Input
                          id="principal"
                          type="number"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="100000"
                          value={formData.principal}
                          onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                          required
                          min="0"
                        />
                      </Field>
                      <Field>
                        <div className="flex justify-between items-end mb-1">
                          <FieldLabel htmlFor="interestRate" className="text-white text-xs">Interest Rate (%)</FieldLabel>
                          {formData.interestRate && parseFloat(formData.interestRate) > 18 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-amber-400">
                                 THREAT DETECTED
                               </span>
                               <Popover>
                                 <PopoverTrigger asChild>
                                   <button 
                                     type="button" 
                                     className="w-5 h-5 bg-amber-500 text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                   >
                                     <AlertTriangle className="w-3 h-3 fill-black" />
                                   </button>
                                 </PopoverTrigger>
                                 <PopoverContent 
                                   side="top" 
                                   align="end" 
                                   className="bg-white text-black border-none text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] z-[110]"
                                 >
                                   <div className="flex items-center gap-2">
                                     <div className="w-1 h-3 bg-amber-500" />
                                     CRITICAL: Interest rate &gt; 18% leads to rapid capital erosion.
                                   </div>
                                 </PopoverContent>
                               </Popover>
                            </div>
                          )}
                        </div>
                        <Input
                          id="interestRate"
                          type="number"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="18"
                          value={formData.interestRate}
                          onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                          required
                          min="0"
                          step="0.01"
                        />
                      </Field>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="remainingTenure" className="text-white text-xs">Remaining Tenure (Months)</FieldLabel>
                        <Input
                          id="remainingTenure"
                          type="number"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="24"
                          value={formData.remainingTenure}
                          onChange={(e) => setFormData({ ...formData, remainingTenure: e.target.value })}
                          required
                          min="1"
                        />
                      </Field>
                      <Field>
                        <div className="flex justify-between items-end mb-1">
                          <FieldLabel htmlFor="emi" className="text-white text-xs">Monthly EMI</FieldLabel>
                          {formData.principal && formData.interestRate && formData.remainingTenure && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">
                                 <span className="text-white">= </span>
                                 <span className="text-emerald-400">
                                   {(() => {
                                      const p = parseFloat(formData.principal);
                                      const r = (parseFloat(formData.interestRate) / 12) / 100;
                                      const n = parseInt(formData.remainingTenure);
                                      if (isNaN(p) || isNaN(r) || isNaN(n) || r === 0) return formatCurrency(p / n);
                                      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                                      return formatCurrency(emi);
                                   })()}
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
                                     Calculated EMI projection based on current variables.
                                   </div>
                                 </PopoverContent>
                               </Popover>
                            </div>
                          )}
                        </div>
                        <Input
                          id="emi"
                          type="number"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="5000"
                          value={formData.emi}
                          onChange={(e) => setFormData({ ...formData, emi: e.target.value })}
                          required
                          min="0"
                        />
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
                      className="bg-white text-black hover:bg-white/90 h-9 text-xs font-bold px-6"
                    >
                      {isSubmitting ? '...' : editingItem ? 'Update' : 'Initialize'}
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
            <AlertDialogTitle>Delete Debt</AlertDialogTitle>
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
