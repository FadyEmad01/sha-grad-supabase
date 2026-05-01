import { redirect } from "next/navigation";
import Container from "@/components/layout/container";
import Navbar from "@/components/navbar";
import TeamsCarousel from "@/components/teamCarousel";
import CommunityMasonryGrid from "@/components/community-masonry-grid";
import { createClient } from "@/lib/server";

export default async function ExplorePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <>
      {/* <div className="flex h-svh w-full items-center justify-center gap-2">
        <p>
          Hello <span>{data.claims.email}</span>
        </p>
        <LogoutButton />
      </div> */}
      <Navbar />
      <main>
        <section className="pt-10 pb-4">
          <Container>
            <div className="max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Explore Graduation Teams
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Discover teams and their projects
              </p>
            </div>
          </Container>
        </section>
        <TeamsCarousel />
        <section className="py-10">
          <Container>
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Community
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Photos from all teams
              </p>
            </div>
            <CommunityMasonryGrid />
          </Container>
        </section>
      </main>
    </>
  );
}
