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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch, apiPost, apiUpload } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { toast } from "@/hooks/use-toast";
import { formatDate, type SubscriptionPlanPublic } from "@/types";
import {
  BookOpen, Search, Plus, MoreHorizontal, Pencil, Trash2, Settings2,
  Eye, EyeOff, Upload, PlayCircle,
} from "lucide-react";

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  accessType: "FREE" | "PAID";
  isPublished: boolean;
  createdAt: string;
  topicsCount: number;
  videosCount: number;
  planNames: string[];
}

interface CoursesResponse { courses: CourseRow[] }
interface PlansResponse { plans: SubscriptionPlanPublic[] }

export function AdminCourses() {
  const query = useAppStore((s) => s.query);
  const navigate = useAppStore((s) => s.navigate);
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
    qs ? `/api/admin/courses${qs}` : "/api/admin/courses"
  );

  // Auto-open Add dialog when query.action=new — React 19 "store previous value" pattern
  const [lastAction, setLastAction] = useState<string | undefined>(undefined);
  if (query.action !== lastAction) {
    setLastAction(query.action);
    if (query.action === "new") setAddOpen(true);
  }

  const courses = data?.courses || [];

  // Derive unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => { if (c.category) set.add(c.category); });
    return Array.from(set).sort();
  }, [courses]);

  async function togglePublish(course: CourseRow) {
    try {
      await apiPost(`/api/admin/courses/${course.id}/publish`, {
        isPublished: !course.isPublished,
      }, { method: "PATCH" });
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
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses…"
                className="pl-9"
                aria-label="Search courses"
              />
            </div>
            <Select value={category || "ALL"} onValueChange={(v) => setCategory(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={published}
              onValueChange={(v) => setPublished(v as "ALL" | "true" | "false")}
            >
              <SelectTrigger className="w-full sm:w-[140px]" aria-label="Filter by published state">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="true">Published</SelectItem>
                <SelectItem value="false">Drafts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Create Course
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            className="m-4"
            icon={<BookOpen className="h-5 w-5" />}
            title="Couldn't load courses"
            description={error}
          />
        ) : courses.length === 0 ? (
          <EmptyState
            className="m-4"
            icon={<BookOpen className="h-5 w-5" />}
            title="No courses yet"
            description="Create your first course to start adding videos, materials and assignments."
            action={<Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Course</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">Cover</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden lg:table-cell">Plans</TableHead>
                <TableHead className="hidden md:table-cell text-center">Topics</TableHead>
                <TableHead className="hidden md:table-cell text-center">Videos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="h-10 w-14 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                      {c.thumbnail ? (
                        <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <PlayCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-left"
                      onClick={() => navigate(["admin", "courses", c.id])}
                    >
                      <p className="font-medium text-foreground hover:text-accent transition-colors">{c.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[260px]">
                        {c.description || "No description"}
                      </p>
                    </button>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {c.category || "—"}
                  </TableCell>
                  <TableCell>
                    {c.accessType === "FREE" ? (
                      <Badge className="bg-success/15 text-success hover:bg-success/20">Free</Badge>
                    ) : (
                      <Badge className="bg-primary text-primary-foreground">Paid</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {c.planNames.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.planNames.slice(0, 2).map((n, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                        ))}
                        {c.planNames.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{c.planNames.length - 2}</Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-center text-sm text-foreground">{c.topicsCount}</TableCell>
                  <TableCell className="hidden md:table-cell text-center text-sm text-foreground">{c.videosCount}</TableCell>
                  <TableCell>
                    {c.isPublished ? (
                      <Badge className="bg-success/15 text-success hover:bg-success/20">Published</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${c.title}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(["admin", "courses", c.id])}>
                          <Settings2 className="h-4 w-4" /> Manage content
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditTarget(c)}>
                          <Pencil className="h-4 w-4" /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish(c)}>
                          {c.isPublished ? (
                            <><EyeOff className="h-4 w-4" /> Unpublish</>
                          ) : (
                            <><Eye className="h-4 w-4" /> Publish</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(c)}>
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

      <CourseFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        plans={plansData?.plans || []}
        onSaved={(id) => {
          if (id) {
            toast({ title: "Course created", description: "Taking you to the course editor." });
            setAddOpen(false);
            navigate(["admin", "courses", id]);
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.title}</strong> along with all its
              topics, videos, materials, assignments and submissions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await apiPost(`/api/admin/courses/${deleteTarget.id}`, null, { method: "DELETE" });
                  toast({ title: "Course deleted", description: deleteTarget.title });
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

interface CourseFormValues {
  title: string;
  description: string;
  category: string;
  accessType: "FREE" | "PAID";
  isPublished: boolean;
  thumbnail: string;
  planIds: string[];
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
    accessType: "FREE",
    isPublished: false,
    thumbnail: "",
    planIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  useEffect(() => {
    if (target) {
      setValues({
        title: target.title,
        description: target.description || "",
        category: target.category || "",
        accessType: target.accessType,
        isPublished: target.isPublished,
        thumbnail: target.thumbnail || "",
        planIds: [],
      });
    } else if (open) {
      setValues({
        title: "",
        description: "",
        category: "",
        accessType: "FREE",
        isPublished: false,
        thumbnail: "",
        planIds: [],
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
      // No course yet — defer; just keep file URL empty and warn user
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
      const res = await apiUpload<{ thumbnail: string }>(`/api/admin/courses/${target.id}/thumbnail`, fd);
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

    setSaving(true);
    try {
      if (isEdit && target) {
        await apiPost(`/api/admin/courses/${target.id}`, {
          title: values.title.trim(),
          description: values.description.trim() || null,
          category: values.category.trim() || null,
          accessType: values.accessType,
          isPublished: values.isPublished,
          thumbnail: values.thumbnail || null,
          ...(values.accessType === "PAID" ? { planIds: values.planIds } : {}),
        }, { method: "PUT" });
        onSaved();
      } else {
        const res = await apiPost<{ course: { id: string } }>("/api/admin/courses", {
          title: values.title.trim(),
          description: values.description.trim() || null,
          category: values.category.trim() || null,
          accessType: values.accessType,
          isPublished: values.isPublished,
          thumbnail: values.thumbnail || null,
          planIds: values.planIds,
        });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Course" : "Create New Course"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update course details. Plan assignment and content can be edited in the course manager."
              : "Set up the basics. You'll be able to add topics, videos and assignments next."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="cf-title">Title</Label>
            <Input id="cf-title" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} placeholder="e.g. Digital Marketing Fundamentals" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-desc">Description</Label>
            <Textarea id="cf-desc" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} placeholder="Short summary shown on course cards" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-cat">Category</Label>
              <Input id="cf-cat" value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })} placeholder="e.g. Marketing" />
            </div>
            <div className="space-y-1.5">
              <Label>Access Type</Label>
              <Select value={values.accessType} onValueChange={(v) => setValues({ ...values, accessType: v as "FREE" | "PAID" })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">Free — Open to all</SelectItem>
                  <SelectItem value="PAID">Paid — Plan-gated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {values.accessType === "PAID" && (
            <div className="space-y-2 rounded-md border border-border p-3 bg-muted/30">
              <Label className="text-xs text-muted-foreground">Required Plans</Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Students with any of these plans can access this course.
              </p>
              {plans.length === 0 ? (
                <p className="text-xs text-destructive">No subscription plans exist yet. Create one first.</p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {plans.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={values.planIds.includes(p.id)}
                        onCheckedChange={() => togglePlan(p.id)}
                      />
                      <span className="text-sm text-foreground">{p.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{p.price} {p.currency}</Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Thumbnail */}
          <div className="space-y-1.5">
            <Label>Thumbnail</Label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-24 overflow-hidden rounded-md bg-muted flex items-center justify-center shrink-0">
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
                  <p className="text-xs text-muted-foreground">Save course first, then upload thumbnail.</p>
                )}
              </div>
            </div>
          </div>

          {/* Published switch */}
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label htmlFor="cf-pub" className="text-sm">Publish immediately</Label>
              <p className="text-xs text-muted-foreground">If off, course stays as a draft.</p>
            </div>
            <Switch
              id="cf-pub"
              checked={values.isPublished}
              onCheckedChange={(v) => setValues({ ...values, isPublished: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={saving} onClick={submit}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
