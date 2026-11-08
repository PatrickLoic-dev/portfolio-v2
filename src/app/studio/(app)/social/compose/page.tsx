import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/content/site";
import { getPublishedPosts } from "@/lib/notes";
import { getSetting } from "@/lib/portfolio";
import { getSocialPost } from "@/lib/social-data";
import { Composer } from "./composer";

export const metadata: Metadata = { title: "Composer" };

export default async function ComposePage({ searchParams }: PageProps<"/studio/social/compose">) {
  const { id, note } = await searchParams;
  const [post, notes, social] = await Promise.all([
    typeof id === "string" && /^[0-9a-f-]{36}$/.test(id) ? getSocialPost(id) : null,
    getPublishedPosts("fr"),
    getSetting("social"),
  ]);
  if (typeof id === "string" && !post) notFound();

  const noteOptions = notes.map((n) => ({
    id: n.id,
    title: n.title,
    text: `${n.excerpt}${n.tags.length ? `\n\n${n.tags.map((t) => `#${t.replace(/[^\p{L}\p{N}]/gu, "")}`).join(" ")}` : ""}`,
    link: `${site.url}/fr/blog/${n.slug}`,
    cover: n.coverUrl,
  }));

  return <Composer key={post?.id ?? "new"} post={post} notes={noteOptions} slots={social.slots} initialNote={typeof note === "string" ? note : null} />;
}
