import { useStudentProfile } from "./use-student-profile";

export function useCurrentUserImage() {
  const { student } = useStudentProfile();

  return student?.avatar_url ?? null;
}
