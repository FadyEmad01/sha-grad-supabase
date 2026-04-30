import TeamsCarouselClient from "@/components/teams-carousel-client";
import { createClient } from "@/lib/server";

export default async function TeamsCarousel() {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, team_number, logo_url")
    .order("team_number");

  if (!teams || teams.length === 0) {
    return null;
  }

  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  const teamsWithMembers = await Promise.all(
    selected.map(async (team) => {
      const { data: members } = await supabase
        .from("students")
        .select("id, full_name, avatar_url")
        .eq("team_id", team.id)
        .limit(3);

      return {
        ...team,
        members: members ?? [],
      };
    }),
  );

  return <TeamsCarouselClient teams={teamsWithMembers} />;
}
