"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
          <Skeleton key={i} className="h-56 rounded-xl" />
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
      <Card className="border-accent/20 bg-accent/[0.03]">
        <CardContent className="p-5 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{certs.length} certificate{certs.length > 1 ? "s" : ""} earned</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Each certificate has a unique ID and can be verified by reference. Click
              &quot;View&quot; to preview or &quot;Download PDF&quot; to save or print.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {certs.map((c) => (
          <Card key={c.id} className="overflow-hidden p-0">
            <div className="relative h-32 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Award className="h-10 w-10 text-primary-foreground/90" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
              <Badge className="absolute top-3 right-3 bg-background/20 backdrop-blur text-primary-foreground border-transparent">
                Verified
              </Badge>
            </div>
            <CardContent className="p-5 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.templateTitle}</p>
                <h3 className="font-heading font-semibold text-foreground line-clamp-2 mt-1">
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
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setPreviewCert(c)}
                >
                  <Eye className="h-4 w-4" /> View
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-2"
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
          <DialogHeader className="p-4 border-b border-border flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-base">{previewCert?.templateTitle}</DialogTitle>
              <DialogDescription>{previewCert?.courseTitle}</DialogDescription>
            </div>
            {previewCert && (
              <Button asChild size="sm" className="gap-2">
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
