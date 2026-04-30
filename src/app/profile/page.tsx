import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!student) redirect("/onboarding");
  redirect(`/profile/${student.id}`);
}
