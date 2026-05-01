// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { createClient } from '@/lib/client'

// export default function OnboardingForm() {
//   const supabase = createClient()
//   const router = useRouter()

//   const [step, setStep] = useState(1)
//   const [userId, setUserId] = useState('')

//   const [fullName, setFullName] = useState('')
//   const [bio, setBio] = useState('')
//   const [teamId, setTeamId] = useState('')
//   const [specialty, setSpecialty] = useState('')

//   useEffect(() => {
//     const loadUser = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()

//       if (!user) {
//         router.push('/auth/login')
//         return
//       }

//       setUserId(user.id)
//     }

//     loadUser()
//   }, [])

//   const finish = async () => {
//     await supabase
//       .from('students')
//       .update({
//         full_name: fullName,
//         bio,
//         team_id: teamId,
//         graduation_project_specialty: specialty,
//         is_onboarded: true,
//       })
//       .eq('auth_id', userId)

//     router.push('/explore')
//   }

//   return (
//     <div className="max-w-xl mx-auto p-6">
//       {step === 1 && (
//         <div className="space-y-4">
//           <input
//             placeholder="Full Name"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//           />

//           <textarea
//             placeholder="Bio"
//             value={bio}
//             onChange={(e) => setBio(e.target.value)}
//           />

//           <button onClick={() => setStep(2)}>Next</button>
//         </div>
//       )}

//       {step === 2 && (
//         <div className="space-y-4">
//           <input
//             placeholder="Team ID"
//             value={teamId}
//             onChange={(e) => setTeamId(e.target.value)}
//           />

//           <input
//             placeholder="Specialty"
//             value={specialty}
//             onChange={(e) => setSpecialty(e.target.value)}
//           />

//           <button onClick={() => setStep(1)}>Back</button>
//           <button onClick={() => setStep(3)}>Next</button>
//         </div>
//       )}

//       {step === 3 && (
//         <div className="space-y-4">
//           <button onClick={() => setStep(2)}>Back</button>
//           <button onClick={finish}>Finish</button>
//         </div>
//       )}
//     </div>
//   )
// }

"use client";

import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Plus,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Specialty {
  id: number;
  name: string;
}

interface SocialLink {
  platform: string;
  url: string;
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

const STEPS = [
  { id: 1, label: "Profile", icon: User },
  { id: 2, label: "Academic", icon: BookOpen },
  { id: 3, label: "Team", icon: Users },
  { id: 4, label: "Links", icon: Globe },
  { id: 5, label: "Review", icon: CheckCircle2 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingForm() {
  const supabase = createClient();
  const router = useRouter();

  // Meta
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Profile
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Step 2 — Academic
  const [graduationYear, setGraduationYear] = useState("");
  const [graduationProjectSpecialty, setGraduationProjectSpecialty] =
    useState("");
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [privacySetting, setPrivacySetting] = useState("public");

  // Step 3 — Team
  const [teamNumberInput, setTeamNumberInput] = useState("");
  const [website, setWebsite] = useState("");

  // Step 4 — Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { platform: "GitHub", url: "" },
    { platform: "LinkedIn", url: "" },
  ]);

  // ── Load user + reference data ────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserId(user.id);

      // Fetch existing student row
      const { data: student } = await supabase
        .from("students")
        .select(
          "id, full_name, nickname, bio, phone, location, avatar_url, graduation_year, graduation_project_specialty, privacy_setting, team_id, website, social_links",
        )
        .eq("auth_id", user.id)
        .single();

      if (student) {
        setStudentId(student.id);
        setFullName(student.full_name ?? "");
        setNickname(student.nickname ?? "");
        setBio(student.bio ?? "");
        setPhone(student.phone ?? "");
        setLocation(student.location ?? "");
        setAvatarUrl(student.avatar_url ?? "");
        setAvatarPreview(student.avatar_url ?? "");
        setGraduationYear("2026");
        setGraduationProjectSpecialty(
          student.graduation_project_specialty ?? "",
        );
        setPrivacySetting(student.privacy_setting ?? "public");
        setTeamNumberInput(student.team_id ? "" : "");
        setWebsite(student.website ?? "");

        if (
          Array.isArray(student.social_links) &&
          student.social_links.length > 0
        ) {
          setSocialLinks(student.social_links);
        }
      }

      // Fetch specialties
      const { data: specialtiesData } = await supabase
        .from("specialties")
        .select("id, name")
        .order("name");

      if (specialtiesData) setSpecialties(specialtiesData);

      // Fetch already selected specialties
      if (student?.id) {
        const { data: studentSpecialties } = await supabase
          .from("student_specialties")
          .select("specialty_id")
          .eq("student_id", student.id);

        if (studentSpecialties) {
          setSelectedSpecialties(
            studentSpecialties.map((s) => s.specialty_id as number),
          );
        }
      }
    };

