"use client";

import { LogOutIcon, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/client";

const STUDENT_DICEBEAR = "https://api.dicebear.com/9.x/identicon/svg?seed=";

interface StudentPreview {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
}

function getAvatarUrl(student: StudentPreview) {
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

export default function NavbarUserMenu({
  student,
}: {
  student: StudentPreview;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const displayName = student.full_name || student.nickname || "User";
  const nickname =
    student.nickname && student.full_name !== student.nickname
      ? `@${student.nickname}`
      : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-auto p-0 hover:bg-transparent" variant="ghost">
          <Avatar>
            <AvatarImage src={getAvatarUrl(student)} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem
          className="flex min-w-0 flex-col gap-0.5 px-4 py-1"
          asChild
        >
          <Link href="/protected" className="cursor-pointer flex items-start">
            <span className="truncate font-medium text-foreground text-sm">
              {displayName}
            </span>
            {nickname && (
              <span className="truncate font-normal text-muted-foreground text-xs">
                {nickname}
              </span>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings2 aria-hidden="true" className="opacity-60" size={16} />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOutIcon aria-hidden="true" className="opacity-60" size={16} />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
