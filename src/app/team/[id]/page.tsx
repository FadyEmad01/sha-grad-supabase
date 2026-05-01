import {
  FolderOpen,
  Users,
  MapPin,
  LinkIcon,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import Navbar from "@/components/navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import TeamMembersGrid from "@/components/team-members-grid";
import { createClient } from "@/lib/server";

const TEAM_DICEBEAR = "https://api.dicebear.com/9.x/identicon/svg?seed=";

function getTeamAvatarUrl(team: { logo_url: string | null; id: string }) {
  if (team.logo_url) return team.logo_url;
  return `${TEAM_DICEBEAR}${team.id}`;
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

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, team_number, project_name, logo_url")
    .eq("id", id)
    .single();

  if (!team) notFound();

  const { data: members } = await supabase
    .from("students")
    .select("id, full_name, nickname, avatar_url")
    .eq("team_id", id)
    .order("full_name");

  const { data: viewer } = await supabase.auth.getUser();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          <div className="h-48 sm:h-64 bg-gradient-to-br from-secondary/30 via-secondary/10 to-background" />
          <Container>
            <div className="relative -mt-16 flex flex-col sm:flex-row sm:items-end gap-4 pb-6">
              <Avatar className="w-32 h-32 ring-4 ring-background shadow-lg">
                <AvatarImage
                  src={getTeamAvatarUrl(team)}
                  alt={team.name}
                />
                <AvatarFallback className="text-4xl bg-secondary/20 text-secondary-foreground">
                  {getInitials(team.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{team.name}</h1>
                  {team.team_number && (
                    <Badge variant="outline">#{team.team_number}</Badge>
                  )}
                </div>
                {team.project_name && (
                  <p className="text-muted-foreground">{team.project_name}</p>
                )}
              </div>
            </div>
          </Container>
        </section>

        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Team Members */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Members ({members?.length || 0})
                </h2>
                {members && members.length > 0 ? (
                  <TeamMembersGrid members={members} />
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="text-muted-foreground text-sm">
                      No members yet
                    </p>
                  </div>
                )}
              </section>

              <Separator />

              {/* Quick Links / Actions */}
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Quick Links</h2>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/profile/${viewer?.user?.id}`}>
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      My Profile
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/explore">
                      <Globe className="w-3.5 h-3.5 mr-1.5" />
                      Explore Teams
                    </Link>
                  </Button>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Team Stats */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Team Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Members</span>
                    <span className="font-semibold">{members?.length || 0}</span>
                  </div>
                  {team.team_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Team Number</span>
                      <Badge variant="outline">#{team.team_number}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Info Card */}
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Team Info
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium">{team.name}</span>
                  </div>
                  {team.project_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {team.project_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
