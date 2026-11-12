"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch, apiPost, apiUpload } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/types";
import {
  Building2, Search, Plus, MoreHorizontal, Pencil, Trash2,
  Eye, Mail, BookOpen, Layers, Video, ClipboardList, Calendar,
  Upload, GraduationCap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────
interface UniversityRow {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  email: string;
  createdAt: string;
  courseCount: number;
}

interface UniversitiesResponse {
  universities: UniversityRow[];
}

interface UniversityCourseRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  accessType: "FREE" | "PAID";
  isPublished: boolean;
  createdAt: string;
  videosCount: number;
  topicsCount: number;
  assignmentsCount: number;
}

interface UniversityDetail extends UniversityRow {
  updatedAt: string;
  courseCount: number;
  courses: UniversityCourseRow[];
}

interface UniversityDetailResponse {
  university: UniversityDetail;
}

// ─── Main Component ─────────────────────────────────────────────────────
export function AdminUniversities() {
  const query = useAppStore((s) => s.query);
  const navigate = useAppStore((s) => s.navigate);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UniversityRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UniversityRow | null>(null);

  const qs = useMemo(() => {
    if (!search.trim()) return "";
    return `?q=${encodeURIComponent(search.trim())}`;
  }, [search]);

  const { data, loading, error, refetch } = useApiFetch<UniversitiesResponse>(
    qs ? `/api/admin/universities${qs}` : "/api/admin/universities",
  );

  // Auto-open Add dialog when query.action=new
  const [lastAction, setLastAction] = useState<string | undefined>(undefined);
  if (query.action !== lastAction) {
    setLastAction(query.action);
    if (query.action === "new") setAddOpen(true);
  }

  const universities = data?.universities || [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search universities…"
                className="h-9 rounded-lg pl-9 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Search universities"
              />
            </div>
          </div>
          <Button className="h-9 gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add University
          </Button>
        </div>
      </Card>

      {/* Count summary */}
      {!loading && !error && universities.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{universities.length}</span>{" "}
            universit{universities.length !== 1 ? "ies" : "y"}
          </p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-border p-0">
              <div className="h-24 w-full bg-muted" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-10" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          className="m-4"
          icon={<Building2 className="h-5 w-5" />}
          title="Couldn't load universities"
          description={error}
        />
      ) : universities.length === 0 ? (
        <EmptyState
          className="m-4"
          icon={<Building2 className="h-5 w-5" />}
          title={search.trim() ? "No matches found" : "No universities yet"}
          description={
            search.trim()
              ? "Try a different search term."
              : "Add your first university partner to start managing their courses."
          }
          action={
            !search.trim() ? (
              <Button onClick={() => setAddOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add University
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {universities.map((u) => (
            <UniversityCard
              key={u.id}
              university={u}
              onView={() => navigate(["admin", "universities", u.id])}
              onEdit={() => setEditTarget(u)}
              onDelete={() => setDeleteTarget(u)}
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      <UniversityFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => {
          refetch();
          setAddOpen(false);
          toast({ title: "University created" });
        }}
      />

      {/* Edit dialog */}
      <UniversityFormDialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        target={editTarget}
        onSaved={() => {
          refetch();
          setEditTarget(null);
          toast({ title: "University updated" });
        }}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete university?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.name}</strong> along with its linked login
              account. Courses authored by this university will be retained on
              the platform with their university link removed. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await apiPost(
                    `/api/admin/universities/${deleteTarget.id}`,
                    null,
                    { method: "DELETE" },
                  );
                  toast({
                    title: "University deleted",
                    description: deleteTarget.name,
                  });
                  setDeleteTarget(null);
                  refetch();
                } catch {
                  /* toast handled in apiPost */
                }
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

// ─── University Card ────────────────────────────────────────────────────
function UniversityCard({
  university,
  onView,
  onEdit,
  onDelete,
}: {
  university: UniversityRow;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = useMemo(
    () =>
      university.name
        .split(/\s+/)
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [university.name],
  );

  return (
    <Card className="group flex flex-col overflow-hidden border-border p-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/30">
      {/* Banner / logo header */}
      <button
        onClick={onView}
        className="relative h-24 overflow-hidden bg-gradient-to-br from-primary via-primary to-[#2A3F35] text-left"
        aria-label={`View ${university.name} details`}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(120,151,134,0.55), transparent 55%), radial-gradient(circle at 80% 20%, rgba(252,252,250,0.12), transparent 45%)",
          }}
        />
        <div className="relative flex h-full items-center gap-3 p-4">
          {university.logo ? (
            <img
              src={university.logo}
              alt={`${university.name} logo`}
              className="h-14 w-14 rounded-lg bg-background object-contain p-1 ring-1 ring-background/30 shadow-sm"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-background/95 text-primary font-heading text-lg font-bold shadow-sm">
              {initials || <GraduationCap className="h-6 w-6" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Badge className="border-0 bg-primary-foreground/15 text-primary-foreground backdrop-blur">
              <Building2 className="h-3 w-3 mr-1" /> University
            </Badge>
          </div>
        </div>
      </button>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <button onClick={onView} className="text-left">
          <h3 className="font-heading font-semibold text-foreground line-clamp-1 transition-colors duration-200 group-hover:text-accent">
            {university.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {university.description || "No description provided."}
          </p>
        </button>

        {/* Email */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5 text-accent" />
          <span className="truncate">{university.email}</span>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-accent" />
            <span className="font-semibold text-foreground">{university.courseCount}</span>{" "}
            {university.courseCount === 1 ? "course" : "courses"}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground ml-auto">
            <Calendar className="h-3.5 w-3.5 text-accent" />
            {formatDate(university.createdAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" className="h-9 flex-1 gap-1.5" onClick={onView}>
            <Eye className="h-3.5 w-3.5" /> View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={onEdit}
            aria-label="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2"
                aria-label={`More actions for ${university.name}`}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onView} className="gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" /> View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="h-4 w-4 text-muted-foreground" /> Edit details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={onDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

// ─── Form Dialog (Add / Edit) ───────────────────────────────────────────
interface FormValues {
  name: string;
  email: string;
  password: string;
  description: string;
  logoFile: File | null;
  logoPreview: string | null;
}

function UniversityFormDialog({
  open,
  onOpenChange,
  target,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target?: UniversityRow | null;
  onSaved: () => void;
}) {
  const isEdit = !!target;
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    password: "",
    description: "",
    logoFile: null,
    logoPreview: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) {
      setValues({
        name: target.name,
        email: target.email,
        password: "",
        description: target.description || "",
        logoFile: null,
        logoPreview: target.logo,
      });
    } else if (open) {
      setValues({
        name: "",
        email: "",
        password: "",
        description: "",
        logoFile: null,
        logoPreview: null,
      });
    }
  }, [target, open]);

  function onLogoSelected(file: File | null) {
    if (!file) {
      setValues((v) => ({ ...v, logoFile: null, logoPreview: target?.logo || null }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setValues((v) => ({ ...v, logoFile: file, logoPreview: previewUrl }));
  }

  async function submit() {
    if (!values.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (!values.email.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    if (!isEdit && !values.password) {
      toast({ title: "Password required", variant: "destructive" });
      return;
    }
    if (values.password && values.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", values.name.trim());
      fd.append("email", values.email.trim());
      if (values.password) fd.append("password", values.password);
      if (values.description.trim()) fd.append("description", values.description.trim());
      if (values.logoFile) fd.append("logo", values.logoFile);

      const url = isEdit
        ? `/api/admin/universities/${target!.id}`
        : "/api/admin/universities";

      // apiUpload uses POST; for PUT we fetch directly with FormData.
      if (isEdit) {
        const res = await fetch(url, {
          method: "PUT",
          body: fd,
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) {
          const msg = json.error || `Request failed (${res.status})`;
          toast({ title: "Error", description: msg, variant: "destructive" });
          throw new Error(msg);
        }
      } else {
        await apiUpload(url, fd);
      }
      onSaved();
    } catch {
      /* toast handled in helpers */
    } finally {
      setSaving(false);
    }
  }

  const previewInitials = values.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            {isEdit ? "Edit University" : "Add New University"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the university profile and its linked login account."
              : "Create a university profile and a login account with role UNIVERSITY."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* Logo preview + upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Logo</Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted flex items-center justify-center shrink-0 ring-1 ring-border">
                {values.logoPreview ? (
                  <img
                    src={values.logoPreview}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : previewInitials ? (
                  <span className="font-heading text-lg font-bold text-primary">
                    {previewInitials}
                  </span>
                ) : (
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-accent hover:underline">
                  <Upload className="h-3.5 w-3.5" />
                  {values.logoFile ? "Change image" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      onLogoSelected(f);
                    }}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP — square format recommended.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uf-name" className="text-xs font-medium text-muted-foreground">
              University Name
            </Label>
            <Input
              id="uf-name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              placeholder="e.g. Sultan Qaboos University"
              className="h-9 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uf-email" className="text-xs font-medium text-muted-foreground">
              Login Email
            </Label>
            <Input
              id="uf-email"
              type="email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              placeholder="university@example.com"
              className="h-9 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uf-pass" className="text-xs font-medium text-muted-foreground">
              Password {isEdit && <span className="text-muted-foreground/70">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="uf-pass"
              type="password"
              value={values.password}
              onChange={(e) => setValues({ ...values, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="h-9 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uf-desc" className="text-xs font-medium text-muted-foreground">
              Description <span className="text-muted-foreground/70">(optional)</span>
            </Label>
            <Textarea
              id="uf-desc"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              placeholder="Short summary shown on the university card"
              rows={3}
              className="rounded-lg"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} className="h-9" onClick={submit}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create University"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Drawer ──────────────────────────────────────────────────────
function UniversityDetailDrawer({
  target,
  onOpenChange,
}: {
  target: UniversityRow | null;
  onOpenChange: (v: boolean) => void;
}) {
  const open = !!target;
  const { data, loading, error } = useApiFetch<UniversityDetailResponse>(
    target ? `/api/admin/universities/${target.id}` : null,
  );

  // Reset fetch when drawer closes — pass null url above handles that
  const university = data?.university || target;
  const initials = useMemo(() => {
    if (!university) return "";
    return university.name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [university]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[88vh]">
        <div className="mx-auto w-full max-w-3xl">
          <DrawerHeader className="border-b border-border">
            <DrawerTitle className="font-heading text-xl font-semibold text-foreground">
              {university?.name}
            </DrawerTitle>
            <DrawerDescription>
              {university?.description || "No description provided."}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 p-4 md:p-6 overflow-y-auto max-h-[calc(88vh-6rem)] scrollbar-thin">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ) : error ? (
              <EmptyState
                icon={<Building2 className="h-5 w-5" />}
                title="Couldn't load details"
                description={error}
              />
            ) : university ? (
              <>
                {/* Header card */}
                <Card className="overflow-hidden border-border p-0">
                  <div className="relative h-24 bg-gradient-to-br from-primary via-primary to-[#2A3F35]">
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 20% 50%, rgba(120,151,134,0.55), transparent 55%), radial-gradient(circle at 80% 20%, rgba(252,252,250,0.12), transparent 45%)",
                      }}
                    />
                  </div>
                  <div className="relative -mt-10 px-5 pb-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex items-end gap-3">
                        {university.logo ? (
                          <img
                            src={university.logo}
                            alt={`${university.name} logo`}
                            className="h-20 w-20 rounded-xl bg-background object-contain p-1.5 ring-2 ring-background shadow-sm"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-background text-primary font-heading text-2xl font-bold ring-2 ring-background shadow-sm">
                            {initials || <GraduationCap className="h-7 w-7" />}
                          </div>
                        )}
                        <div className="pb-1">
                          <Badge className="gap-1">
                            <Building2 className="h-3 w-3" /> University Partner
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <DetailStat
                    icon={<BookOpen className="h-4 w-4" />}
                    label="Courses"
                    value={university.courseCount}
                  />
                  <DetailStat
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={university.email}
                    isText
                  />
                  <DetailStat
                    icon={<Calendar className="h-4 w-4" />}
                    label="Joined"
                    value={formatDate(university.createdAt)}
                    isText
                  />
                  <DetailStat
                    icon={<GraduationCap className="h-4 w-4" />}
                    label="Status"
                    value="Active"
                    isText
                  />
                </div>

                {/* Description block */}
                {university.description && (
                  <Card className="border-border p-5">
                    <h4 className="font-heading text-sm font-semibold text-foreground mb-2">
                      About
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {university.description}
                    </p>
                  </Card>
                )}

                {/* Courses list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-sm font-semibold text-foreground">
                      Courses by this University
                    </h4>
                    <Badge variant="outline">
                      {university.courseCount} total
                    </Badge>
                  </div>

                  {university.courses?.length === 0 ? (
                    <EmptyState
                      icon={<BookOpen className="h-5 w-5" />}
                      title="No courses yet"
                      description="This university hasn't authored any courses."
                    />
                  ) : (
                    <div className="space-y-2">
                      {university.courses?.map((c) => (
                        <CourseRowItem key={c.id} course={c} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DetailStat({
  icon,
  label,
  value,
  isText,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <Card className="border-border p-3">
      <div className="flex items-center gap-2 text-accent">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <p
        className={`mt-1.5 font-heading font-semibold text-foreground ${
          isText ? "text-sm truncate" : "text-xl"
        }`}
        title={isText ? String(value) : undefined}
      >
        {isText && typeof value === "string"
          ? value.length > 22
            ? value.slice(0, 20) + "…"
            : value
          : typeof value === "number"
            ? value.toLocaleString()
            : value}
      </p>
    </Card>
  );
}

function CourseRowItem({ course }: { course: UniversityCourseRow }) {
  return (
    <Card className="border-border p-3 transition-colors duration-200 hover:bg-muted/30">
      <div className="flex items-start gap-3">
        <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h5 className="font-medium text-sm text-foreground line-clamp-1">
              {course.title}
            </h5>
            <div className="flex gap-1 shrink-0">
              {course.accessType === "FREE" ? (
                <Badge variant="outline" className="text-success border-success/30">
                  Free
                </Badge>
              ) : (
                <Badge variant="outline" className="text-primary border-primary/30">
                  Paid
                </Badge>
              )}
              {course.isPublished ? (
                <Badge className="bg-success/95 text-success-foreground">Published</Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
            </div>
          </div>
          {course.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {course.description}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3 text-accent" />
              {course.topicsCount} topics
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3 text-accent" />
              {course.videosCount} lessons
            </span>
            <span className="flex items-center gap-1">
              <ClipboardList className="h-3 w-3 text-accent" />
              {course.assignmentsCount} assignments
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
