"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApiFetch } from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Upload,
  Save,
  Image as ImageIcon,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface SocialLinks {
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
}

interface BrandingInfo {
  id: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  description: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  location: string | null;
  socialLinks: SocialLinks;
}

interface BrandingResponse {
  branding: BrandingInfo;
}

interface FormValues {
  name: string;
  description: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  socialLinks: SocialLinks;
}

const DEFAULT_FORM: FormValues = {
  name: "",
  description: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  location: "",
  socialLinks: {
    twitter: "",
    facebook: "",
    linkedin: "",
    instagram: "",
  },
};

export function UniversityBranding() {
  const { data, loading, error, refetch } = useApiFetch<BrandingResponse>(
    "/api/university/branding"
  );

  const [values, setValues] = useState<FormValues>(DEFAULT_FORM);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.branding) {
      const b = data.branding;
      setValues({
        name: b.name,
        description: b.description || "",
        website: b.website || "",
        contactEmail: b.contactEmail || "",
        contactPhone: b.contactPhone || "",
        location: b.location || "",
        socialLinks: {
          twitter: b.socialLinks?.twitter || "",
          facebook: b.socialLinks?.facebook || "",
          linkedin: b.socialLinks?.linkedin || "",
          instagram: b.socialLinks?.instagram || "",
        },
      });
      setLogoPreview(b.logo);
      setCoverPreview(b.coverImage);
      setLogoFile(null);
      setCoverFile(null);
    }
  }, [data]);

  // Detect unsaved changes (any form field, file pick, or social link changes)
  const hasUnsavedChanges = useMemo(() => {
    if (!data?.branding) return false;
    const b = data.branding;
    if (values.name !== b.name) return true;
    if (values.description !== (b.description || "")) return true;
    if (values.website !== (b.website || "")) return true;
    if (values.contactEmail !== (b.contactEmail || "")) return true;
    if (values.contactPhone !== (b.contactPhone || "")) return true;
    if (values.location !== (b.location || "")) return true;
    if (values.socialLinks.twitter !== (b.socialLinks?.twitter || ""))
      return true;
    if (values.socialLinks.facebook !== (b.socialLinks?.facebook || ""))
      return true;
    if (values.socialLinks.linkedin !== (b.socialLinks?.linkedin || ""))
      return true;
    if (values.socialLinks.instagram !== (b.socialLinks?.instagram || ""))
      return true;
    if (logoFile || coverFile) return true;
    return false;
  }, [values, logoFile, coverFile, data]);

  function pickLogo(file: File) {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }
  function pickCover(file: File) {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function submit() {
    if (!values.name.trim()) {
      toast({ title: "Name cannot be empty", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", values.name.trim());
      fd.append("description", values.description.trim());
      fd.append("website", values.website.trim());
      fd.append("contactEmail", values.contactEmail.trim());
      fd.append("contactPhone", values.contactPhone.trim());
      fd.append("location", values.location.trim());
      fd.append(
        "socialLinks",
        JSON.stringify({
          twitter: values.socialLinks.twitter?.trim() || "",
          facebook: values.socialLinks.facebook?.trim() || "",
          linkedin: values.socialLinks.linkedin?.trim() || "",
          instagram: values.socialLinks.instagram?.trim() || "",
        })
      );
      if (logoFile) fd.append("logoFile", logoFile);
      if (coverFile) fd.append("coverFile", coverFile);

      const res = await fetch("/api/university/branding", {
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
      if (logoFile) URL.revokeObjectURL(logoPreview || "");
      if (coverFile) URL.revokeObjectURL(coverPreview || "");
      setLogoFile(null);
      setCoverFile(null);
      refetch();
      toast({
        title: "Branding saved",
        description: "Your university profile has been updated.",
      });
    } catch {
      /* handled */
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-lg border-border bg-card p-5 shadow-sm lg:col-span-2">
          <Skeleton className="h-6 w-48" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-lg border-border bg-card p-5 shadow-sm">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-lg border-border bg-card p-10 text-center shadow-sm">
        <p className="font-heading font-semibold text-foreground">
          Couldn't load branding
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }

  const branding = data?.branding;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <Card className="rounded-lg border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-soft-sage text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-lg font-semibold text-foreground">
              University Branding
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage how your university appears on course cards and across the
              platform.
            </p>
          </div>
          {hasUnsavedChanges && (
            <Badge
              variant="outline"
              className="bg-accent/15 text-accent border-accent/30"
            >
              Unsaved changes
            </Badge>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: form */}
        <Card className="rounded-lg border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="space-y-5">
            {/* Brand assets — logo + cover */}
            <div>
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Brand Assets
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Logo appears in the sidebar and on course cards. Cover image is
                shown on your public profile.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Logo upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Logo
                  </Label>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center ring-1 ring-border">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-soft-sage px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-soft-sage/80">
                        <Upload className="h-3.5 w-3.5" />
                        {logoFile ? "Replace logo" : "Upload logo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) pickLogo(f);
                          }}
                        />
                      </label>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        PNG, JPG or SVG. Square ratio recommended.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cover upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Cover image
                  </Label>
                  <div className="rounded-lg border border-border p-3">
                    <div className="h-16 w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center ring-1 ring-border">
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-soft-sage px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-soft-sage/80">
                      <Upload className="h-3.5 w-3.5" />
                      {coverFile ? "Replace cover" : "Upload cover"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) pickCover(f);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Identity */}
            <div className="space-y-3">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Identity
              </h2>
              <div className="space-y-1.5">
                <Label
                  htmlFor="br-name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  University name
                </Label>
                <Input
                  id="br-name"
                  value={values.name}
                  onChange={(e) =>
                    setValues({ ...values, name: e.target.value })
                  }
                  placeholder="e.g. Sage Valley University"
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="br-desc"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Description
                </Label>
                <Textarea
                  id="br-desc"
                  value={values.description}
                  onChange={(e) =>
                    setValues({ ...values, description: e.target.value })
                  }
                  placeholder="A short paragraph that describes your university, its mission, and what students can expect."
                  rows={3}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="br-web"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Website
                </Label>
                <Input
                  id="br-web"
                  value={values.website}
                  onChange={(e) =>
                    setValues({ ...values, website: e.target.value })
                  }
                  placeholder="https://your-university.edu"
                  className="h-9 rounded-lg"
                />
              </div>
            </div>

            <Separator />

            {/* Contact info */}
            <div className="space-y-3">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Contact
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="br-email"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Contact email
                  </Label>
                  <Input
                    id="br-email"
                    type="email"
                    value={values.contactEmail}
                    onChange={(e) =>
                      setValues({ ...values, contactEmail: e.target.value })
                    }
                    placeholder="info@your-university.edu"
                    className="h-9 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="br-phone"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Contact phone
                  </Label>
                  <Input
                    id="br-phone"
                    value={values.contactPhone}
                    onChange={(e) =>
                      setValues({ ...values, contactPhone: e.target.value })
                    }
                    placeholder="+968 2xxx xxxx"
                    className="h-9 rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="br-loc"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Location
                </Label>
                <Input
                  id="br-loc"
                  value={values.location}
                  onChange={(e) =>
                    setValues({ ...values, location: e.target.value })
                  }
                  placeholder="e.g. Muscat, Oman"
                  className="h-9 rounded-lg"
                />
              </div>
            </div>

            <Separator />

            {/* Social links */}
            <div className="space-y-3">
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Social Links
              </h2>
              <p className="text-xs text-muted-foreground">
                Leave blank to hide the icon on the public profile.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <SocialInput
                  icon={<Twitter className="h-4 w-4" />}
                  label="Twitter"
                  placeholder="https://twitter.com/youruni"
                  value={values.socialLinks.twitter || ""}
                  onChange={(v) =>
                    setValues({
                      ...values,
                      socialLinks: {
                        ...values.socialLinks,
                        twitter: v,
                      },
                    })
                  }
                />
                <SocialInput
                  icon={<Facebook className="h-4 w-4" />}
                  label="Facebook"
                  placeholder="https://facebook.com/youruni"
                  value={values.socialLinks.facebook || ""}
                  onChange={(v) =>
                    setValues({
                      ...values,
                      socialLinks: {
                        ...values.socialLinks,
                        facebook: v,
                      },
                    })
                  }
                />
                <SocialInput
                  icon={<Linkedin className="h-4 w-4" />}
                  label="LinkedIn"
                  placeholder="https://linkedin.com/company/youruni"
                  value={values.socialLinks.linkedin || ""}
                  onChange={(v) =>
                    setValues({
                      ...values,
                      socialLinks: {
                        ...values.socialLinks,
                        linkedin: v,
                      },
                    })
                  }
                />
                <SocialInput
                  icon={<Instagram className="h-4 w-4" />}
                  label="Instagram"
                  placeholder="https://instagram.com/youruni"
                  value={values.socialLinks.instagram || ""}
                  onChange={(v) =>
                    setValues({
                      ...values,
                      socialLinks: {
                        ...values.socialLinks,
                        instagram: v,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button
                variant="outline"
                className="h-9"
                onClick={() => {
                  if (data?.branding) {
                    const b = data.branding;
                    setValues({
                      name: b.name,
                      description: b.description || "",
                      website: b.website || "",
                      contactEmail: b.contactEmail || "",
                      contactPhone: b.contactPhone || "",
                      location: b.location || "",
                      socialLinks: {
                        twitter: b.socialLinks?.twitter || "",
                        facebook: b.socialLinks?.facebook || "",
                        linkedin: b.socialLinks?.linkedin || "",
                        instagram: b.socialLinks?.instagram || "",
                      },
                    });
                    setLogoPreview(b.logo);
                    setCoverPreview(b.coverImage);
                    setLogoFile(null);
                    setCoverFile(null);
                  }
                }}
                disabled={saving || !hasUnsavedChanges}
              >
                Reset
              </Button>
              <Button
                disabled={saving || !hasUnsavedChanges}
                className="h-9 gap-2"
                onClick={submit}
              >
                {saving ? (
                  "Saving…"
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Branding
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Right: live preview */}
        <Card className="rounded-lg border-border bg-card p-5 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold text-foreground">
              Live Preview
            </h2>
          </div>

          {/* Course card preview */}
          <div className="rounded-lg border border-border overflow-hidden bg-background shadow-sm">
            {/* Cover */}
            <div className="relative h-24 w-full bg-muted">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground/60">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              {/* Logo overlapping */}
              <div className="absolute -bottom-6 left-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl bg-card ring-2 ring-card shadow-sm flex items-center justify-center">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 pt-8 space-y-2">
              <p className="font-heading text-sm font-semibold text-foreground line-clamp-1">
                {values.name || "Your University"}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-3 min-h-[2.5rem]">
                {values.description || "Your description will appear here."}
              </p>

              <div className="space-y-1 border-t border-border pt-2 text-[11px] text-muted-foreground">
                {values.website && (
                  <a
                    href={values.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-accent hover:underline truncate"
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{values.website}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}
                {values.contactEmail && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{values.contactEmail}</span>
                  </p>
                )}
                {values.contactPhone && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{values.contactPhone}</span>
                  </p>
                )}
                {values.location && (
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{values.location}</span>
                  </p>
                )}
              </div>

              {/* Social row */}
              {(values.socialLinks.twitter ||
                values.socialLinks.facebook ||
                values.socialLinks.linkedin ||
                values.socialLinks.instagram) && (
                <div className="flex items-center gap-1.5 border-t border-border pt-2">
                  {values.socialLinks.twitter && (
                    <SocialPreviewIcon
                      href={values.socialLinks.twitter}
                      icon={<Twitter className="h-3 w-3" />}
                    />
                  )}
                  {values.socialLinks.facebook && (
                    <SocialPreviewIcon
                      href={values.socialLinks.facebook}
                      icon={<Facebook className="h-3 w-3" />}
                    />
                  )}
                  {values.socialLinks.linkedin && (
                    <SocialPreviewIcon
                      href={values.socialLinks.linkedin}
                      icon={<Linkedin className="h-3 w-3" />}
                    />
                  )}
                  {values.socialLinks.instagram && (
                    <SocialPreviewIcon
                      href={values.socialLinks.instagram}
                      icon={<Instagram className="h-3 w-3" />}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            This is how your university appears on course cards across the
            platform.
          </p>
        </Card>
      </div>
    </div>
  );
}

function SocialInput({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-lg"
      />
    </div>
  );
}

function SocialPreviewIcon({
  href,
  icon,
}: {
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors hover:bg-soft-sage hover:text-primary"
    >
      {icon}
    </a>
  );
}
