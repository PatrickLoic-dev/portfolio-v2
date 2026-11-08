import { PenSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StudioHeading, StudioTopBar } from "@/components/studio/page-header";
import { allSocialPosts } from "@/lib/social-data";
import { PostsTable } from "./posts-table";

export const metadata: Metadata = { title: "Publications" };

export default async function SocialPostsPage({ searchParams }: PageProps<"/studio/social/posts">) {
  const { statut, open } = await searchParams;
  const posts = await allSocialPosts();

  return (
    <>
      <StudioTopBar crumbs={[{ label: "Studio", href: "/studio" }, { label: "Réseaux sociaux", href: "/studio/social" }, { label: "Publications" }]}>
        <Link href="/studio/social/compose" className="btn btn-primary min-h-11 px-[18px] text-sm">
          <PenSquare size={16} aria-hidden />
          Composer
        </Link>
      </StudioTopBar>
      <div className="flex flex-col gap-6 p-[clamp(24px,3vw,40px)]">
        <StudioHeading
          kicker={`Gérer · ${posts.length} publication${posts.length > 1 ? "s" : ""}`}
          title="Publications"
          intro="Tout ce qui part, est parti ou attend sur vos réseaux. À l'heure prévue, une publication passe dans « À publier »."
        />
        <PostsTable posts={posts} initialTab={typeof statut === "string" ? statut : null} openId={typeof open === "string" ? open : null} />
      </div>
    </>
  );
}