    init();
  }, []);

  // ── Avatar upload ─────────────────────────────────────────────────────────

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !userId) return avatarUrl || null;

    const ext = avatarFile.name.split(".").pop();
    // const filePath = `avatars/${userId}.${ext}`
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

  // ── Social links helpers ──────────────────────────────────────────────────

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

  // ── Specialty toggle ──────────────────────────────────────────────────────

  const toggleSpecialty = (id: number) =>
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  // ── Finish ────────────────────────────────────────────────────────────────

  const finish = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Upload avatar if changed
      const finalAvatarUrl = await uploadAvatar();

      // 2. Filter out empty social links
      const filteredLinks = socialLinks.filter((l) => l.url.trim() !== "");

      // 3. Resolve or create team
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
            .insert({
              team_number: teamNumber,
              name: `Team ${teamNumber}`,
            })
            .select("id")
            .single();

          if (teamError) throw teamError;
          resolvedTeamId = newTeam.id;
        }
      }

      // 4. Update students row
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
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .eq("auth_id", userId);

      if (updateError) throw updateError;

      // 5. Sync student_specialties
      if (studentId) {
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
      }

      router.push("/explore");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    if (step === 1) return fullName.trim().length > 0;
    return true;
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* ── Header ── */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome aboard 👋
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s set up your profile — it only takes a minute.
          </p>
        </div>

        {/* ── Step indicators ── */}
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => id < step && setStep(id)}
                className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                  id === step
                    ? "text-primary font-semibold"
                    : id < step
                      ? "text-primary/70 cursor-pointer hover:text-primary"
                      : "text-muted-foreground cursor-default"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    id === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : id < step
                        ? "border-primary/70 bg-primary/10 text-primary"
                        : "border-muted-foreground/30 bg-muted text-muted-foreground"
                  }`}
                >
                  {id < step ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Card ── */}
        <Card className="shadow-lg">
          {/* ════════════════════════════════════════
              STEP 1 — Profile Info
          ════════════════════════════════════════ */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Your Profile
                </CardTitle>
                <CardDescription>
                  Tell other students a little about yourself.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
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
                    <Upload className="w-4 h-4" />
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
                  {/* Full Name */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="fullName">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="e.g. Sara Al-Rashidi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Nickname */}
                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      placeholder="e.g. Sara"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+966 5x xxx xxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Location */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Riyadh, Saudi Arabia"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  {/* Bio */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Write a short bio about yourself…"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {bio.length} / 300
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* ════════════════════════════════════════
              STEP 2 — Academic Info
          ════════════════════════════════════════ */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Academic Info
                </CardTitle>
                <CardDescription>
                  Your graduation details and areas of expertise.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Graduation Year */}
                  <div className="space-y-2">
                    <Label>Graduation Year</Label>
                    <Input
                      value="2026"
                      disabled
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </div>

                  {/* Graduation Project Specialty */}
                  <div className="space-y-2">
                    <Label htmlFor="gps">Graduation Project Specialty</Label>
                    <Input
                      id="gps"
                      placeholder="e.g. Web Development"
                      value={graduationProjectSpecialty}
                      onChange={(e) =>
                        setGraduationProjectSpecialty(e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Specialties */}
                {specialties.length > 0 && (
                  <div className="space-y-3">
                    <Label>Your Specialties</Label>
                    <p className="text-xs text-muted-foreground">
                      Select all that apply.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((s) => {
                        const active = selectedSpecialties.includes(s.id);
                        return (
                          <Badge
                            key={s.id}
                            variant={active ? "default" : "outline"}
                            className="cursor-pointer select-none transition-colors"
                            onClick={() => toggleSpecialty(s.id)}
                          >
                            {active && (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            )}
                            {s.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Privacy */}
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
              </CardContent>
            </>
          )}

          {/* ════════════════════════════════════════
              STEP 3 — Team & Website
          ════════════════════════════════════════ */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Team & Links
                </CardTitle>
                <CardDescription>
                  Join your graduation team and add your website.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Team number input */}
                <div className="space-y-2">
                  <Label htmlFor="teamNumber">Graduation Team Number</Label>
                  <Input
                    id="teamNumber"
                    type="number"
                    min={1}
                    placeholder="e.g. 3"
                    value={teamNumberInput}
                    onChange={(e) => setTeamNumberInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your team number. If it doesn&apos;t exist, a new team
                    will be created automatically.
                  </p>
                </div>

                {/* Website */}
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
              </CardContent>
            </>
          )}

          {/* ════════════════════════════════════════
              STEP 4 — Social Links
          ════════════════════════════════════════ */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Social Links
                </CardTitle>
                <CardDescription>
                  Add links to your social profiles. Skip any you don&apos;t
                  have.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {socialLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="w-36 shrink-0">
                      <Select
                        value={link.platform}
                        onValueChange={(v) =>
                          updateSocialLink(i, "platform", v)
                        }
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
                      onChange={(e) =>
                        updateSocialLink(i, "url", e.target.value)
                      }
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocialLink(i)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSocialLink}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add another link
                </Button>
              </CardContent>
            </>
          )}

          {/* ════════════════════════════════════════
              STEP 5 — Review
          ════════════════════════════════════════ */}
          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Review & Finish
                </CardTitle>
                <CardDescription>
                  Everything look good? You can always edit your profile later.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Profile summary */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {fullName?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{fullName || "—"}</p>
                    {nickname && (
                      <p className="text-muted-foreground text-sm">
                        @{nickname}
                      </p>
                    )}
                    {location && (
                      <p className="text-muted-foreground text-sm">
                        {location}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <ReviewRow label="Phone" value={phone} />
                  <ReviewRow label="Graduation Year" value="2026" />
                  <ReviewRow
                    label="Project Specialty"
                    value={graduationProjectSpecialty}
                  />
                  <ReviewRow label="Privacy" value={privacySetting} />
                  <ReviewRow
                    label="Team"
                    value={teamNumberInput ? `Team ${teamNumberInput}` : null}
                  />
                  <ReviewRow label="Website" value={website} />
                </div>

                {bio && (
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground font-medium">Bio</p>
                    <p>{bio}</p>
                  </div>
                )}

                {selectedSpecialties.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Specialties
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedSpecialties.map((id) => {
                        const s = specialties.find((sp) => sp.id === id);
                        return s ? (
                          <Badge key={id} variant="secondary">
                            {s.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {socialLinks.filter((l) => l.url).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Social Links
                    </p>
                    <div className="space-y-1">
                      {socialLinks
                        .filter((l) => l.url)
                        .map((l, i) => (
                          <p key={i} className="text-sm">
                            <span className="font-medium">{l.platform}:</span>{" "}
                            <span className="text-muted-foreground">
                              {l.url}
                            </span>
                          </p>
                        ))}
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}
              </CardContent>
            </>
          )}

          {/* ── Navigation footer ── */}
          <div className="flex items-center justify-between px-6 pb-6 pt-2">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            {step < STEPS.length ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={loading} className="gap-1">
                {loading ? "Saving…" : "Finish & Go to Dashboard"}
                {!loading && <CheckCircle2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Helper sub-component ─────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
