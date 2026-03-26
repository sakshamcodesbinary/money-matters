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
import { Plus, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { api, type Investment } from '@/lib/api';
import { toast } from 'sonner';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const investmentTypeLabels: Record<string, string> = {
  mutual_fund: 'Mutual Fund',
  stocks: 'Stocks',
  fixed_deposit: 'Fixed Deposit',
  ppf: 'PPF',
  nps: 'NPS',
  real_estate: 'Real Estate',
  gold: 'Gold',
  crypto: 'Crypto',
  other: 'Other',
};

const investmentTypeOptions = [
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'fixed_deposit', label: 'Fixed Deposit' },
  { value: 'ppf', label: 'PPF' },
  { value: 'nps', label: 'NPS' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'gold', label: 'Gold' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' },
];

export default function InvestmentsPage() {
  const { data, isLoading } = useSWR('investments', () => api.getInvestments());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Investment | null>(null);
  const [deletingItem, setDeletingItem] = useState<Investment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'mutual_fund' as Investment['type'],
    currentValue: '',
    investedAmount: '',
    expectedReturn: '',
  });

  const investments = data?.investments || [];
  const totalInvested = investments.reduce((sum, item) => sum + item.investedAmount, 0);
  const totalCurrentValue = investments.reduce((sum, item) => sum + item.currentValue, 0);
  const totalReturns = totalCurrentValue - totalInvested;
  const returnsPercent = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;

  const columns: Column<Investment>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <Badge variant="secondary">{investmentTypeLabels[item.type]}</Badge>
      ),
    },
    {
      key: 'investedAmount',
      header: 'Invested',
      render: (item) => formatCurrency(item.investedAmount),
    },
    {
      key: 'currentValue',
      header: 'Current Value',
      render: (item) => formatCurrency(item.currentValue),
    },
    {
      key: 'returns',
      header: 'Returns',
      render: (item) => {
        const returns = item.currentValue - item.investedAmount;
        const returnsPercent = ((returns / item.investedAmount) * 100);
        return (
          <span className={returns >= 0 ? 'text-accent' : 'text-destructive'}>
            {formatCurrency(returns)} ({returnsPercent.toFixed(1)}%)
          </span>
        );
      },
    },
    {
      key: 'expectedReturn',
      header: 'Expected Return',
      render: (item) => `${item.expectedReturn}%`,
    },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'mutual_fund',
      currentValue: '',
      investedAmount: '',
      expectedReturn: '',
    });
    setEditingItem(null);
  };

  const openDialog = (item?: Investment) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        type: item.type,
        currentValue: item.currentValue.toString(),
        investedAmount: item.investedAmount.toString(),
        expectedReturn: item.expectedReturn.toString(),
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
        currentValue: parseFloat(formData.currentValue),
        investedAmount: parseFloat(formData.investedAmount),
        expectedReturn: parseFloat(formData.expectedReturn),
      };

      if (editingItem) {
        await api.updateInvestment(editingItem.id, payload);
        toast.success('Investment updated successfully');
      } else {
        await api.addInvestment(payload);
        toast.success('Investment added successfully');
      }

      mutate('investments');
      mutate('financial-summary');
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save investment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await api.deleteInvestment(deletingItem.id);
      toast.success('Investment deleted successfully');
      mutate('investments');
      mutate('financial-summary');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete investment');
    } finally {
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investments</h1>
          <p className="text-muted-foreground mt-1">
            Track your investment portfolio and returns.
          </p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Investment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Invested
              </CardTitle>
              <CardDescription>Principal amount</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-chart-2/10">
              <PieChart className="w-5 h-5 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(totalInvested)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Value
              </CardTitle>
              <CardDescription>Market value</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-accent/10">
              <PieChart className="w-5 h-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(totalCurrentValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Returns
              </CardTitle>
              <CardDescription>Profit/Loss</CardDescription>
            </div>
            <div className={`p-2 rounded-lg ${totalReturns >= 0 ? 'bg-accent/10' : 'bg-destructive/10'}`}>
              {totalReturns >= 0 ? (
                <TrendingUp className="w-5 h-5 text-accent" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalReturns >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {formatCurrency(totalReturns)}
              <span className="text-base font-normal ml-2">
                ({returnsPercent.toFixed(1)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        data={investments}
        columns={columns}
        isLoading={isLoading}
        onEdit={(item) => openDialog(item)}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="No investments added yet. Add your investments to track your portfolio."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Investment' : 'Add Investment'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update your investment details.' : 'Add a new investment to track.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="name">Investment Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g., Axis Bluechip Fund, Reliance Shares"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Select
                  value={formData.type}
                  onValueChange={(value: Investment['type']) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="investedAmount">Invested Amount (INR)</FieldLabel>
                <Input
                  id="investedAmount"
                  type="number"
                  placeholder="100000"
                  value={formData.investedAmount}
                  onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                  required
                  min="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="currentValue">Current Value (INR)</FieldLabel>
                <Input
                  id="currentValue"
                  type="number"
                  placeholder="120000"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  required
                  min="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="expectedReturn">Expected Annual Return (%)</FieldLabel>
                <Input
                  id="expectedReturn"
                  type="number"
                  placeholder="12"
                  value={formData.expectedReturn}
                  onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
                  required
                  step="0.01"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investment</AlertDialogTitle>
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
