"use client";

import Link from "next/link";
import { useId } from "react";

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/identicon/svg?seed=";

const LAYOUTS = {
  1: [
    { x: 40, y: 40, rot: 0, hover: "group-hover:rotate-3 group-hover:scale-105" },
  ],
  2: [
    { x: 22, y: 42, rot: -5, hover: "group-hover:-rotate-8 group-hover:-translate-x-8 group-hover:scale-105" },
    { x: 58, y: 42, rot: 5, hover: "group-hover:rotate-8 group-hover:translate-x-8 group-hover:scale-105" },
  ],
  3: [
    { x: 23, y: 44, rot: -3, hover: "group-hover:-rotate-12 group-hover:-translate-x-10" },
    { x: 35, y: 38, rot: -7, hover: "group-hover:-rotate-6 group-hover:-translate-y-4" },
    { x: 58, y: 44, rot: 1.5, hover: "group-hover:rotate-12 group-hover:translate-x-10 group-hover:scale-110" },
  ],
};

interface TeamMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface TeamData {
  id: string;
  name: string;
  team_number: number | null;
  members: TeamMember[];
}

function getMemberAvatars(members: TeamMember[]): { url: string; name: string }[] {
  return members.slice(0, 3).map((m) => ({
    url: m.avatar_url ?? `${DICEBEAR_BASE}${m.id}`,
    name: m.full_name ?? "Unknown",
  }));
}

const TeamFolder = ({ team }: { team: TeamData }) => {
  const svgId = useId().replace(/:/g, "");

  const members = team.members ?? [];
  const avatars = getMemberAvatars(members);
  const count = avatars.length;
  const layout = LAYOUTS[(count >= 1 && count <= 3 ? count : 1) as 1 | 2 | 3];

  return (
    <Link
      href={`/team/${team.id}`}
      className="group relative flex flex-col gap-3 items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
    >
      <svg
        aria-hidden="true"
        width={215}
        height={214}
        viewBox="0 0 215 214"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {avatars.map((av, i) => (
            <pattern
              key={i}
              id={`pattern${i}-${svgId}`}
              patternContentUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <image
                href={av.url}
                width="1"
                height="1"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          ))}

          <filter
            id={`filter_inner_shadow-${svgId}`}
            x={-50}
            y={-50}
            width={314.645}
            height={313.224}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity={0} result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy={1} />
            <feGaussianBlur stdDeviation={2} />
            <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"
            />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
          </filter>

          <clipPath id={`clip_front-${svgId}`} transform="translate(0 -90)">
            <path d="M0 105.711C0 97.4266 6.71573 90.7109 15 90.7109L37.3985 90.7109C45.8055 90.7109 53.5863 95.1544 57.8583 102.395C62.1302 109.636 69.9111 114.079 78.318 114.079H174.645C196.736 114.079 214.645 131.988 214.645 154.079V173.224C214.645 195.315 196.736 213.224 174.645 213.224H40C17.9086 213.224 0 195.315 0 173.224V105.711Z" />
          </clipPath>
        </defs>

        {/* ===== BACK PANEL ===== */}
        <path
          d="M0 40C0 17.9086 17.9086 0 40 0L174.645 0C196.736 0 214.645 17.9086 214.645 40V173.224C214.645 195.315 196.736 213.224 174.645 213.224L40 213.224C17.9086 213.224 0 195.315 0 173.224L0 40Z"
          className="fill-neutral-200 dark:fill-neutral-900"
          filter={`url(#filter_inner_shadow-${svgId})`}
        />

        {/* Animated Images Layer */}
        <g className="transition-all duration-500 ease-out group-hover:-translate-y-11">
          {layout.map((pos, i) => (
            <rect
              key={i}
              x={pos.x}
              y={pos.y}
              width="134"
              height="134"
              rx="10"
              fill={`url(#pattern${i}-${svgId})`}
              transform={`rotate(${pos.rot} ${pos.x} ${pos.y})`}
              className={`transition-transform duration-500 ease-out ${pos.hover}`}
            />
          ))}
        </g>

        {/* ===== FRONT GLASS PANEL ===== */}
        <g>
          <path
            d="M0 105.711C0 97.4266 6.71573 90.7109 15 90.7109L37.3985 90.7109C45.8055 90.7109 53.5863 95.1544 57.8583 102.395C62.1302 109.636 69.9111 114.079 78.318 114.079H174.645C196.736 114.079 214.645 131.988 214.645 154.079V173.224C214.645 195.315 196.736 213.224 174.645 213.224H40C17.9086 213.224 0 195.315 0 173.224V105.711Z"
            className="fill-neutral-300/50 dark:fill-neutral-800/50"
          />
          <foreignObject x="0" y="90" width="215" height="124">
            <div
              style={{
                width: "100%",
                height: "100%",
                backdropFilter: "blur(25px)",
                WebkitBackdropFilter: "blur(25px)",
                clipPath: `url(#clip_front-${svgId})`,
              }}
              className="border-t border-white/10 dark:border-white/10"
            />
          </foreignObject>
        </g>
      </svg>

      <div className="flex flex-col items-center gap-0.5">
        <span className="font-semibold text-sm">{team.name}</span>
        <span className="text-xs text-muted-foreground">
          Team {team.team_number ?? "—"} • {members.length} Members
        </span>
      </div>
    </Link>
  );
};

export default TeamFolder;
