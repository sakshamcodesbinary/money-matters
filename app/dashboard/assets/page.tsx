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
import { Plus, Building2, Info, X, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  cash: 'Liquid Capital (Bank)',
  emergency_fund: 'Resilience Strategy (Emergency Fund)',
  property: 'Property',
  vehicle: 'Vehicle',
  jewelry: 'Jewelry',
  electronics: 'Electronics',
  other: 'Other',
};

const assetTypeOptions = [
  { value: 'cash', label: 'Liquid Capital (Bank)' },
  { value: 'emergency_fund', label: 'Resilience Strategy (Emergency Fund)' },
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
      header: 'Acquisition',
      render: (item) => ['cash', 'emergency_fund'].includes(item.type) ? 'Current' : item.purchaseDate,
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
        purchaseDate: item.purchaseDate,
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
                    {editingItem ? 'Update Portfolio Asset' : 'Initialize Portfolio Asset'}
                  </DialogTitle>
                  <DialogDescription className="text-white/60">
                    {editingItem ? 'Refining physical asset parameters.' : 'Mapping new physical wealth to matrix.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-5">
                  <FieldGroup className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="name" className="text-white text-xs">Asset Identifier</FieldLabel>
                        <Input
                          id="name"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="e.g., Mumbai Apartment"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="type" className="text-white text-xs">Category</FieldLabel>
                        <Select
                          value={formData.type}
                          onValueChange={(value: Asset['type']) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-white/10">
                            {assetTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-neutral-900 focus:bg-neutral-100 focus:text-black">{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="purchaseValue" className="text-white text-xs">Purchase Price (Acquisition)</FieldLabel>
                        <Input
                          id="purchaseValue"
                          type="number"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="5000000"
                          value={formData.purchaseValue}
                          onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                          required
                          min="0"
                        />
                      </Field>
                      <Field>
                        <div className="flex justify-between items-end mb-1">
                          <FieldLabel htmlFor="currentValue" className="text-white text-xs">Current Market Value</FieldLabel>
                          {formData.purchaseValue && formData.currentValue && !['cash', 'emergency_fund'].includes(formData.type) && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                               {(() => {
                                  const p = parseFloat(formData.purchaseValue);
                                  const c = parseFloat(formData.currentValue);
                                  const diff = c - p;
                                  const isGain = diff >= 0;
                                  return (
                                    <>
                                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${isGain ? 'text-emerald-400' : 'text-destructive'}`}>
                                         {isGain ? '+' : ''}{formatCurrency(diff)}
                                       </span>
                                       <Popover>
                                         <PopoverTrigger asChild>
                                           <button 
                                             type="button" 
                                             className={`w-5 h-5 ${isGain ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.4)]'} text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all`}
                                           >
                                             {isGain ? <TrendingUp className="w-3 h-3 fill-black" /> : <TrendingDown className="w-3 h-3 fill-black" />}
                                           </button>
                                         </PopoverTrigger>
                                         <PopoverContent 
                                           side="top" 
                                           align="end" 
                                           className="bg-white text-black border-none text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] z-[110]"
                                         >
                                           <div className="flex items-center gap-2">
                                             <div className={`w-1 h-3 ${isGain ? 'bg-emerald-500' : 'bg-destructive'}`} />
                                             Total capital {isGain ? 'appreciation' : 'depreciation'} since acquisition.
                                           </div>
                                         </PopoverContent>
                                       </Popover>
                                    </>
                                  );
                               })()}
                            </div>
                          )}
                        </div>
                        <Input
                          id="currentValue"
                          type="number"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder="6500000"
                          value={formData.currentValue}
                          onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                          required
                          min="0"
                        />
                      </Field>
                    </div>

                    {!['cash', 'emergency_fund'].includes(formData.type) && (
                      <Field>
                        <FieldLabel htmlFor="purchaseDate" className="text-white text-xs">Acquisition Year</FieldLabel>
                        <Input
                          id="purchaseDate"
                          type="number"
                          className="bg-white/5 border-white/10 text-white h-10"
                          placeholder={new Date().getFullYear().toString()}
                          value={formData.purchaseDate}
                          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                          required
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </Field>
                    )}
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
