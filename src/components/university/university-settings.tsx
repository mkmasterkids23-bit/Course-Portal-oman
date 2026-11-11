"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApiFetch, apiPost, apiUpload } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/types";
import {
  Building2, Mail, Phone, Lock, Save, Upload, Shield, GraduationCap,
  BookOpen, Award, ClipboardList, Video, Users,
} from "lucide-react";

interface UniversityProfile {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  bio: string | null;
}

interface OverviewData {
  totalCourses: number;
  totalPublishedCourses: number;
  totalVideoLessons: number;
  totalAssignments: number;
  totalCertificatesIssued: number;
  totalStudents: number;
}

export function UniversitySettings() {
  const user = useAppStore((s) => s.user);
  const refreshUser = useAppStore((s) => s.refreshUser);
  const { data: profileData, loading: profileLoading, refetch: refetchProfile } =
    useApiFetch<{ university: UniversityProfile }>("/api/university/profile");
  const { data: overviewData, loading: overviewLoading } =
    useApiFetch<OverviewData>("/api/university/overview");

  // Profile form
  const [uniName, setUniName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profileData?.university) {
      setUniName(profileData.university.name);
      setDescription(profileData.university.description || "");
      setPhone(profileData.university.contactPhone || "");
      setBio(profileData.university.bio || "");
    }
  }, [profileData]);

  async function saveProfile() {
    if (!uniName.trim()) {
      toast({ title: "University name cannot be empty", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      await apiPost("/api/university/profile", {
        name: uniName.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
      }, { method: "PUT" });
      toast({ title: "Profile updated" });
      await refreshUser();
      refetchProfile();
    } catch {
      /* toast */
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiUpload<{ logo: string }>("/api/university/profile", fd);
      toast({ title: "Logo uploaded" });
      await refreshUser();
      refetchProfile();
    } catch {
      /* toast */
    } finally {
      setUploadingLogo(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      await apiPost("/api/auth/password", { currentPassword, newPassword });
      toast({ title: "Password updated", description: "Use your new password next time you sign in." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      /* toast */
    } finally {
      setSavingPassword(false);
    }
  }

  const uni = profileData?.university;
  const initials = (uni?.name || user?.universityName || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5 max-w-4xl">
      {/* University Overview Stats */}
      <Card className="border-border bg-card p-5 shadow-sm">
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-base font-semibold">
            University Overview
          </CardTitle>
          <CardDescription className="mt-1">
            Aggregate counts across your university&apos;s courses.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {overviewLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <StatBox icon={<BookOpen className="h-4 w-4" />} label="Courses" value={overviewData?.totalCourses ?? 0} />
              <StatBox icon={<BookOpen className="h-4 w-4" />} label="Published" value={overviewData?.totalPublishedCourses ?? 0} />
              <StatBox icon={<Video className="h-4 w-4" />} label="Video Lessons" value={overviewData?.totalVideoLessons ?? 0} />
              <StatBox icon={<ClipboardList className="h-4 w-4" />} label="Assignments" value={overviewData?.totalAssignments ?? 0} />
              <StatBox icon={<Award className="h-4 w-4" />} label="Certificates" value={overviewData?.totalCertificatesIssued ?? 0} />
              <StatBox icon={<Users className="h-4 w-4" />} label="Active Learners" value={overviewData?.totalStudents ?? 0} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* University Profile Card */}
      <Card className="border-border bg-card p-5 shadow-sm">
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" /> University Profile
          </CardTitle>
          <CardDescription className="mt-1">
            Your university&apos;s identity and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4 space-y-4">
          {/* Brand block */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-4">
            {profileLoading ? (
              <Skeleton className="h-16 w-16 rounded-xl" />
            ) : user?.universityLogo || uni?.logo ? (
              <img
                src={user?.universityLogo || uni?.logo || ""}
                alt={uni?.name || "University logo"}
                className="h-16 w-16 rounded-xl object-cover ring-2 ring-accent/20 shrink-0"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground ring-2 ring-accent/20 shrink-0">
                <GraduationCap className="h-7 w-7" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <p className="font-heading font-semibold text-foreground">
                {profileLoading ? <Skeleton className="h-5 w-40" /> : uni?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {profileLoading ? (
                  <Skeleton className="h-3 w-56" />
                ) : (
                  `Member since ${formatDate(uni?.createdAt || new Date())}`
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-accent/15 text-accent gap-1">
                  <Shield className="h-3 w-3" /> University Sub-Admin
                </Badge>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-accent hover:underline">
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingLogo ? "Uploading…" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadLogo(f);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Profile form */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="uni-name" className="text-xs font-medium text-muted-foreground">
                University Name
              </Label>
              <Input
                id="uni-name"
                value={uniName}
                onChange={(e) => setUniName(e.target.value)}
                disabled={profileLoading}
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uni-desc" className="text-xs font-medium text-muted-foreground">
                Description (optional)
              </Label>
              <Textarea
                id="uni-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={profileLoading}
                rows={3}
                placeholder="A short description of your university shown publicly."
                className="rounded-lg"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="uni-phone" className="text-xs font-medium text-muted-foreground">
                  Contact Phone (optional)
                </Label>
                <Input
                  id="uni-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={profileLoading}
                  placeholder="+1 555 123 4567"
                  className="h-9 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uni-email" className="text-xs font-medium text-muted-foreground">
                  Contact Email
                </Label>
                <Input
                  id="uni-email"
                  value={uni?.contactEmail || user?.email || ""}
                  disabled
                  className="h-9 rounded-lg bg-muted/50 text-muted-foreground"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uni-bio" className="text-xs font-medium text-muted-foreground">
                Bio / About (optional)
              </Label>
              <Textarea
                id="uni-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={profileLoading}
                rows={3}
                placeholder="A few words about you as the university sub-admin."
                className="rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <Button disabled={savingProfile || profileLoading} onClick={saveProfile} className="h-9 gap-2">
                <Save className="h-4 w-4" /> {savingProfile ? "Saving…" : "Save Profile"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border bg-card p-5 shadow-sm">
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent" /> Change Password
          </CardTitle>
          <CardDescription className="mt-1">
            Update your university account password.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cur-pass" className="text-xs font-medium text-muted-foreground">
              Current Password
            </Label>
            <Input
              id="cur-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="h-9 rounded-lg"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-pass" className="text-xs font-medium text-muted-foreground">
                New Password
              </Label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf-pass" className="text-xs font-medium text-muted-foreground">
                Confirm New Password
              </Label>
              <Input
                id="conf-pass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="h-9 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={savingPassword} onClick={changePassword} className="h-9 gap-2">
              <Save className="h-4 w-4" /> {savingPassword ? "Saving…" : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signed-in user info */}
      <Card className="border-border bg-card p-5 shadow-sm">
        <CardHeader className="p-0">
          <CardTitle className="font-heading text-base font-semibold">Signed-in Account</CardTitle>
          <CardDescription className="mt-1">
            The user account associated with this university.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <Avatar className="h-12 w-12 ring-2 ring-accent/15">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5 shrink-0" /> {user?.email}
              </p>
              {user?.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3 w-3 shrink-0" /> {user.phone}
                </p>
              )}
            </div>
            <Badge className="bg-accent/15 text-accent gap-1">
              <Building2 className="h-3 w-3" /> Sub-Admin
            </Badge>
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            CourseLearn — University Sub-Admin Dashboard. All course content you create is
            automatically scoped to <strong>{uni?.name || user?.universityName || "your university"}</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-heading text-xl font-bold text-foreground leading-none">
          {value.toLocaleString()}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1 truncate">
          {label}
        </p>
      </div>
    </div>
  );
}
