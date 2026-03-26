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
import { Plus, TrendingDown } from 'lucide-react';
import { api, type Expense } from '@/lib/api';
import { toast } from 'sonner';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const categoryOptions = [
  'Housing',
  'Utilities',
  'Food & Dining',
  'Transportation',
  'Healthcare',
  'Insurance',
  'Entertainment',
  'Shopping',
  'Personal Care',
  'Education',
  'Subscriptions',
  'Other',
];

const frequencyLabels: Record<string, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  'one-time': 'One-time',
};

export default function ExpensesPage() {
  const { data, isLoading } = useSWR('expenses', () => api.getExpenses());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Expense | null>(null);
  const [deletingItem, setDeletingItem] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'annual' | 'one-time',
    isEssential: false,
  });

  const expenses = data?.expenses || [];
  const totalMonthlyExpenses = expenses.reduce((sum, item) => {
    if (item.frequency === 'monthly') return sum + item.amount;
    if (item.frequency === 'annual') return sum + item.amount / 12;
    return sum;
  }, 0);

  const essentialExpenses = expenses.filter(e => e.isEssential).reduce((sum, item) => {
    if (item.frequency === 'monthly') return sum + item.amount;
    if (item.frequency === 'annual') return sum + item.amount / 12;
    return sum;
  }, 0);

  const columns: Column<Expense>[] = [
    { key: 'category', header: 'Category' },
    { key: 'description', header: 'Description' },
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
      key: 'isEssential',
      header: 'Type',
      render: (item) => (
        <Badge variant={item.isEssential ? 'default' : 'outline'}>
          {item.isEssential ? 'Essential' : 'Non-essential'}
        </Badge>
      ),
    },
  ];

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      frequency: 'monthly',
      isEssential: false,
    });
    setEditingItem(null);
  };

  const openDialog = (item?: Expense) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        category: item.category,
        description: item.description,
        amount: item.amount.toString(),
        frequency: item.frequency,
        isEssential: item.isEssential,
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
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        isEssential: formData.isEssential,
      };

      if (editingItem) {
        await api.updateExpense(editingItem.id, payload);
        toast.success('Expense updated successfully');
      } else {
        await api.addExpense(payload);
        toast.success('Expense added successfully');
      }

      mutate('expenses');
      mutate('financial-summary');
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await api.deleteExpense(deletingItem.id);
      toast.success('Expense deleted successfully');
      mutate('expenses');
      mutate('financial-summary');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
    } finally {
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and categorize your spending.
          </p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Monthly Expenses
              </CardTitle>
              <CardDescription>All expense categories</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(totalMonthlyExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Essential Expenses
              </CardTitle>
              <CardDescription>Must-have spending</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-warning/10">
              <TrendingDown className="w-5 h-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(essentialExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        data={expenses}
        columns={columns}
        isLoading={isLoading}
        onEdit={(item) => openDialog(item)}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="No expenses tracked yet. Add your first expense to start tracking."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update your expense details.' : 'Add a new expense to track.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Input
                  id="description"
                  placeholder="e.g., Monthly rent, Netflix subscription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="amount">Amount (INR)</FieldLabel>
                <Input
                  id="amount"
                  type="number"
                  placeholder="5000"
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
                <FieldLabel htmlFor="isEssential" className="cursor-pointer">Essential Expense</FieldLabel>
                <Switch
                  id="isEssential"
                  checked={formData.isEssential}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEssential: checked })}
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
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.description}&quot;? This action cannot be undone.
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
