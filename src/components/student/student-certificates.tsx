"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useApiFetch } from "@/hooks/use-api";
import {
  Award, Download, Eye, FileText, Calendar, ShieldCheck,
} from "lucide-react";
import { formatDate } from "@/types";

interface CertificateItem {
  id: string;
  certificateNumber: string;
  courseId: string;
  courseTitle: string;
  templateTitle: string;
  templateText: string;
  organizationName: string;
  issuedAt: string;
}

export function StudentCertificates() {
  const { data, loading, error } = useApiFetch<{
    certificates: CertificateItem[];
  }>("/api/student/certificates");

  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Award className="h-5 w-5" />}
        title="Couldn't load certificates"
        description={error}
        action={<Button onClick={() => window.location.reload()}>Reload</Button>}
      />
    );
  }

  const certs = data?.certificates || [];

  if (certs.length === 0) {
    return (
      <EmptyState
        icon={<Award className="h-5 w-5" />}
        title="No certificates yet"
        description="Complete a course and submit its assignment to earn your first certificate."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <Card className="overflow-hidden border-accent/20 shadow-sm">
        <div className="relative bg-gradient-to-br from-light-teal via-accent/[0.06] to-card">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-50"
            style={{ background: "radial-gradient(circle, rgba(15,118,110,0.18), transparent 70%)" }}
          />
          <CardContent className="relative p-5 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent shrink-0 ring-1 ring-accent/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground">
                {certs.length} certificate{certs.length > 1 ? "s" : ""} earned
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
                Each certificate has a unique ID and can be verified by reference. Click
                &quot;View&quot; to preview or &quot;Download PDF&quot; to save or print.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {certs.map((c) => (
          <Card key={c.id} className="group overflow-hidden p-0 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1">
            {/* Premium ribbon header */}
            <div className="relative h-32 bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center overflow-hidden">
              {/* Decorative pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.35),transparent_50%)] pointer-events-none" />
              {/* Subtle pattern */}
              <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)" }} />
              <Award className="relative h-12 w-12 text-primary-foreground drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
              <Badge className="absolute top-3 right-3 bg-white/15 backdrop-blur text-primary-foreground border border-white/20">
                <ShieldCheck className="h-3 w-3" /> Verified
              </Badge>
              {/* Certificate icon accent */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-card ring-4 ring-card shadow-md">
                <Award className="h-6 w-6 text-accent" />
              </div>
            </div>
            <CardContent className="p-5 pt-8 space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{c.templateTitle}</p>
                <h3 className="font-heading text-base font-semibold text-foreground line-clamp-2 mt-1.5 min-h-[2.5rem]">
                  {c.courseTitle}
                </h3>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-accent" /> Issued {formatDate(c.issuedAt)}
                </p>
                <p className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-accent" /> {c.certificateNumber}
                </p>
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-accent" /> {c.organizationName}
                </p>
              </div>
              <div className="flex gap-2 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-2 shadow-sm"
                  onClick={() => setPreviewCert(c)}
                >
                  <Eye className="h-4 w-4" /> View
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-2 shadow-sm"
                  asChild
                >
                  <a
                    href={`/api/student/certificates/${c.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="h-4 w-4" /> PDF
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview dialog with iframe */}
      <Dialog open={!!previewCert} onOpenChange={(o) => !o && setPreviewCert(null)}>
        <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b border-border flex-row items-center justify-between space-y-0 bg-gradient-to-r from-light-teal/60 to-card">
            <div>
              <DialogTitle className="text-base">{previewCert?.templateTitle}</DialogTitle>
              <DialogDescription>{previewCert?.courseTitle}</DialogDescription>
            </div>
            {previewCert && (
              <Button asChild size="sm" className="gap-2 shadow-sm">
                <a
                  href={`/api/student/certificates/${previewCert.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </Button>
            )}
          </DialogHeader>
          {previewCert && (
            <iframe
              src={`/api/student/certificates/${previewCert.id}/preview`}
              title={previewCert.templateTitle}
              className="flex-1 w-full border-0"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
