"use client";

import { useEffect, useState } from "react";
// (useEffect retained for form sync in PlanFormDialog)
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch, apiPost } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatPrice, durationUnitLabel, type SubscriptionPlanPublic } from "@/types";
import {
  CreditCard, Plus, MoreHorizontal, Pencil, Trash2, Star, Plus as PlusIcon,
  X, Check,
} from "lucide-react";

interface PlansResponse { plans: SubscriptionPlanPublic[] }

export function AdminPlans() {
  const query = useAppStore((s) => s.query);
  const { data, loading, error, refetch } = useApiFetch<PlansResponse>("/api/admin/plans");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubscriptionPlanPublic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlanPublic | null>(null);

  // Auto-open Add dialog when query.action=new — React 19 "store previous value" pattern
  const [lastAction, setLastAction] = useState<string | undefined>(undefined);
  if (query.action !== lastAction) {
    setLastAction(query.action);
    if (query.action === "new") setAddOpen(true);
  }

  async function toggleActive(plan: SubscriptionPlanPublic) {
    try {
      await apiPost(`/api/admin/plans/${plan.id}/activate`, { isActive: !plan.isActive }, { method: "PATCH" });
      toast({
        title: plan.isActive ? "Plan deactivated" : "Plan activated",
        description: plan.name,
      });
      refetch();
    } catch { /* toast */ }
  }

  const plans = data?.plans || [];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">Subscription Plans</h2>
            <p className="text-xs text-muted-foreground">Define pricing tiers that students can subscribe to.</p>
          </div>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState className="m-4" icon={<CreditCard className="h-5 w-5" />} title="Couldn't load plans" description={error} />
        ) : plans.length === 0 ? (
          <EmptyState
            className="m-4"
            icon={<CreditCard className="h-5 w-5" />}
            title="No subscription plans yet"
            description="Create your first plan to start enrolling students."
            action={<Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Plan</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="hidden md:table-cell text-center">Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{p.name}</p>
                      {p.isPopular && (
                        <Badge className="bg-accent text-accent-foreground gap-1">
                          <Star className="h-3 w-3 fill-current" /> Popular
                        </Badge>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[260px]">{p.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-heading font-semibold text-foreground">
                      {formatPrice(p.price, p.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.duration} {durationUnitLabel(p.durationUnit).toLowerCase()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center text-sm text-foreground">
                    {p.features.length}
                  </TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <Badge className="bg-success/15 text-success">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${p.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditTarget(p); setAddOpen(true); }}>
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(p)}>
                          {p.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(p)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <PlanFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        target={editTarget}
        onSaved={() => {
          refetch();
          setAddOpen(false);
          setEditTarget(null);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subscription plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete <strong>{deleteTarget?.name}</strong>. Plans assigned to existing subscriptions cannot be deleted —
              deactivate them instead. Historical subscription records are always preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await apiPost(`/api/admin/plans/${deleteTarget.id}`, null, { method: "DELETE" });
                  toast({ title: "Plan deleted", description: deleteTarget.name });
                  setDeleteTarget(null);
                  refetch();
                } catch { /* toast */ }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface PlanFormValues {
  name: string;
  description: string;
  price: string;
  currency: string;
  duration: string;
  durationUnit: "DAYS" | "WEEKS" | "MONTHS" | "YEARS";
  features: string[];
  benefits: string[];
  isActive: boolean;
  isPopular: boolean;
}

const EMPTY_VALUES: PlanFormValues = {
  name: "",
  description: "",
  price: "0",
  currency: "OMR",
  duration: "1",
  durationUnit: "MONTHS",
  features: [""],
  benefits: [""],
  isActive: true,
  isPopular: false,
};

function PlanFormDialog({
  open, onOpenChange, target, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: SubscriptionPlanPublic | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<PlanFormValues>(EMPTY_VALUES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) {
      setValues({
        name: target.name,
        description: target.description || "",
        price: String(target.price),
        currency: target.currency,
        duration: String(target.duration),
        durationUnit: target.durationUnit,
        features: target.features.length ? target.features : [""],
        benefits: target.benefits.length ? target.benefits : [""],
        isActive: target.isActive,
        isPopular: target.isPopular,
      });
    } else if (open) {
      setValues(EMPTY_VALUES);
    }
  }, [target, open]);

  function setFeature(i: number, val: string) {
    setValues((v) => {
      const next = [...v.features];
      next[i] = val;
      return { ...v, features: next };
    });
  }
  function addFeature() {
    setValues((v) => ({ ...v, features: [...v.features, ""] }));
  }
  function removeFeature(i: number) {
    setValues((v) => ({ ...v, features: v.features.filter((_, idx) => idx !== i) }));
  }
  function setBenefit(i: number, val: string) {
    setValues((v) => {
      const next = [...v.benefits];
      next[i] = val;
      return { ...v, benefits: next };
    });
  }
  function addBenefit() {
    setValues((v) => ({ ...v, benefits: [...v.benefits, ""] }));
  }
  function removeBenefit(i: number) {
    setValues((v) => ({ ...v, benefits: v.benefits.filter((_, idx) => idx !== i) }));
  }

  async function submit() {
    if (!values.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    const priceNum = parseFloat(values.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    const durationNum = parseInt(values.duration, 10);
    if (Number.isNaN(durationNum) || durationNum < 1) {
      toast({ title: "Invalid duration", variant: "destructive" });
      return;
    }

    const cleanedFeatures = values.features.map((f) => f.trim()).filter(Boolean);
    const cleanedBenefits = values.benefits.map((b) => b.trim()).filter(Boolean);

    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        price: priceNum,
        currency: values.currency,
        duration: durationNum,
        durationUnit: values.durationUnit,
        features: cleanedFeatures,
        benefits: cleanedBenefits,
        isActive: values.isActive,
        isPopular: values.isPopular,
      };
      if (target) {
        await apiPost(`/api/admin/plans/${target.id}`, payload, { method: "PUT" });
        toast({ title: "Plan updated" });
      } else {
        await apiPost("/api/admin/plans", payload);
        toast({ title: "Plan created" });
      }
      onSaved();
    } catch { /* toast */ } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{target ? "Edit Plan" : "Create Subscription Plan"}</DialogTitle>
          <DialogDescription>Define pricing, duration and feature highlights.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Plan Name</Label>
            <Input id="p-name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="e.g. Pro Annual" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description (optional)</Label>
            <Textarea id="p-desc" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Price</Label>
              <Input id="p-price" type="number" min="0" step="0.01" value={values.price} onChange={(e) => setValues({ ...values, price: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cur">Currency</Label>
              <Input id="p-cur" value={values.currency} onChange={(e) => setValues({ ...values, currency: e.target.value })} maxLength={5} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-dur">Duration</Label>
              <Input id="p-dur" type="number" min="1" value={values.duration} onChange={(e) => setValues({ ...values, duration: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration Unit</Label>
              <Select value={values.durationUnit} onValueChange={(v) => setValues({ ...values, durationUnit: v as "DAYS" | "WEEKS" | "MONTHS" | "YEARS" })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAYS">Days</SelectItem>
                  <SelectItem value="WEEKS">Weeks</SelectItem>
                  <SelectItem value="MONTHS">Months</SelectItem>
                  <SelectItem value="YEARS">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Features list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Features</Label>
              <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={addFeature}>
                <PlusIcon className="h-3 w-3" /> Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">Bullet points shown to students on the pricing card.</p>
            <div className="space-y-2">
              {values.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                  <Input
                    value={f}
                    onChange={(e) => setFeature(i, e.target.value)}
                    placeholder="e.g. Access to all premium courses"
                  />
                  <Button variant="ghost" size="icon" aria-label="Remove feature" onClick={() => removeFeature(i)}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              {values.features.length === 0 && (
                <p className="text-xs text-muted-foreground">No features added.</p>
              )}
            </div>
          </div>

          {/* Benefits list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Benefits</Label>
              <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={addBenefit}>
                <PlusIcon className="h-3 w-3" /> Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">Internal notes about this plan&apos;s advantages.</p>
            <div className="space-y-2">
              {values.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-accent shrink-0" />
                  <Input
                    value={b}
                    onChange={(e) => setBenefit(i, e.target.value)}
                    placeholder="e.g. Priority support"
                  />
                  <Button variant="ghost" size="icon" aria-label="Remove benefit" onClick={() => removeBenefit(i)}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              {values.benefits.length === 0 && (
                <p className="text-xs text-muted-foreground">No benefits added.</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-md border border-border px-3">
              <Label htmlFor="p-active" className="text-sm">Active</Label>
              <Switch id="p-active" checked={values.isActive} onCheckedChange={(v) => setValues({ ...values, isActive: v })} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3">
              <Label htmlFor="p-popular" className="text-sm">Mark as Popular</Label>
              <Switch id="p-popular" checked={values.isPopular} onCheckedChange={(v) => setValues({ ...values, isPopular: v })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving} onClick={submit}>
            {saving ? "Saving…" : target ? "Save Changes" : "Create Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
