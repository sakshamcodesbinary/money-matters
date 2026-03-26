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
import { Plus, TrendingUp } from 'lucide-react';
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
  'one-time': 'One-time',
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
    frequency: 'monthly' as 'monthly' | 'annual' | 'one-time',
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
        frequency: item.frequency,
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Income' : 'Add Income'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update your income source details.' : 'Add a new income source to track.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="source">Source Name</FieldLabel>
                <Input
                  id="source"
                  placeholder="e.g., Salary, Freelance, Dividends"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="amount">Amount (INR)</FieldLabel>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="frequency">Frequency</FieldLabel>
                <Select
                  value={formData.frequency}
                  onValueChange={(value: 'monthly' | 'annual' | 'one-time') =>
                    setFormData({ ...formData, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field className="flex items-center justify-between">
                <FieldLabel htmlFor="isActive" className="cursor-pointer">Active</FieldLabel>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
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
