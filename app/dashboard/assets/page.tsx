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
import { Plus, Building2 } from 'lucide-react';
import { api, type Asset } from '@/lib/api';
import { toast } from 'sonner';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const assetTypeLabels: Record<string, string> = {
  property: 'Property',
  vehicle: 'Vehicle',
  jewelry: 'Jewelry',
  electronics: 'Electronics',
  other: 'Other',
};

const assetTypeOptions = [
  { value: 'property', label: 'Property' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'other', label: 'Other' },
];

export default function AssetsPage() {
  const { data, isLoading } = useSWR('assets', () => api.getAssets());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Asset | null>(null);
  const [deletingItem, setDeletingItem] = useState<Asset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'property' as Asset['type'],
    currentValue: '',
    purchaseValue: '',
    purchaseDate: '',
  });

  const assets = data?.assets || [];
  const totalCurrentValue = assets.reduce((sum, item) => sum + item.currentValue, 0);
  const totalPurchaseValue = assets.reduce((sum, item) => sum + item.purchaseValue, 0);

  const columns: Column<Asset>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <Badge variant="secondary">{assetTypeLabels[item.type]}</Badge>
      ),
    },
    {
      key: 'purchaseValue',
      header: 'Purchase Value',
      render: (item) => formatCurrency(item.purchaseValue),
    },
    {
      key: 'currentValue',
      header: 'Current Value',
      render: (item) => formatCurrency(item.currentValue),
    },
    {
      key: 'purchaseDate',
      header: 'Purchase Date',
      render: (item) => new Date(item.purchaseDate).toLocaleDateString('en-IN'),
    },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'property',
      currentValue: '',
      purchaseValue: '',
      purchaseDate: '',
    });
    setEditingItem(null);
  };

  const openDialog = (item?: Asset) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        type: item.type,
        currentValue: item.currentValue.toString(),
        purchaseValue: item.purchaseValue.toString(),
        purchaseDate: item.purchaseDate.split('T')[0],
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
        purchaseValue: parseFloat(formData.purchaseValue),
        purchaseDate: formData.purchaseDate,
      };

      if (editingItem) {
        await api.updateAsset(editingItem.id, payload);
        toast.success('Asset updated successfully');
      } else {
        await api.addAsset(payload);
        toast.success('Asset added successfully');
      }

      mutate('assets');
      mutate('financial-summary');
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      await api.deleteAsset(deletingItem.id);
      toast.success('Asset deleted successfully');
      mutate('assets');
      mutate('financial-summary');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete asset');
    } finally {
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assets</h1>
          <p className="text-muted-foreground mt-1">
            Track your physical assets and their value.
          </p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Asset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Asset Value
              </CardTitle>
              <CardDescription>Current market value</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
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
                Total Purchase Value
              </CardTitle>
              <CardDescription>Original cost</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(totalPurchaseValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        data={assets}
        columns={columns}
        isLoading={isLoading}
        onEdit={(item) => openDialog(item)}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="No assets added yet. Add your physical assets to track your net worth."
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update your asset details.' : 'Add a new asset to track.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="name">Asset Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="e.g., Apartment in Mumbai, Honda City"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Select
                  value={formData.type}
                  onValueChange={(value: Asset['type']) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="purchaseValue">Purchase Value (INR)</FieldLabel>
                <Input
                  id="purchaseValue"
                  type="number"
                  placeholder="5000000"
                  value={formData.purchaseValue}
                  onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                  required
                  min="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="currentValue">Current Value (INR)</FieldLabel>
                <Input
                  id="currentValue"
                  type="number"
                  placeholder="6500000"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                  required
                  min="0"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="purchaseDate">Purchase Date</FieldLabel>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
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
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
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
