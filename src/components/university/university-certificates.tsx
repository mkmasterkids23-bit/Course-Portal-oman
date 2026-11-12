"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { useI18n } from "@/lib/i18n/store";
import { toast } from "@/hooks/use-toast";
import { formatDateTime } from "@/types";
import { Award, Search, Download, Settings2 } from "lucide-react";

interface CourseListItem {
  id: string;
  title: string;
  isPublished: boolean;
}

interface IssuedCertificate {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  templateTitle: string;
  certificateNumber: string;
  issuedAt: string;
}

export function UniversityCertificates() {
  const { t } = useI18n();
  const navigate = useAppStore((s) => s.navigate);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");

  const { data: coursesData } = useApiFetch<{ courses: CourseListItem[] }>(
    "/api/university/courses"
  );
  const { data, loading, error } = useApiFetch<{ certificates: IssuedCertificate[] }>(
    "/api/university/certificates"
  );

  const certificates = data?.certificates || [];

  const filtered = useMemo(() => {
    let list = certificates;
    if (courseFilter !== "ALL") {
      list = list.filter((c) => c.courseTitle === coursesData?.courses.find((co) => co.id === courseFilter)?.title);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.studentName.toLowerCase().includes(q) ||
          c.studentEmail.toLowerCase().includes(q) ||
          c.courseTitle.toLowerCase().includes(q) ||
          c.certificateNumber.toLowerCase().includes(q) ||
          c.templateTitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [certificates, courseFilter, search, coursesData]);

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
                placeholder="Search by student, course or certificate number…"
                className="h-9 rounded-lg pl-9 focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("common.search")}
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-9 w-full rounded-lg sm:w-[200px]" aria-label={t("common.course")}>
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.all")}</SelectItem>
                {(coursesData?.courses || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Summary banner */}
      {!loading && !error && (
        <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-soft-sage/60 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {filtered.length} certificate{filtered.length === 1 ? "" : "s"} issued
              {courseFilter !== "ALL" ? " for this course" : " across your university"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Certificates are auto-issued when students complete all video lessons in a course.
            </p>
          </div>
        </div>
      )}

      <Card className="rounded-lg border-border bg-card p-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState className="m-4" icon={<Award className="h-5 w-5" />} title={t("common.error")} description={error} />
        ) : filtered.length === 0 ? (
          <EmptyState
            className="m-4"
            icon={<Award className="h-5 w-5" />}
            title="No certificates issued yet"
            description="Once students complete your courses, their certificates will appear here. Configure a certificate template per course to customize them."
            action={
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(["university", "courses"])}
              >
                <Settings2 className="h-4 w-4" /> Manage course templates
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
<Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student</TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Course</TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">Certificate Title</TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Cert. No.</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issued</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0 max-w-[200px]">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{c.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.studentEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-foreground md:table-cell">{c.courseTitle}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{c.templateTitle}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {c.certificateNumber}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(c.issuedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/api/public/certificates/${c.certificateNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
                      aria-label="View certificate"
                      onClick={(e) => {
                        if (!c.certificateNumber) {
                          e.preventDefault();
                          toast({ title: "Certificate number missing", variant: "destructive" });
                        }
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
</div>
        )}
      </Card>
    </div>
  );
}
