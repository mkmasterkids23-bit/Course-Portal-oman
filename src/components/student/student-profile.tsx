"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { apiPost, apiUpload } from "@/hooks/use-api";
import { toast } from "@/hooks/use-toast";
import {
  User, Mail, Phone, ShieldCheck, Camera, Save, Lock, KeyRound,
} from "lucide-react";

export function StudentProfile() {
  const user = useAppStore((s) => s.user);
  const refreshUser = useAppStore((s) => s.refreshUser);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Hydrate local form state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setBio(user.bio || "");
    }
  }, [user?.id, user?.name, user?.phone, user?.bio]);

  if (!user) {
    return (
      <EmptyState
        icon={<User className="h-5 w-5" />}
        title="Loading profile..."
        description="Fetching your account details."
      />
    );
  }

  const initials = (user.name || "S")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function saveProfile() {
    if (!name || name.trim().length < 2) {
      toast({ title: "Name too short", description: "Please enter your full name (min 2 characters).", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("phone", phone.trim());
      fd.append("bio", bio.trim());
      if (photoFile) fd.append("photo", photoFile);
      await apiUpload("/api/auth/profile", fd);
      await refreshUser();
      setPhotoFile(null);
      toast({ title: "Profile saved", description: "Your profile has been updated." });
    } catch {
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) {
      toast({ title: "Missing fields", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      await apiPost("/api/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
    } catch {
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      {/* Profile summary card */}
      <div className="space-y-4">
        {/* Profile header card with avatar */}
        <Card className="shadow-sm overflow-hidden">
          {/* Accent header banner */}
          <div className="h-20 bg-gradient-to-br from-primary via-primary to-accent relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
          </div>
          <CardContent className="px-6 pb-6">
            <div className="-mt-12 flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-card shadow-md">
                  {user.profilePhoto ? (
                    <AvatarImage src={user.profilePhoto} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-semibold text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg cursor-pointer hover:bg-primary/90 transition-colors ring-2 ring-card"
                  aria-label="Change profile photo"
                >
                  <Camera className="h-4 w-4" />
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground mt-4">{user.name}</h2>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-accent" /> {user.email}
              </p>
              <Badge className="mt-3 bg-accent/10 text-accent border-transparent">
                <ShieldCheck className="h-3 w-3" /> {user.role === "STUDENT" ? "Student" : user.role}
              </Badge>
              {photoFile && (
                <p className="mt-3 text-xs text-accent flex items-center gap-1.5">
                  <Camera className="h-3 w-3" /> New photo selected: {photoFile.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <User className="h-4 w-4" />
              </span>
              Account information
            </CardTitle>
            <CardDescription>Quick reference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone || "—"} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Role" value={user.role === "STUDENT" ? "Student" : user.role} />
          </CardContent>
        </Card>
      </div>

      {/* Editable forms */}
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <User className="h-4 w-4" />
              </span>
              Edit Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+968 1234 5678"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about yourself..."
                rows={4}
                className="resize-none"
              />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} className="gap-2 shadow-sm">
              <Save className="h-4 w-4" /> {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <KeyRound className="h-4 w-4" />
              </span>
              Change Password
            </CardTitle>
            <CardDescription>Keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-9 h-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9 h-10"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9 h-10"
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <Button onClick={changePassword} disabled={savingPassword} variant="outline" className="gap-2 shadow-sm">
              <KeyRound className="h-4 w-4" /> {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</span>
        {label}
      </span>
      <span className="font-medium text-foreground truncate">{value}</span>
    </div>
  );
}
