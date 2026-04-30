"use client";

import {
  LayoutDashboard,
  LogOutIcon,
  Settings2,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStudentProfile } from "@/hooks/use-student-profile";
import { createClient } from "@/lib/client";

export default function NavbarUserMenu() {
  const { student, loading } = useStudentProfile();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-auto p-0 hover:bg-transparent" variant="ghost">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          </Button>
        </DropdownMenuTrigger>
      </DropdownMenu>
    );
  }

  const displayName = student?.full_name || student?.nickname || "User";
  const nickname =
    student?.nickname && student?.full_name !== student?.nickname
      ? `@${student.nickname}`
      : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-auto p-0 hover:bg-transparent" variant="ghost">
          <CurrentUserAvatar />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {/* <DropdownMenuLabel className="flex min-w-0 flex-col gap-0.5 px-4 py-1">
          <span className="truncate font-medium text-foreground text-sm">
            {displayName}
          </span>
          {nickname && (
            <span className="truncate font-normal text-muted-foreground text-xs">
              {nickname}
            </span>
          )}
        </DropdownMenuLabel> */}
        <DropdownMenuItem className="flex min-w-0 flex-col gap-0.5 px-4 py-1" asChild>
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
          {/* <DropdownMenuItem asChild>
            <Link href="/protected" className="cursor-pointer">
              <LayoutDashboard
                aria-hidden="true"
                className="opacity-60"
                size={16}
              />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem> */}
          {/* <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <UserCircle aria-hidden="true" className="opacity-60" size={16} />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem> */}
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings2 aria-hidden="true" className="opacity-60" size={16} />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {/* <DropdownMenuSeparator /> */}
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
