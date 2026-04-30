"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useScrollFade } from "@/hooks/useScrollFade";
import TeamFolder from "./teamFolder";

interface TeamMember {
  id: string
  full_name: string
  avatar_url: string | null
}

interface TeamData {
  id: string;
  name: string;
  team_number: number | null;
  members: TeamMember[];
}

export default function TeamsCarouselClient({ teams }: { teams: TeamData[] }) {
  const {
    ref: viewportRef,
    showStartFade,
    showEndFade,
  } = useScrollFade<HTMLDivElement>("horizontal");

  return (
    <div className="relative w-full">
      <div
        className={`pointer-events-none absolute left-0 top-0 h-full w-8 z-50 transition-opacity duration-200 ${showStartFade ? "opacity-100" : "opacity-0"} bg-gradient-to-r from-background to-transparent`}
      />
      <div
        className={`pointer-events-none absolute right-0 top-0 h-full w-8 z-50 transition-opacity duration-200 ${showEndFade ? "opacity-100" : "opacity-0"} bg-gradient-to-l from-background to-transparent`}
      />

      <ScrollArea viewportRef={viewportRef} className="w-full">
        <div className="flex gap-20 w-max pb-6 pt-14 mx-auto px-4 sm:px-6 lg:px-8">
          {teams.map((team) => (
            <TeamFolder key={team.id} team={team} />
          ))}
        </div>
        <ScrollBar className="opacity-0" orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
