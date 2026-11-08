import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/studio");

  return (
    <main className="flex min-h-screen flex-wrap bg-background">
      <section className="flex flex-[1_1_420px] flex-col justify-between gap-16 bg-ink p-[clamp(28px,5vw,64px)] text-background">
        <Link href="/" className="display text-xl leading-none tracking-[-0.02em]">
          Patrick Loic<span className="text-accent">.</span>
        </Link>
        <div className="flex flex-col gap-5">
          <span className="label text-blob-a">Studio · Contenu, social &amp; passions</span>
          <h1 className="display text-[clamp(56px,8vw,120px)]">
            Bon
            <br />
            retour<span className="text-accent">.</span>
          </h1>
          <p className="m-0 max-w-[420px] text-[17px] leading-relaxed text-background/70">
            Écrivez, programmez et organisez les notes du blog depuis un seul endroit.
          </p>
        </div>
        <span className="label text-background/50">Accès réservé à l&apos;administrateur</span>
      </section>
      <section className="flex flex-[1_1_480px] items-center justify-center p-[clamp(24px,5vw,64px)]">
        <LoginForm />
      </section>
    </main>
  );
}
