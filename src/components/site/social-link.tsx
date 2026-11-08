import type { ReactNode } from "react";
import { BrandIcon, type Brand } from "@/components/brand-icon";
import { site } from "@/content/site";
import { cn } from "@/lib/cn";

export const SOCIALS: { brand: Brand; label: string; url: string }[] = [
  { brand: "github", label: "GitHub", url: site.social.github.url },
  { brand: "linkedin", label: "LinkedIn", url: site.social.linkedin.url },
  { brand: "x", label: "X", url: site.social.x.url },
];

/** Brand logo + name, used in footers and the mobile menu. */
export function SocialLink({ brand, href, children, className, size = 14 }: { brand: Brand; href: string; children: ReactNode; className?: string; size?: number }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-2", className)}>
      <BrandIcon brand={brand} size={size} />
      {children}
    </a>
  );
}
