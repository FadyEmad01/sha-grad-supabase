"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

const STUDENT_DICEBEAR = "https://api.dicebear.com/9.x/identicon/svg?seed=";

interface TeamMember {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
}

function getAvatarUrl(member: TeamMember) {
  if (member.avatar_url) return member.avatar_url;
  return `${STUDENT_DICEBEAR}${member.id}`;
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

export default function TeamMembersGrid({
  members,
}: {
  members: TeamMember[];
}) {
  if (!members || members.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {members.map((member) => {
        const displayName = member.full_name || member.nickname || "User";
        const nickname =
          member.nickname && member.full_name !== member.nickname
            ? `@${member.nickname}`
            : null;

        return (
          <Link
            key={member.id}
            href={`/profile/${member.id}`}
            className="group block"
          >
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
              <Avatar className="w-16 h-16">
                <AvatarImage src={getAvatarUrl(member)} alt={displayName} />
                <AvatarFallback className="bg-secondary/20 text-secondary-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center space-y-0.5">
                <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                  {displayName}
                </p>
                {nickname && (
                  <p className="text-xs text-muted-foreground">{nickname}</p>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
