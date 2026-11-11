"use client";

import { Check, Plug, Unplug } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { NetBadge } from "@/components/studio/net-badge";
import { useToast } from "@/components/studio/toast";
import { NETWORKS } from "@/lib/social";
import { disconnectNetwork } from "../../../social-actions";

type Conn = { configured: boolean; connected: boolean; name: string | null; expiresAt: string | null; refreshes: boolean };

const ENV = { linkedin: "LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET", x: "X_CLIENT_ID / X_CLIENT_SECRET" } as const;
const HELP = {
  linkedin: "Créez une app sur developer.linkedin.com, ajoutez le produit « Share on LinkedIn » et « Sign In with LinkedIn using OpenID Connect ».",
  x: "Créez une app sur developer.x.com, activez OAuth 2.0 en « Read and write » (type Web App).",
} as const;
const MESSAGES: Record<string, [string, "ok" | "error"]> = {
  ok: ["Compte connecté", "ok"],
  annulee: ["Connexion annulée", "error"],
  invalide: ["La connexion a expiré, recommencez", "error"],
  erreur: ["Le réseau a refusé la connexion. Vérifiez les clés et l'adresse de retour de l'app.", "error"],
};

const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

/** "Publication directe": connect LinkedIn and X once, then publish from the Studio. */
export function ApiConnections({ conns, origin, status }: { conns: Record<"linkedin" | "x", Conn>; origin: string; status: string | null }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();

  useEffect(() => {
    const m = status && MESSAGES[status];
    if (m) {
      toast(m[0], { tone: m[1] });
      router.replace("/studio/social/accounts");
    }
  }, [status, toast, router]);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="api-title">
      <div className="hairline flex flex-col gap-1 border-t pt-5">
        <h2 id="api-title" className="m-0 text-xl font-bold">
          Publication directe
        </h2>
        <p className="m-0 max-w-[720px] text-sm leading-relaxed text-muted-foreground">
          Connectez LinkedIn et X pour publier depuis le Studio en un clic (bouton « Publier maintenant » dans la fenêtre À publier). Instagram reste
          en publication manuelle.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {(["linkedin", "x"] as const).map((n) => {
          const c = conns[n];
          return (
            <div key={n} className="hairline flex flex-col gap-3 rounded-[20px] border bg-card p-[22px]">
              <div className="flex items-center gap-3">
                <NetBadge network={n} size={36} className="rounded-lg" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-bold">{NETWORKS[n].name}</span>
                  <span className="truncate text-[13px] text-muted-foreground">
                    {c.connected ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-success-ink">
                        <Check size={14} aria-hidden /> {c.name}
                      </span>
                    ) : c.configured ? (
                      "Non connecté"
                    ) : (
                      "Application à configurer"
                    )}
                  </span>
                </div>
              </div>
              {c.connected && c.expiresAt && !c.refreshes && (
                <span className="text-xs text-muted-foreground">Connexion valable jusqu&apos;au {day(c.expiresAt)}, reconnectez ensuite.</span>
              )}
              {!c.configured && (
                <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted-foreground">
                  <span>{HELP[n]}</span>
                  <span>
                    Adresse de retour : <code className="break-all font-mono text-xs text-foreground">{`${origin}/studio/social/callback/${n}`}</code>
                  </span>
                  <span>
                    Puis ajoutez <code className="font-mono text-xs text-foreground">{ENV[n]}</code> aux variables d&apos;environnement.
                  </span>
                </div>
              )}
              <div className="mt-auto flex flex-wrap gap-2">
                {c.configured && (
                  <a href={`/studio/social/connect/${n}`} className="btn btn-primary min-h-10 px-4 text-sm">
                    <Plug size={15} aria-hidden />
                    {c.connected ? "Reconnecter" : "Connecter"}
                  </a>
                )}
                {c.connected && (
                  <button
                    type="button"
                    className="btn btn-ghost min-h-10 px-4 text-sm"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        await disconnectNetwork(n);
                        toast(`${NETWORKS[n].name} déconnecté`);
                        router.refresh();
                      })
                    }
                  >
                    <Unplug size={15} aria-hidden />
                    Déconnecter
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
