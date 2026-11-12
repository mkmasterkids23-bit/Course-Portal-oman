"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch, apiPost } from "@/hooks/use-api";
import { useI18n } from "@/lib/i18n/store";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/types";
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  BookOpen,
  CheckCircle2,
  XCircle,
  UserCircle2,
} from "lucide-react";

interface CourseListItem {
  id: string;
  title: string;
  isPublished: boolean;
}

interface AssignedCourse {
  id: string;
  title: string;
  isPublished: boolean;
}

interface InstructorRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  phone: string | null;
  bio: string | null;
  isActive: boolean;
  assignedCourses: AssignedCourse[];
  assignedCourseIds: string[];
  createdAt: string;
}

interface InstructorsResponse {
  instructors: InstructorRow[];
  courses: CourseListItem[];
}

interface FormValues {
  name: string;
  email: string;
  password: string;
  phone: string;
  bio: string;
  isActive: boolean;
  assignedCourseIds: string[];
}

const DEFAULT_FORM: FormValues = {
  name: "",
  email: "",
  password: "",
  phone: "",
  bio: "",
  isActive: true,
  assignedCourseIds: [],
};

export function UniversityInstructors() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "active" | "inactive">(
    "ALL"
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InstructorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InstructorRow | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (statusFilter !== "ALL") p.set("status", statusFilter);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [search, statusFilter]);

  const { data, loading, error, refetch } = useApiFetch<InstructorsResponse>(
    qs ? `/api/university/instructors${qs}` : "/api/university/instructors"
  );

  const instructors = data?.instructors || [];
  const courses = data?.courses || [];

  async function quickToggleActive(inst: InstructorRow) {
    try {
      await apiPost(
        `/api/university/instructors/${inst.id}`,
        { isActive: !inst.isActive },
        { method: "PUT" }
      );
      toast({
        title: inst.isActive ? "Deactivated" : "Activated",
        description: inst.name,
      });
      refetch();
    } catch {
      /* toast */
    }
  }

  const activeCount = instructors.filter((i) => i.isActive).length;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="rounded-lg border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-soft-sage text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  {instructors.length}
                </p>
                <p className="text-xs text-muted-foreground">Total instructors</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-lg border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  {activeCount}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-lg border-border bg-card p-4 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  {instructors.reduce(
                    (n, i) => n + i.assignedCourses.length,
                    0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Course assignments</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter card */}
      <Card className="rounded-lg border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="h-9 rounded-lg pl-9 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("common.search")}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "ALL" | "active" | "inactive")
              }
            >
              <SelectTrigger
                className="h-9 w-full rounded-lg sm:w-[140px]"
                aria-label={t("common.status")}
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="active">{t("common.active")}</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="h-9 gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Instructor
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card className="rounded-lg border-border p-0 overflow-hidden">
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </Card>
      ) : error ? (
        <EmptyState
          className="m-4"
          icon={<Users className="h-5 w-5" />}
          title={t("common.error")}
          description={error}
        />
      ) : instructors.length === 0 ? (
        <EmptyState
          className="m-4"
          icon={<Users className="h-5 w-5" />}
          title={t("empty.noStudents")}
          description="Add teaching staff and assign them to specific courses. Instructors can be activated or deactivated anytime."
          action={
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Instructor
            </Button>
          }
        />
      ) : (
        <Card className="rounded-lg border-border bg-card p-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Instructor
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Assigned Courses
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Joined
                  </TableHead>
                  <TableHead className="w-[60px] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((inst) => (
                  <TableRow
                    key={inst.id}
                    className="group transition-colors hover:bg-muted/40"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-1 ring-border">
                          {inst.profilePhoto ? (
                            <img
                              src={inst.profilePhoto}
                              alt={inst.name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                          <AvatarFallback className="bg-soft-sage text-primary text-xs font-semibold">
                            {initials(inst.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {inst.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {inst.email}
                          </p>
                          {inst.phone && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />
                              {inst.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {inst.assignedCourses.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          No courses assigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {inst.assignedCourses.slice(0, 3).map((c) => (
                            <Badge
                              key={c.id}
                              variant="outline"
                              className="bg-soft-sage/40 text-primary text-[11px]"
                            >
                              {c.title}
                            </Badge>
                          ))}
                          {inst.assignedCourses.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[11px] text-muted-foreground"
                            >
                              +{inst.assignedCourses.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {inst.isActive ? (
                        <Badge className="gap-1 border-0 bg-success/95 text-success-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-success-foreground animate-pulse" />
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(inst.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label={`Actions for ${inst.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => setEditTarget(inst)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => quickToggleActive(inst)}
                            className="gap-2"
                          >
                            {inst.isActive ? (
                              <>
                                <XCircle className="h-4 w-4" /> Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4" /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(inst)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <InstructorFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        courses={courses}
        onSaved={() => {
          setAddOpen(false);
          refetch();
          toast({ title: "Instructor added" });
        }}
      />

      <InstructorFormDialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        target={editTarget}
        courses={courses}
        onSaved={() => {
          setEditTarget(null);
          refetch();
          toast({ title: "Instructor updated" });
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete instructor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.name}</strong> and remove their access.
              Their course assignments will be cleared. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await apiPost(
                    `/api/university/instructors/${deleteTarget.id}`,
                    null,
                    { method: "DELETE" }
                  );
                  toast({
                    title: "Instructor deleted",
                    description: deleteTarget.name,
                  });
                  setDeleteTarget(null);
                  refetch();
                } catch {
                  /* toast */
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

function initials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Form Dialog ──────────────────────────────────────────────────────────
function InstructorFormDialog({
  target,
  courses,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target?: InstructorRow | null;
  courses: CourseListItem[];
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const isEdit = !!target;
  const [values, setValues] = useState<FormValues>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) {
      setValues({
        name: target.name,
        email: target.email,
        password: "",
        phone: target.phone || "",
        bio: target.bio || "",
        isActive: target.isActive,
        assignedCourseIds: target.assignedCourseIds,
      });
    } else if (open) {
      setValues(DEFAULT_FORM);
    }
  }, [target, open]);

  function toggleCourse(id: string) {
    setValues((v) => ({
      ...v,
      assignedCourseIds: v.assignedCourseIds.includes(id)
        ? v.assignedCourseIds.filter((c) => c !== id)
        : [...v.assignedCourseIds, id],
    }));
  }

  async function submit() {
    if (!values.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!values.email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    if (!isEdit && values.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit && target) {
        const payload: Record<string, unknown> = {
          name: values.name.trim(),
          phone: values.phone.trim() || null,
          bio: values.bio.trim() || null,
          isActive: values.isActive,
          assignedCourseIds: values.assignedCourseIds,
        };
        if (values.password) payload.password = values.password;
        await apiPost(
          `/api/university/instructors/${target.id}`,
          payload,
          { method: "PUT" }
        );
      } else {
        await apiPost("/api/university/instructors", {
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
          phone: values.phone.trim() || null,
          bio: values.bio.trim() || null,
          isActive: values.isActive,
          assignedCourseIds: values.assignedCourseIds,
        });
      }
      onSaved();
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            {isEdit ? "Edit Instructor" : "Add Instructor"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update profile, assigned courses and access status."
              : "Create a new instructor account and assign them to courses."}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label
                htmlFor="ins-name"
                className="text-xs font-medium text-muted-foreground"
              >
                Full name
              </Label>
              <Input
                id="ins-name"
                value={values.name}
                onChange={(e) =>
                  setValues({ ...values, name: e.target.value })
                }
                placeholder="e.g. Dr. Sarah Lin"
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label
                htmlFor="ins-email"
                className="text-xs font-medium text-muted-foreground"
              >
                Email
              </Label>
              <Input
                id="ins-email"
                type="email"
                value={values.email}
                onChange={(e) =>
                  setValues({ ...values, email: e.target.value })
                }
                placeholder="instructor@uni.edu"
                className="h-9 rounded-lg"
                disabled={isEdit}
              />
              {isEdit && (
                <p className="text-[11px] text-muted-foreground">
                  Email cannot be changed.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="ins-pass"
              className="text-xs font-medium text-muted-foreground"
            >
              {isEdit ? "New password (optional)" : "Password"}
            </Label>
            <Input
              id="ins-pass"
              type="password"
              value={values.password}
              onChange={(e) =>
                setValues({ ...values, password: e.target.value })
              }
              placeholder={
                isEdit ? "Leave blank to keep current" : "Min 6 characters"
              }
              className="h-9 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="ins-phone"
                className="text-xs font-medium text-muted-foreground"
              >
                Phone
              </Label>
              <Input
                id="ins-phone"
                value={values.phone}
                onChange={(e) =>
                  setValues({ ...values, phone: e.target.value })
                }
                placeholder="+968 9xxx xxxx"
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Status
              </Label>
              <div className="flex items-center justify-between rounded-lg border border-border h-9 px-3">
                <span className="text-sm text-foreground">
                  {values.isActive ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={values.isActive}
                  onCheckedChange={(v) =>
                    setValues({ ...values, isActive: v })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="ins-bio"
              className="text-xs font-medium text-muted-foreground"
            >
              Bio (optional)
            </Label>
            <Input
              id="ins-bio"
              value={values.bio}
              onChange={(e) => setValues({ ...values, bio: e.target.value })}
              placeholder="Short intro shown on instructor profile"
              className="h-9 rounded-lg"
            />
          </div>

          {/* Assigned courses */}
          <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Assigned Courses
              </Label>
              <span className="text-xs text-muted-foreground">
                {values.assignedCourseIds.length} selected
              </span>
            </div>
            {courses.length === 0 ? (
              <p className="text-xs text-destructive">
                You have no courses yet. Create one first.
              </p>
            ) : (
              <div className="max-h-44 space-y-1 overflow-y-auto scrollbar-thin pr-1">
                {courses.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-background"
                  >
                    <Checkbox
                      checked={values.assignedCourseIds.includes(c.id)}
                      onCheckedChange={() => toggleCourse(c.id)}
                    />
                    <span className="flex-1 text-sm text-foreground truncate">
                      {c.title}
                    </span>
                    {!c.isPublished && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground"
                      >
                        Draft
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="h-9"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={saving} className="h-9" onClick={submit}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Instructor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
