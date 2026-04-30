import { useStudentProfile } from "./use-student-profile";

export function useCurrentUserName() {
  const { student, loading } = useStudentProfile();

  if (loading) return "?";
  return student?.full_name || student?.nickname || "";
}
