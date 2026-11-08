import type { Locale } from "@/i18n/routing";
import type { Tone } from "./projects";

export const categories = ["engineering", "design", "product", "studio", "community"] as const;
export type Category = (typeof categories)[number];

export const categoryTone: Record<Category, Tone> = {
  engineering: "leaf",
  design: "sage",
  product: "sand",
  studio: "peach",
  community: "muted",
};

type PostText = {
  title: string;
  excerpt: string;
  /** Short display line shown on the cover; use \n for line breaks. */
  hook: string;
  /** Section titles, in order, for the table of contents (ids s1…sN). */
  toc?: string[];
};

export type Post = {
  slug: string;
  category: Category;
  date: string; // ISO
  minutes: number;
  tone: Tone;
  featured?: boolean;
  /** Body lives in src/content/blog/<slug>.<locale>.mdx when true. */
  hasBody: boolean;
  relatedProject?: string;
  tags?: string[];
  text: Record<Locale, PostText>;
};

export const posts: Post[] = [
  {
    slug: "idempotent-transfers",
    category: "engineering",
    date: "2026-10-12",
    minutes: 8,
    tone: "peach",
    featured: true,
    hasBody: true,
    relatedProject: "fly-banking",
    tags: ["Angular", "NestJS", "Fintech", "Reliability"],
    text: {
      en: {
        title: "Idempotent transfers: what a banking frontend taught me about retries",
        excerpt:
          'Diaspora users on unstable connections tap "Send" twice. Here\'s how typed services and idempotency keys keep money moving exactly once.',
        hook: "Twice\nis too\nmany",
        toc: ["The double-tap problem", "Keys, not hope", "Typing the contract", "What the user sees", "Takeaways"],
      },
      fr: {
        title: "Virements idempotents : ce qu'un frontend bancaire m'a appris sur les retries",
        excerpt:
          "Sur une connexion instable, les clients de la diaspora appuient deux fois sur « Envoyer ». Voici comment des services typés et des clés d'idempotence font circuler l'argent une seule fois.",
        hook: "Deux fois,\nc'est\ntrop",
        toc: ["Le problème du double tap", "Des clés, pas de l'espoir", "Typer le contrat", "Ce que voit l'utilisateur", "À retenir"],
      },
    },
  },
  {
    slug: "typed-end-to-end",
    category: "engineering",
    date: "2026-09-28",
    minutes: 7,
    tone: "leaf",
    hasBody: false,
    text: {
      en: {
        title: "Typed end-to-end: Angular and NestJS without the glue code",
        excerpt: "Sharing DTOs between client and API so a renamed field breaks the build, not production.",
        hook: "One type,\ntwo sides",
      },
      fr: {
        title: "Typé de bout en bout : Angular et NestJS sans code de colle",
        excerpt: "Partager les DTO entre client et API pour qu'un champ renommé casse le build, pas la production.",
        hook: "Un type,\ndeux côtés",
      },
    },
  },
  {
    slug: "replacing-whatsapp-ordering",
    category: "product",
    date: "2026-09-14",
    minutes: 6,
    tone: "sand",
    hasBody: false,
    relatedProject: "click-cadyst",
    text: {
      en: {
        title: "Replacing WhatsApp ordering with a mobile app",
        excerpt: "What Click Cadyst taught me about digitizing a workflow people already rely on.",
        hook: "Goodbye,\nvoice notes",
      },
      fr: {
        title: "Remplacer la commande WhatsApp par une app mobile",
        excerpt: "Ce que Click Cadyst m'a appris sur la digitalisation d'un usage dont les gens dépendent déjà.",
        hook: "Adieu,\nnotes vocales",
      },
    },
  },
  {
    slug: "design-tokens-before-pixels",
    category: "design",
    date: "2026-08-30",
    minutes: 5,
    tone: "sage",
    hasBody: false,
    text: {
      en: {
        title: "Design tokens before pixels",
        excerpt: "Why every project now starts with a color, type and motion system — even the small ones.",
        hook: "Tokens\nfirst",
      },
      fr: {
        title: "Les tokens avant les pixels",
        excerpt: "Pourquoi chaque projet commence désormais par un système de couleurs, de typo et de mouvement — même les petits.",
        hook: "Tokens\nd'abord",
      },
    },
  },
  {
    slug: "mobile-money-checkout",
    category: "engineering",
    date: "2026-08-09",
    minutes: 9,
    tone: "terracotta",
    hasBody: false,
    relatedProject: "mon-panier",
    text: {
      en: {
        title: "Mobile money in a marketplace checkout",
        excerpt: "Designing payment states for networks that confirm late, fail quietly or both.",
        hook: "Pay\nlocal",
      },
      fr: {
        title: "Le mobile money dans un checkout de marketplace",
        excerpt: "Concevoir des états de paiement pour des réseaux qui confirment tard, échouent en silence, ou les deux.",
        hook: "Payer\nlocal",
      },
    },
  },
  {
    slug: "starting-a-studio-in-douala",
    category: "studio",
    date: "2026-07-21",
    minutes: 6,
    tone: "ink",
    hasBody: false,
    text: {
      en: {
        title: "Starting a web studio from Douala",
        excerpt: "Notes from the first year of KreativEinfluss: clients, pricing and saying no.",
        hook: "Studio,\nday one",
      },
      fr: {
        title: "Lancer un studio web depuis Douala",
        excerpt: "Notes de la première année de KreativEinfluss : clients, tarifs et l'art de dire non.",
        hook: "Studio,\njour un",
      },
    },
  },
  {
    slug: "home-for-tekken-cameroon",
    category: "community",
    date: "2026-07-02",
    minutes: 4,
    tone: "muted",
    hasBody: false,
    relatedProject: "tekken-mboa",
    text: {
      en: {
        title: "Building a home for the Cameroonian Tekken scene",
        excerpt: "Tournaments, rankings and a community site built on evenings and weekends.",
        hook: "Game\non",
      },
      fr: {
        title: "Construire un foyer pour la scène Tekken camerounaise",
        excerpt: "Tournois, classements et un site communautaire construit les soirs et week-ends.",
        hook: "Game\non",
      },
    },
  },
];

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}
