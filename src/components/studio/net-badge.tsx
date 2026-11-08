import { NETWORKS, type SocialNetwork } from "@/lib/social";
import { cn } from "@/lib/cn";

/** Small coloured network mark ("in", "X", "IG"). */
export function NetBadge({ network, size = 24, className, dim }: { network: SocialNetwork; size?: number; className?: string; dim?: boolean }) {
  const n = NETWORKS[network];
  return (
    <span
      aria-hidden
      title={n.name}
      className={cn("inline-flex flex-none items-center justify-center rounded-md font-bold text-white", dim && "opacity-35", className)}
      style={{ background: n.color, width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {n.mark}
    </span>
  );
}
