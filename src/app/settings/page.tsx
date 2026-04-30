import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import SettingsForm from "@/components/settings-form";
import { createClient } from "@/lib/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, full_name, nickname, bio, phone, location, avatar_url, graduation_project_specialty, privacy_setting, team_id, website, social_links",
    )
    .eq("auth_id", user.id)
    .single();

  if (!student) redirect("/onboarding");

  return (
    <>
      <Navbar />
      <SettingsForm
        studentId={student.id}
        userId={user.id}
        initialData={student}
      />
    </>
  );
}
