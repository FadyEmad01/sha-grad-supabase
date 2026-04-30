"use client";

import { BookOpen, Globe, Image, User, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import GalleryManager from "@/components/gallery-manager";
import Container from "@/components/layout/container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/client";

interface Specialty {
  id: number;
  name: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface StudentData {
  full_name: string | null;
  nickname: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  graduation_project_specialty: string | null;
  privacy_setting: string | null;
  team_id: string | null;
  website: string | null;
  social_links: SocialLink[] | null;
}

const SOCIAL_PLATFORMS = [
  "GitHub",
  "LinkedIn",
  "Twitter",
  "Instagram",
  "Behance",
  "Dribbble",
  "Portfolio",
  "Other",
];

const PRIVACY_OPTIONS = [
  { value: "public", label: "Public — Anyone can view your profile" },
  { value: "students_only", label: "Students Only — Only students can view" },
  { value: "private", label: "Private — Only you can view" },
];

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "academic", label: "Academic", icon: BookOpen },
  { id: "team", label: "Team & Links", icon: Globe },
  { id: "social", label: "Social", icon: Users },
  { id: "gallery", label: "Gallery", icon: Image },
];

export default function SettingsForm({
  studentId,
  userId,
  initialData,
}: {
  studentId: string;
  userId: string;
  initialData: StudentData;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "profile",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile
  const [fullName, setFullName] = useState(initialData.full_name ?? "");
  const [nickname, setNickname] = useState(initialData.nickname ?? "");
  const [bio, setBio] = useState(initialData.bio ?? "");
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [location, setLocation] = useState(initialData.location ?? "");
  const [avatarUrl] = useState(initialData.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(
    initialData.avatar_url ?? "",
  );

  // Academic
  const [graduationProjectSpecialty, setGraduationProjectSpecialty] = useState(
    initialData.graduation_project_specialty ?? "",
  );
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [privacySetting, setPrivacySetting] = useState(
    initialData.privacy_setting ?? "public",
  );

  // Team & Links
  const [teamNumberInput, setTeamNumberInput] = useState("");
  const [website, setWebsite] = useState(initialData.website ?? "");

  // Social
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    initialData.social_links && initialData.social_links.length > 0
      ? initialData.social_links
      : [
          { platform: "GitHub", url: "" },
          { platform: "LinkedIn", url: "" },
        ],
  );

  useEffect(() => {
    const init = async () => {
      const { data: specialtiesData } = await supabase
        .from("specialties")
        .select("id, name")
        .order("name");

      if (specialtiesData) setSpecialties(specialtiesData);

      const { data: studentSpecialties } = await supabase
        .from("student_specialties")
        .select("specialty_id")
        .eq("student_id", studentId);

      if (studentSpecialties) {
        setSelectedSpecialties(
          studentSpecialties.map((s) => s.specialty_id as number),
        );
      }

      if (initialData.team_id) {
        const { data: team } = await supabase
          .from("teams")
          .select("team_number")
          .eq("id", initialData.team_id)
          .single();
        if (team?.team_number) setTeamNumberInput(team.team_number.toString());
      }
    };

    init();
  }, [studentId, initialData.team_id, supabase]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !userId) return avatarUrl || null;
    const ext = avatarFile.name.split(".").pop();
    const filePath = `avatars/${userId}/${userId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("sha-gallery")
      .upload(filePath, avatarFile, { upsert: true });
    if (uploadError) {
      console.error(uploadError);
      return null;
    }
    const { data } = supabase.storage
      .from("sha-gallery")
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const addSocialLink = () =>
    setSocialLinks((prev) => [...prev, { platform: "GitHub", url: "" }]);

  const removeSocialLink = (index: number) =>
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));

  const updateSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: string,
  ) =>
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );

  const toggleSpecialty = (id: number) =>
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const saveProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const finalAvatarUrl = await uploadAvatar();
      const filteredLinks = socialLinks.filter((l) => l.url.trim() !== "");

      let resolvedTeamId: string | null = null;
      const teamNumber = parseInt(teamNumberInput, 10);

      if (
        teamNumberInput.trim() &&
        !Number.isNaN(teamNumber) &&
        teamNumber > 0
      ) {
        const { data: existingTeam } = await supabase
          .from("teams")
          .select("id")
          .eq("team_number", teamNumber)
          .single();

        if (existingTeam) {
          resolvedTeamId = existingTeam.id;
        } else {
          const { data: newTeam, error: teamError } = await supabase
            .from("teams")
            .insert({ team_number: teamNumber, name: `Team ${teamNumber}` })
            .select("id")
            .single();

          if (teamError) throw teamError;
          resolvedTeamId = newTeam.id;
        }
      }

      const { error: updateError } = await supabase
        .from("students")
        .update({
          full_name: fullName,
          nickname: nickname || null,
          bio: bio || null,
          phone: phone || null,
          location: location || null,
          website: website || null,
          avatar_url: finalAvatarUrl,
          graduation_year: 2026,
          graduation_project_specialty: graduationProjectSpecialty || null,
          privacy_setting: privacySetting,
          team_id: resolvedTeamId,
          social_links: filteredLinks,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_id", userId);

      if (updateError) throw updateError;

      await supabase
        .from("student_specialties")
        .delete()
        .eq("student_id", studentId);
      if (selectedSpecialties.length > 0) {
        await supabase.from("student_specialties").insert(
          selectedSpecialties.map((sid) => ({
            student_id: studentId,
            specialty_id: sid,
          })),
        );
      }

      setSuccess("Profile updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-muted/20 min-h-screen">
      <Container>
        <div className="max-w-3xl mx-auto py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground text-sm">
                Manage your profile and gallery
              </p>
            </div>
            <Button
              onClick={saveProfile}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Messages */}
          {success && (
            <div className="rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "profile" && (
            <div className="rounded-xl border bg-card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Profile Info</h2>

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-24 h-24 ring-2 ring-primary/20">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {fullName?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <Label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  Upload photo
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "academic" && (
            <div className="rounded-xl border bg-card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Academic Info</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input value="2026" disabled className="bg-muted/50" />
                </div>

                <div className="space-y-2">
                  <Label>Project Specialty</Label>
                  <Input
                    value={graduationProjectSpecialty}
                    onChange={(e) =>
                      setGraduationProjectSpecialty(e.target.value)
                    }
                  />
                </div>
              </div>

              {specialties.length > 0 && (
                <div className="space-y-3">
                  <Label>Your Specialties</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map((s) => {
                      const active = selectedSpecialties.includes(s.id);
                      return (
                        <Badge
                          key={s.id}
                          variant={active ? "default" : "outline"}
                          className="cursor-pointer select-none"
                          onClick={() => toggleSpecialty(s.id)}
                        >
                          {s.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Profile Privacy</Label>
                <Select
                  value={privacySetting}
                  onValueChange={setPrivacySetting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIVACY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="rounded-xl border bg-card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Team & Links</h2>

              <div className="space-y-2">
                <Label htmlFor="teamNumber">Graduation Team Number</Label>
                <Input
                  id="teamNumber"
                  type="number"
                  min={1}
                  value={teamNumberInput}
                  onChange={(e) => setTeamNumberInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your team number. A new team will be created if it
                  doesn&apos;t exist.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Personal Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourportfolio.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Social Links</h2>

              {socialLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-36 shrink-0">
                    <Select
                      value={link.platform}
                      onValueChange={(v) => updateSocialLink(i, "platform", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_PLATFORMS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Input
                    className="flex-1"
                    placeholder={`https://${link.platform.toLowerCase()}.com/…`}
                    value={link.url}
                    onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => removeSocialLink(i)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addSocialLink}
                type="button"
              >
                + Add another link
              </Button>
            </div>
          )}

          {activeTab === "gallery" && <GalleryManager studentId={studentId} />}
        </div>
      </Container>
    </main>
  );
}
