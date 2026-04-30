"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/client";

interface StudentProfile {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
}

export function useStudentProfile() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const { data: authData, error: authError } =
          await createClient().auth.getSession();
        if (authError) throw authError;

        if (!authData.session) {
          setStudent(null);
          setLoading(false);
          return;
        }

        const { data, error } = await createClient()
          .from("students")
          .select("id, full_name, nickname, avatar_url")
          .eq("auth_id", authData.session.user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (cancelled) return;

        setStudent(data as StudentProfile | null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch student profile"),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProfile();

    const { data: listener } = createClient().auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setLoading(true);
          setStudent(null);
          fetchProfile();
        } else {
          setStudent(null);
          setLoading(false);
        }
      },
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { student, loading, error };
}
