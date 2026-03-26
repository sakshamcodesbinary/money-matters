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
import { Plus, CreditCard, AlertTriangle } from 'lucide-react';
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
  const highInterestDebts = debts.filter(d => d.interestRate > 15);

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
        <span className={item.interestRate > 15 ? 'text-destructive font-medium' : ''}>
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
                {'High Interest Debts (>15%)'}
              </CardTitle>
              <CardDescription>Priority to pay off</CardDescription>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Debt' : 'Add Debt'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update your debt details.' : 'Add a new debt or loan to track.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="name">Debt Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g., HDFC Credit Card, Car Loan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Select
                  value={formData.type}
                  onValueChange={(value: Debt['type']) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {debtTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="principal">Outstanding Principal (INR)</FieldLabel>
                <Input
                  id="principal"
                  type="number"
                  placeholder="100000"
                  value={formData.principal}
                  onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                  required
                  min="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="interestRate">Interest Rate (%)</FieldLabel>
                <Input
                  id="interestRate"
                  type="number"
                  placeholder="18"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="emi">Monthly EMI (INR)</FieldLabel>
                <Input
                  id="emi"
                  type="number"
                  placeholder="5000"
                  value={formData.emi}
                  onChange={(e) => setFormData({ ...formData, emi: e.target.value })}
                  required
                  min="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="remainingTenure">Remaining Tenure (Months)</FieldLabel>
                <Input
                  id="remainingTenure"
                  type="number"
                  placeholder="24"
                  value={formData.remainingTenure}
                  onChange={(e) => setFormData({ ...formData, remainingTenure: e.target.value })}
                  required
                  min="1"
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
