"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useApiFetch, apiPost, apiUpload } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { useI18n } from "@/lib/i18n/store";
import { toast } from "@/hooks/use-toast";
import { formatDate, type SubscriptionPlanPublic } from "@/types";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import {
  BookOpen, Search, Plus, MoreHorizontal, Pencil, Trash2, Settings2,
  Eye, EyeOff, Upload, PlayCircle, Video, Layers, CreditCard,
} from "lucide-react";

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  firstVideoUrl?: string | null;
  firstVideoSource?: "UPLOAD" | "YOUTUBE" | "URL" | null;
  category: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  accessType: "FREE" | "PAID";
  isPublished: boolean;
  startDate: string | null;
  endDate: string | null;
  availabilityMode: "ALWAYS" | "SCHEDULED" | "LIMITED";
  enrollmentOpen: boolean;
  createdAt: string;
  topicsCount: number;
  videosCount: number;
  planNames: string[];
}

interface CoursesResponse {
  courses: CourseRow[];
}
interface PlansResponse {
  plans: SubscriptionPlanPublic[];
}

export function UniversityCourses() {
  const { t } = useI18n();
  const navigate = useAppStore((s) => s.navigate);
  const query = useAppStore((s) => s.query);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState<"ALL" | "true" | "false">("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CourseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseRow | null>(null);

  const { data: plansData } = useApiFetch<PlansResponse>("/api/public/plans");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (search.trim()) p.set("q", search.trim());
    if (category) p.set("category", category);
    if (published !== "ALL") p.set("published", published);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [search, category, published]);

  const { data, loading, error, refetch } = useApiFetch<CoursesResponse>(
    qs ? `/api/university/courses${qs}` : "/api/university/courses"
  );

  // Auto-open Add dialog when query.action=new — React 19 "store previous value" pattern
  const [lastAction, setLastAction] = useState<string | undefined>(undefined);
  if (query.action !== lastAction) {
    setLastAction(query.action);
    if (query.action === "new") setAddOpen(true);
  }

  const courses = data?.courses || [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [courses]);

  async function togglePublish(course: CourseRow) {
    try {
      await apiPost(
        `/api/university/courses/${course.id}/publish`,
        { isPublished: !course.isPublished },
        { method: "PATCH" }
      );
      toast({
        title: course.isPublished ? "Course unpublished" : "Course published",
        description: course.title,
      });
      refetch();
    } catch {
      /* toast */
    }
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your courses…"
                className="h-9 rounded-lg pl-9 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("common.search")}
              />
            </div>
            <Select
              value={category || "ALL"}
              onValueChange={(v) => setCategory(v === "ALL" ? "" : v)}
            >
              <SelectTrigger
                className="h-9 w-full rounded-lg sm:w-[160px]"
                aria-label={t("common.category")}
              >
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.allCategories")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={published}
              onValueChange={(v) => setPublished(v as "ALL" | "true" | "false")}
            >
              <SelectTrigger
                className="h-9 w-full rounded-lg sm:w-[140px]"
                aria-label={t("common.status")}
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="true">{t("common.published")}</SelectItem>
                <SelectItem value="false">Drafts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="h-9 gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Create Course
          </Button>
        </div>
      </Card>

      {/* Course count summary */}
      {!loading && !error && courses.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{courses.length}</span>{" "}
            course{courses.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden rounded-lg border-border p-0">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          className="m-4"
          icon={<BookOpen className="h-5 w-5" />}
          title={t("common.error")}
          description={error}
        />
      ) : courses.length === 0 ? (
        <EmptyState
          className="m-4"
          icon={<BookOpen className="h-5 w-5" />}
          title={t("empty.noCourses")}
          description="Create your first course to start adding videos, materials and assignments for your university."
          action={
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Course
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onManage={() => navigate(["university", "courses", c.id])}
              onEdit={() => setEditTarget(c)}
              onTogglePublish={() => togglePublish(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      <CourseFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        plans={plansData?.plans || []}
        onSaved={(id) => {
          if (id) {
            toast({
              title: "Course created",
              description: "Taking you to the course editor.",
            });
            setAddOpen(false);
            navigate(["university", "courses", id]);
          } else {
            refetch();
          }
        }}
      />

      <CourseFormDialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
        target={editTarget}
        plans={plansData?.plans || []}
        onSaved={() => {
          refetch();
          setEditTarget(null);
          toast({ title: "Course updated" });
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong> along with all its
              topics, videos, materials, assignments and submissions. This cannot be undone.
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
                    `/api/university/courses/${deleteTarget.id}`,
                    null,
                    { method: "DELETE" }
                  );
                  toast({ title: "Course deleted", description: deleteTarget.title });
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

interface CourseFormValues {
  title: string;
  description: string;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  accessType: "FREE" | "PAID";
  isPublished: boolean;
  thumbnail: string;
  planIds: string[];
  startDate: string;
  endDate: string;
  availabilityMode: "ALWAYS" | "SCHEDULED" | "LIMITED";
}

function CourseFormDialog({
  open,
  onOpenChange,
  target,
  plans,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target?: CourseRow | null;
  plans: SubscriptionPlanPublic[];
  onSaved: (createdId?: string) => void;
}) {
  const isEdit = !!target;
  const [values, setValues] = useState<CourseFormValues>({
    title: "",
    description: "",
    category: "",
    level: "BEGINNER",
    accessType: "FREE",
    isPublished: false,
    thumbnail: "",
    planIds: [],
    startDate: "",
    endDate: "",
    availabilityMode: "ALWAYS",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  useEffect(() => {
    if (target) {
      const toLocalDate = (iso: string | null) => {
        if (!iso) return "";
        const d = new Date(iso);
        const off = d.getTimezoneOffset();
        const local = new Date(d.getTime() - off * 60 * 1000);
        return local.toISOString().slice(0, 10);
      };
      setValues({
        title: target.title,
        description: target.description || "",
        category: target.category || "",
        level: target.level,
        accessType: target.accessType,
        isPublished: target.isPublished,
        thumbnail: target.thumbnail || "",
        planIds: [],
        startDate: toLocalDate(target.startDate),
        endDate: toLocalDate(target.endDate),
        availabilityMode: target.availabilityMode,
      });
    } else if (open) {
      setValues({
        title: "",
        description: "",
        category: "",
        level: "BEGINNER",
        accessType: "FREE",
        isPublished: false,
        thumbnail: "",
        planIds: [],
        startDate: "",
        endDate: "",
        availabilityMode: "ALWAYS",
      });
    }
  }, [target, open]);

  function togglePlan(id: string) {
    setValues((v) => ({
      ...v,
      planIds: v.planIds.includes(id)
        ? v.planIds.filter((p) => p !== id)
        : [...v.planIds, id],
    }));
  }

  async function uploadThumbnail(file: File) {
    if (!target) {
      toast({
        title: "Save the course first",
        description: "Thumbnail upload is available after the course is created.",
        variant: "default",
      });
      return;
    }
    setUploadingThumb(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<{ thumbnail: string }>(
        `/api/university/courses/${target.id}/thumbnail`,
        fd
      );
      setValues((v) => ({ ...v, thumbnail: res.thumbnail }));
      toast({ title: "Thumbnail uploaded" });
    } catch {
      /* toast */
    } finally {
      setUploadingThumb(false);
    }
  }

  async function submit() {
    if (!values.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (values.accessType === "PAID" && values.planIds.length === 0) {
      toast({
        title: "Select at least one plan",
        description: "Paid courses must be assigned to one or more subscription plans.",
        variant: "destructive",
      });
      return;
    }
    if (
      values.availabilityMode !== "ALWAYS" &&
      values.startDate &&
      values.endDate &&
      new Date(values.endDate) < new Date(values.startDate)
    ) {
      toast({
        title: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit && target) {
        await apiPost(`/api/university/courses/${target.id}`, {
          title: values.title.trim(),
          description: values.description.trim() || null,
          category: values.category.trim() || null,
          level: values.level,
          accessType: values.accessType,
          isPublished: values.isPublished,
          thumbnail: values.thumbnail || null,
          availabilityMode: values.availabilityMode,
          startDate: values.startDate || null,
          endDate: values.endDate || null,
          ...(values.accessType === "PAID" ? { planIds: values.planIds } : {}),
        }, { method: "PUT" });
        onSaved();
      } else {
        const res = await apiPost<{ course: { id: string } }>(
          "/api/university/courses",
          {
            title: values.title.trim(),
            description: values.description.trim() || null,
            category: values.category.trim() || null,
            level: values.level,
            accessType: values.accessType,
            isPublished: values.isPublished,
            thumbnail: values.thumbnail || null,
            planIds: values.planIds,
            availabilityMode: values.availabilityMode,
            startDate: values.startDate || null,
            endDate: values.endDate || null,
          }
        );
        onSaved(res.course.id);
      }
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-scale-in w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            {isEdit ? "Edit Course" : "Create New Course"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update course details. Plan assignment and content can be edited in the course manager."
              : "Set up the basics. The course will be automatically scoped to your university."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
          <div className="space-y-1.5">
            <Label htmlFor="cf-title" className="text-xs font-medium text-muted-foreground">
              Title
            </Label>
            <Input
              id="cf-title"
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              placeholder="e.g. Digital Marketing Fundamentals"
              className="h-9 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-desc" className="text-xs font-medium text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="cf-desc"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              placeholder="Short summary shown on course cards"
              rows={3}
              className="rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-cat" className="text-xs font-medium text-muted-foreground">
                Category
              </Label>
              <Input
                id="cf-cat"
                value={values.category}
                onChange={(e) => setValues({ ...values, category: e.target.value })}
                placeholder="e.g. Marketing"
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Level</Label>
              <Select
                value={values.level}
                onValueChange={(v) =>
                  setValues({
                    ...values,
                    level: v as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
                  })
                }
              >
                <SelectTrigger className="w-full h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Availability Mode</Label>
            <Select
              value={values.availabilityMode}
              onValueChange={(v) =>
                setValues({
                  ...values,
                  availabilityMode: v as "ALWAYS" | "SCHEDULED" | "LIMITED",
                })
              }
            >
              <SelectTrigger className="w-full h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALWAYS">Always Available</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled (between dates)</SelectItem>
                <SelectItem value="LIMITED">Limited Enrollment</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {values.availabilityMode === "ALWAYS"
                ? "Course is available to students at any time."
                : values.availabilityMode === "SCHEDULED"
                  ? "Course is only available between the start and end dates below."
                  : "Enrollment closes after the end date; existing students keep access."}
            </p>
          </div>
          {values.availabilityMode !== "ALWAYS" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="cf-start"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Start Date
                </Label>
                <Input
                  id="cf-start"
                  type="date"
                  value={values.startDate}
                  onChange={(e) =>
                    setValues({ ...values, startDate: e.target.value })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="cf-end"
                  className="text-xs font-medium text-muted-foreground"
                >
                  End Date
                </Label>
                <Input
                  id="cf-end"
                  type="date"
                  value={values.endDate}
                  onChange={(e) =>
                    setValues({ ...values, endDate: e.target.value })
                  }
                  className="h-9 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Access Type</Label>
            <Select
              value={values.accessType}
              onValueChange={(v) =>
                setValues({ ...values, accessType: v as "FREE" | "PAID" })
              }
            >
              <SelectTrigger className="w-full h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free — Open to all</SelectItem>
                <SelectItem value="PAID">Paid — Plan-gated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {values.accessType === "PAID" && (
            <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Required Plans
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Students with any of these plans can access this course.
              </p>
              {plans.length === 0 ? (
                <p className="text-xs text-destructive">
                  No subscription plans exist yet. Contact the platform admin.
                </p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                  {plans.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 cursor-pointer rounded-md p-1.5 transition-colors hover:bg-background"
                    >
                      <Checkbox
                        checked={values.planIds.includes(p.id)}
                        onCheckedChange={() => togglePlan(p.id)}
                      />
                      <span className="text-sm text-foreground">{p.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {p.price} {p.currency}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Thumbnail */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Thumbnail</Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-24 overflow-hidden rounded-lg bg-muted flex items-center justify-center shrink-0 ring-1 ring-border">
                {values.thumbnail ? (
                  <img src={values.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <PlayCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Input
                  value={values.thumbnail}
                  onChange={(e) => setValues({ ...values, thumbnail: e.target.value })}
                  placeholder="Paste image URL or upload below"
                  className="h-9 rounded-lg"
                />
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-accent hover:underline">
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingThumb ? "Uploading…" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!isEdit || uploadingThumb}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadThumbnail(f);
                    }}
                  />
                </label>
                {!isEdit && (
                  <p className="text-xs text-muted-foreground">
                    Save course first, then upload thumbnail.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Published switch */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="cf-pub" className="text-sm font-medium">
                Publish immediately
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">If off, course stays as a draft.</p>
            </div>
            <Switch
              id="cf-pub"
              checked={values.isPublished}
              onCheckedChange={(v) => setValues({ ...values, isPublished: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} className="h-9" onClick={submit}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Premium Course Card ────────────────────────────────────────────────
function CourseCard({
  course,
  onManage,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  course: CourseRow;
  onManage: () => void;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  return (
    <Card className="group card-glow flex flex-col overflow-hidden rounded-lg border-border p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-accent/40">
      {/* Cover image */}
      <button onClick={onManage} className="relative h-36 overflow-hidden bg-muted text-left">
        <CourseThumbnail
          thumbnail={course.thumbnail}
          firstVideoUrl={course.firstVideoUrl}
          firstVideoSource={course.firstVideoSource}
          alt={course.title}
          className="h-full w-full"
        />
        {/* Badge overlays */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {course.accessType === "FREE" ? (
            <Badge className="border-0 bg-success/95 text-success-foreground backdrop-blur shadow-sm">
              Free
            </Badge>
          ) : (
            <Badge className="border-0 bg-primary/95 text-primary-foreground backdrop-blur shadow-sm">
              Paid
            </Badge>
          )}
          {course.category && (
            <Badge
              variant="outline"
              className="border-0 bg-background/85 text-foreground backdrop-blur shadow-sm"
            >
              {course.category}
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3">
          {course.isPublished ? (
            <Badge className="border-0 bg-success/95 text-success-foreground backdrop-blur shadow-sm gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success-foreground animate-pulse" /> Published
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-0 bg-background/85 text-muted-foreground backdrop-blur shadow-sm"
            >
              Draft
            </Badge>
          )}
        </div>
      </button>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <button onClick={onManage} className="text-left">
          <h3 className="font-heading font-semibold text-foreground line-clamp-1 transition-colors duration-200 group-hover:text-accent">
            {course.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {course.description || "No description provided."}
          </p>
        </button>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-accent" />
            <span className="font-semibold text-foreground">{course.topicsCount}</span>{" "}
            {course.topicsCount === 1 ? "topic" : "topics"}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Video className="h-3.5 w-3.5 text-accent" />
            <span className="font-semibold text-foreground">{course.videosCount}</span>{" "}
            {course.videosCount === 1 ? "lesson" : "lessons"}
          </span>
          {course.accessType === "PAID" && course.planNames.length > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground truncate">
              <CreditCard className="h-3.5 w-3.5 text-accent" />
              <span className="font-semibold text-foreground">{course.planNames.length}</span>{" "}
              {course.planNames.length === 1 ? "plan" : "plans"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" className="h-9 flex-1 gap-1.5" onClick={onManage}>
            <Settings2 className="h-3.5 w-3.5" /> Manage
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={onEdit}
            aria-label={t("common.edit")}
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
                aria-label={`More actions for ${course.title}`}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onTogglePublish} className="gap-2">
                {course.isPublished ? (
                  <>
                    <EyeOff className="h-4 w-4 text-muted-foreground" /> Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 text-muted-foreground" /> Publish
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="h-4 w-4 text-muted-foreground" /> Edit details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete} className="gap-2">
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Created {formatDate(course.createdAt)}
        </p>
      </div>
    </Card>
  );
}
