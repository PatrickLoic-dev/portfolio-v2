import { BrandIcon, type Brand } from "@/components/brand-icon";
import { NETWORKS, type SocialNetwork } from "@/lib/social";
import { cn } from "@/lib/cn";

const BRAND: Record<SocialNetwork, Brand> = { linkedin: "linkedin", x: "x", instagram: "instagram" };

/** Instagram's brand tile is a gradient, not a flat colour. */
const BG: Partial<Record<SocialNetwork, string>> = {
  instagram: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)",
};

/** Network logo on its brand-coloured tile. */
export function NetBadge({ network, size = 24, className, dim }: { network: SocialNetwork; size?: number; className?: string; dim?: boolean }) {
  const n = NETWORKS[network];
  return (
    <span
      aria-hidden
      title={n.name}
      className={cn("inline-flex flex-none items-center justify-center rounded-md text-white", dim && "opacity-35", className)}
      style={{ background: BG[network] ?? n.color, width: size, height: size }}
    >
      <BrandIcon brand={BRAND[network]} size={Math.round(size * 0.58)} />
    </span>
  );
}
