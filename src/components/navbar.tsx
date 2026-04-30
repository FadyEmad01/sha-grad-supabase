import NavbarContent from "@/components/navbar-content";
import { createClient } from "@/lib/server";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let student = null;
  if (user) {
    const { data } = await supabase
      .from("students")
      .select("id, full_name, nickname, avatar_url")
      .eq("auth_id", user.id)
      .single();
    student = data;
  }

  return <NavbarContent isAuthenticated={!!user} student={student} />;
}
