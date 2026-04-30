"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { HighlightMatch } from "@/components/highlight-match";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/client";

const STUDENT_DICEBEAR = "https://api.dicebear.com/9.x/identicon/svg?seed=";
const TEAM_DICEBEAR = "https://api.dicebear.com/9.x/glass/svg?seed=";

interface StudentResult {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
}

interface TeamResult {
  id: string;
  name: string;
  project_name: string | null;
  team_number: number | null;
  logo_url: string | null;
}

interface SearchResult {
  students: StudentResult[];
  teams: TeamResult[];
}

function getStudentAvatarUrl(student: StudentResult) {
  if (student.avatar_url) return student.avatar_url;
  return `${STUDENT_DICEBEAR}${student.id}`;
}

function getTeamAvatarUrl(team: TeamResult) {
  if (team.logo_url) return team.logo_url;
  const seed = team.team_number ?? team.id;
  return `${TEAM_DICEBEAR}${seed}`;
}

function getTeamInitials(team: TeamResult) {
  if (team.project_name) {
    return team.project_name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return team.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function NavbarSearch() {
  const id = useId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({
    students: [],
    teams: [],
  });
  const [loading, setLoading] = useState(false);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results
  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ students: [], teams: [] });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const teamTextQuery = supabase
      .from("teams")
      .select("id, name, project_name, team_number, logo_url")
      .or(`name.ilike.%${q}%,project_name.ilike.%${q}%`)
      .limit(5);

    const teamNumberQuery = /^\d+$/.test(q.trim())
      ? supabase
          .from("teams")
          .select("id, name, project_name, team_number, logo_url")
          .eq("team_number", parseInt(q.trim()))
          .limit(5)
      : null;

    const [studentsRes, teamsTextRes, teamsNumberRes] = await Promise.all([
      supabase
        .from("students")
        .select("id, full_name, nickname, avatar_url")
        .or(`full_name.ilike.%${q}%,nickname.ilike.%${q}%`)
        .limit(5),
      teamTextQuery,
      teamNumberQuery,
    ]);

    const allTeams = [
      ...(teamsTextRes.data ?? []),
      ...(teamsNumberRes?.data ?? []),
    ];
    const uniqueTeams = [
      ...new Map(allTeams.map((t) => [t.id, t])).values(),
    ].slice(0, 5);

    setResults({
      students: (studentsRes.data ?? []) as StudentResult[],
      teams: uniqueTeams as TeamResult[],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = useCallback(
    (type: "student" | "team", item: StudentResult | TeamResult) => {
      setOpen(false);
      setQuery("");
      if (type === "student") {
        router.push(`/profile?id=${(item as StudentResult).id}`);
      } else {
        router.push(`/teams?id=${(item as TeamResult).id}`);
      }
    },
    [router],
  );

  const showDropdown = open && query.length > 0;

  return (
    <div ref={triggerRef} className="relative mx-auto w-full max-w-xs">
      <Popover open={showDropdown} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              className="peer h-8 ps-8 pe-10"
              id={id}
              placeholder="Search..."
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => query.length > 0 && setOpen(true)}
              onBlur={() => {
                // Delay to allow command item click
                setTimeout(() => setOpen(false), 150);
              }}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2 text-muted-foreground/80 peer-disabled:opacity-50">
              <SearchIcon size={16} />
            </div>
            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 text-muted-foreground">
              <kbd className="inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] font-medium text-[0.625rem] text-muted-foreground/70">
                ⌘K
              </kbd>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="z-50 w-[var(--radix-popover-trigger-width)] p-0"
          sideOffset={10}
          side="bottom"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          avoidCollisions={false}
        >
          <Command className="rounded-none border-none shadow-none">
            <CommandInput
              value={query}
              onValueChange={(q) => {
                setQuery(q);
                setOpen(true);
              }}
              placeholder="Search students or teams..."
              className="h-9 border-0 focus-visible:ring-0"
            />
            <CommandList className="max-h-72">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {loading ? "Searching..." : "No results found"}
              </CommandEmpty>

              {/* Students */}
              {results.students.length > 0 && (
                <CommandGroup heading="Students">
                  {results.students.map((student) => (
                    <CommandItem
                      key={student.id}
                      value={`${student.full_name} ${student.nickname ?? ""}`}
                      onSelect={() => handleSelect("student", student)}
                      className="cursor-pointer"
                    >
                      <Avatar className="mr-2 size-6 shrink-0">
                        <AvatarImage
                          src={getStudentAvatarUrl(student)}
                          alt={student.full_name ?? ""}
                        />
                        <AvatarFallback className="text-[10px]">
                          {student.full_name
                            ?.split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="truncate text-sm">
                          <HighlightMatch
                            text={student.full_name ?? student.nickname ?? ""}
                            query={debouncedQuery}
                          />
                        </span>
                        {student.nickname && student.full_name && (
                          <span className="truncate text-xs text-muted-foreground">
                            @
                            <HighlightMatch
                              text={student.nickname}
                              query={debouncedQuery}
                            />
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Teams */}
              {results.teams.length > 0 && (
                <CommandGroup heading="Teams">
                  {results.teams.map((team) => (
                    <CommandItem
                      key={team.id}
                      value={`${team.name} ${team.project_name ?? ""} ${team.team_number ?? ""}`}
                      onSelect={() => handleSelect("team", team)}
                      className="cursor-pointer"
                    >
                      <Avatar className="mr-2 size-6 shrink-0">
                        <AvatarImage
                          src={getTeamAvatarUrl(team)}
                          alt={team.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                          {getTeamInitials(team)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="truncate text-sm">
                          <HighlightMatch
                            text={team.name}
                            query={debouncedQuery}
                          />
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {team.project_name && (
                            <>
                              <HighlightMatch
                                text={team.project_name}
                                query={debouncedQuery}
                              />
                              {team.team_number != null && (
                                <>
                                  {" · "}Team #{team.team_number}
                                </>
                              )}
                            </>
                          )}
                          {!team.project_name && team.team_number != null && (
                            <>Team #{team.team_number}</>
                          )}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
