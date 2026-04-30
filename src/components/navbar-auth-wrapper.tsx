"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NavbarUserMenu from "@/components/navbar-user-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";

export default function NavbarAuthWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await createClient().auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    checkAuth();

    const { data: listener } = createClient().auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (isAuthenticated) {
    return <NavbarUserMenu />;
  }

  return (
    <Button asChild>
      <Link href="/auth/login">Get Started</Link>
    </Button>
  );
}
