"use client";

import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useApiFetch, apiPost } from "@/hooks/use-api";
import { useAppStore } from "@/stores/app-store";
import { toast } from "@/hooks/use-toast";
import {
  Shield, Mail, Lock, BookOpen, Users, Award, CreditCard, ClipboardList,
  Layers, Cpu, Database, Server, Save,
} from "lucide-react";

interface OverviewData {
  totalStudents: number;
  totalCourses: number;
  totalFreeCourses: number;
  totalPaidCourses: number;
  totalActiveSubscriptions: number;
  totalExpiredSubscriptions: number;
  totalAssignments: number;
  totalSubmittedAssignments: number;
  totalCertificatesIssued: number;
}

export function AdminSettings() {
  const user = useAppStore((s) => s.user);
  const { data, loading } = useApiFetch<OverviewData>("/api/admin/overview");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      await apiPost("/api/auth/password", {
        currentPassword,
        newPassword,
      });
      toast({ title: "Password updated", description: "Use your new password next time you sign in." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.name || "A")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Platform Information */}
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base">Platform Overview</CardTitle>
          <CardDescription>Aggregate counts across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatBox icon={<Users className="h-4 w-4" />} label="Students" value={data?.totalStudents ?? 0} />
              <StatBox icon={<BookOpen className="h-4 w-4" />} label="Courses" value={data?.totalCourses ?? 0} />
              <StatBox icon={<Layers className="h-4 w-4" />} label="Free Courses" value={data?.totalFreeCourses ?? 0} />
              <StatBox icon={<Layers className="h-4 w-4" />} label="Paid Courses" value={data?.totalPaidCourses ?? 0} />
              <StatBox icon={<CreditCard className="h-4 w-4" />} label="Active Subs" value={data?.totalActiveSubscriptions ?? 0} />
              <StatBox icon={<CreditCard className="h-4 w-4" />} label="Expired Subs" value={data?.totalExpiredSubscriptions ?? 0} />
              <StatBox icon={<ClipboardList className="h-4 w-4" />} label="Assignments" value={data?.totalAssignments ?? 0} />
              <StatBox icon={<Award className="h-4 w-4" />} label="Certificates" value={data?.totalCertificatesIssued ?? 0} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Profile */}
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base">Administrator Profile</CardTitle>
          <CardDescription>Your signed-in account.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
            </div>
            <Badge className="bg-accent/15 text-accent gap-1">
              <Shield className="h-3 w-3" /> Administrator
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent" /> Change Password
          </CardTitle>
          <CardDescription>Update your admin account password.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cur-pass">Current Password</Label>
            <Input
              id="cur-pass"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-pass">New Password</Label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf-pass">Confirm New Password</Label>
              <Input
                id="conf-pass"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={saving} onClick={changePassword} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Information */}
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="text-base">Platform Information</CardTitle>
          <CardDescription>Technical details about this deployment.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <ul className="space-y-2 text-sm">
            <InfoRow icon={<Cpu className="h-4 w-4" />} label="Framework" value="Next.js 16 (App Router)" />
            <InfoRow icon={<Server className="h-4 w-4" />} label="Language" value="TypeScript 5" />
            <InfoRow icon={<Database className="h-4 w-4" />} label="Database" value="SQLite via Prisma ORM" />
            <InfoRow icon={<Layers className="h-4 w-4" />} label="UI Components" value="shadcn/ui (New York) + Tailwind CSS 4" />
            <InfoRow icon={<Shield className="h-4 w-4" />} label="Auth" value="Cookie-based HMAC session tokens (PBKDF2 password hashing)" />
          </ul>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground">
            Lumina Learning — Online Training &amp; Course Management Platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-heading text-xl font-bold text-foreground leading-none">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
        {icon}
      </div>
      <span className="text-muted-foreground w-32 text-xs">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </li>
  );
}
