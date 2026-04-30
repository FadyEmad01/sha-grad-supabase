import {
  BookOpen,
  Calendar,
  Edit,
  Globe,
  LinkIcon,
  Lock,
  MapPin,
  Phone,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import GalleryGrid from "@/components/gallery-grid";
import Container from "@/components/layout/container";
import Navbar from "@/components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/server";

const STUDENT_DICEBEAR = "https://api.dicebear.com/9.x/identicon/svg?seed=";

function getAvatarUrl(student: { avatar_url: string | null; id: string }) {
  if (student.avatar_url) return student.avatar_url;
  return `${STUDENT_DICEBEAR}${student.id}`;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PRIVACY_LABELS: Record<string, string> = {
  public: "Public",
  students_only: "Students Only",
  private: "Private",
};

export default async function ProfileByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  if (!viewer) redirect("/auth/login");

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, auth_id, full_name, nickname, bio, avatar_url, cover_url, graduation_year, graduation_project_specialty, privacy_setting, team_id, phone, location, website, social_links, is_onboarded",
    )
    .eq("id", id)
    .single();

  if (!student) notFound();

  const isOwnProfile = viewer.id === student.auth_id;

  if (!isOwnProfile && student.privacy_setting === "private") {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Profile is Private</h1>
            <p className="text-muted-foreground">
              This student has set their profile to private.
            </p>
          </div>
        </main>
      </>
    );
  }

  const { data: team } = student.team_id
    ? await supabase
        .from("teams")
        .select("id, name, team_number, project_name")
        .eq("id", student.team_id)
        .single()
    : { data: null };

  const { data: images } = await supabase
    .from("user_images")
    .select("id, storage_path, file_name, caption, is_public, created_at")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  const socialLinks = Array.isArray(student.social_links)
    ? student.social_links.filter((l: { url: string }) => l.url)
    : [];

  const displayName = student.full_name || student.nickname || "User";
  const nickname =
    student.nickname && student.full_name !== student.nickname
      ? `@${student.nickname}`
      : null;

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          <div className="h-48 sm:h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          <Container>
            <div className="relative -mt-16 flex flex-col sm:flex-row sm:items-end gap-4 pb-6">
              <Avatar className="w-28 h-28 ring-4 ring-background shadow-lg">
                <AvatarImage src={getAvatarUrl(student)} alt={displayName} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  <Badge
                    variant={
                      student.privacy_setting === "public"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {PRIVACY_LABELS[student.privacy_setting || "public"] ||
                      "Public"}
                  </Badge>
                </div>
                {nickname && (
                  <p className="text-muted-foreground">{nickname}</p>
                )}
                {student.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {student.location}
                  </p>
                )}
              </div>
              {isOwnProfile && (
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href="/settings">
                    <Edit className="w-3.5 h-3.5" />
                    Edit Profile
                  </Link>
                </Button>
              )}
            </div>
          </Container>
        </section>

        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio */}
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">About</h2>
                {student.bio ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {student.bio}
                  </p>
                ) : isOwnProfile ? (
                  <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                    <p className="text-muted-foreground text-sm">
                      Tell others about yourself
                    </p>
                    <Button asChild variant="link" size="sm" className="gap-1">
                      <Link href="/settings">
                        Add bio <Edit className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">
                    No bio yet
                  </p>
                )}
              </section>

              <Separator />

              {/* Details Grid */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailItem
                    icon={Phone}
                    label="Phone"
                    value={student.phone}
                    editable={isOwnProfile}
                  />
                  <DetailItem
                    icon={Globe}
                    label="Website"
                    value={student.website}
                    editable={isOwnProfile}
                    isLink
                  />
                  <DetailItem
                    icon={Calendar}
                    label="Graduation Year"
                    value={student.graduation_year?.toString()}
                    editable={false}
                  />
                  <DetailItem
                    icon={BookOpen}
                    label="Project Specialty"
                    value={student.graduation_project_specialty}
                    editable={isOwnProfile}
                  />
                  <DetailItem
                    icon={Users}
                    label="Team"
                    value={
                      team
                        ? team.project_name
                          ? `${team.name} — ${team.project_name}`
                          : team.name
                        : null
                    }
                    editable={isOwnProfile}
                  />
                  <DetailItem
                    icon={Shield}
                    label="Privacy"
                    value={
                      PRIVACY_LABELS[student.privacy_setting || "public"] ||
                      "Public"
                    }
                    editable={false}
                  />
                </div>
              </section>

              <Separator />

              {/* Social Links */}
              <section className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Social Links
                </h2>
                {socialLinks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map(
                      (link: { platform: string; url: string }) => (
                        <a
                          key={`${link.platform}-${link.url}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-background hover:bg-muted transition-colors text-sm"
                        >
                          {link.platform}
                        </a>
                      ),
                    )}
                  </div>
                ) : isOwnProfile ? (
                  <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                    <p className="text-muted-foreground text-sm">
                      Connect your social profiles
                    </p>
                    <Button asChild variant="link" size="sm" className="gap-1">
                      <Link href="/settings">
                        Add links <Edit className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">
                    No social links yet
                  </p>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick stats */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Gallery
                </h3>
                <p className="text-3xl font-bold">{images?.length || 0}</p>
                <p className="text-sm text-muted-foreground">photos</p>
              </div>

              {/* Team card */}
              {team && (
                <div className="rounded-xl border bg-card p-4 space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Team
                  </h3>
                  <p className="font-semibold">{team.name}</p>
                  {team.project_name && (
                    <p className="text-sm text-muted-foreground">
                      {team.project_name}
                    </p>
                  )}
                  {team.team_number && (
                    <Badge variant="outline">#{team.team_number}</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Gallery */}
          <section className="pb-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Photos</h2>
              {isOwnProfile && (
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <Link href="/settings?tab=gallery">Manage Gallery</Link>
                </Button>
              )}
            </div>
            {images && images.length > 0 ? (
              <GalleryGrid
                images={images}
                isOwnProfile={isOwnProfile}
                studentId={student.id}
              />
            ) : isOwnProfile ? (
              <div className="rounded-lg border border-dashed p-12 text-center space-y-3">
                <p className="text-muted-foreground">Share your first photo</p>
                <Button asChild variant="default" size="sm">
                  <Link href="/settings?tab=gallery">Upload Photo</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border p-12 text-center">
                <p className="text-muted-foreground text-sm">No photos yet</p>
              </div>
            )}
          </section>
        </Container>
      </main>
    </>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  editable,
  isLink,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  editable: boolean;
  isLink?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
      {value ? (
        isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium">{value}</p>
        )
      ) : editable ? (
        <div className="flex items-center gap-1 pt-1">
          <Button
            asChild
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
          >
            <Link href="/settings">
              Add {label.toLowerCase()} <Edit className="w-2.5 h-2.5 ml-0.5" />
            </Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">Not set</p>
      )}
    </div>
  );
}
