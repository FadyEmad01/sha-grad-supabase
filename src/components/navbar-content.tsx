"use client";

import Link from "next/link";
import { useState } from "react";

import NavbarLogo from "@/components/navbar-logo";
import NavbarSearch from "@/components/navbar-search";
import NavbarUserMenu from "@/components/navbar-user-menu";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StudentPreview {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
}

export default function NavbarContent({
  isAuthenticated,
  student,
}: {
  isAuthenticated: boolean;
  student: StudentPreview | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          {/* <Popover open={mobileOpen} onOpenChange={setMobileOpen}>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                size="icon"
                variant="ghost"
              >
                <svg
                  aria-hidden="true"
                  className="pointer-events-none"
                  fill="none"
                  height={16}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width={16}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className="-translate-y-[7px] origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-315"
                    d="M4 12L20 12"
                  />
                  <path
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                    d="M4 12H20"
                  />
                  <path
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-135"
                    d="M4 12H20"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-36 p-1 md:hidden">
              <div className="py-1.5 text-sm text-muted-foreground">Menu</div>
            </PopoverContent>
          </Popover> */}

          <div className="flex items-center">
            <Link className="text-primary hover:text-primary/90" href="/">
              <NavbarLogo />
            </Link>
          </div>
        </div>

        <div className="grow">
          <NavbarSearch />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {isAuthenticated && student ? (
            <NavbarUserMenu student={student} />
          ) : (
            <Button asChild>
              <Link href="/auth/login">Get Started</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
