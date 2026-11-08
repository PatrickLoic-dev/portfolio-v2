import type { NoteStatus } from "@/db/schema";

/** The Studio works in Douala time (UTC+1 all year, no daylight saving). */
export const STUDIO_TZ = "Africa/Douala";
const OFFSET = "+01:00";

export const statusMeta: Record<NoteStatus, { label: string; bg: string; dot: string }> = {
  published: { label: "Publiée", bg: "var(--blob-b)", dot: "var(--success)" },
  draft: { label: "Brouillon", bg: "var(--muted)", dot: "var(--muted-foreground)" },
  scheduled: { label: "Programmée", bg: "var(--blob-c)", dot: "var(--accent)" },
};

const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: STUDIO_TZ });
const dayShort = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: STUDIO_TZ });
const dayTime = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: STUDIO_TZ });

export const fmtDay = (d: Date | string) => day.format(new Date(d));
export const fmtDayShort = (d: Date | string) => dayShort.format(new Date(d));
export const fmtDayTime = (d: Date | string) => dayTime.format(new Date(d));

/** ISO → "2026-11-20T08:30" in Douala time, for <input type="datetime-local">. */
export function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const shifted = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

/** "2026-11-20T08:30" (Douala time) → ISO with offset. */
export function fromLocalInput(value: string) {
  return value ? new Date(`${value}:00${OFFSET}`).toISOString() : null;
}

/** "Publiée le 12 oct." / "Programmée pour le 20 nov. à 08:30" / "Modifiée le 5 nov." */
export function whenLabel(status: NoteStatus, publishedAt: Date | string | null, updatedAt: Date | string) {
  if (status === "published" && publishedAt) return `Publiée le ${fmtDayShort(publishedAt)}`;
  if (status === "scheduled" && publishedAt) return `Programmée pour le ${fmtDayTime(publishedAt)}`;
  return `Modifiée le ${fmtDayShort(updatedAt)}`;
}

export function StatusBadge({ status }: { status: NoteStatus }) {
  const m = statusMeta[status];
  return (
    <span className="inline-flex min-h-7 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-semibold" style={{ background: m.bg }}>
      {m.label}
    </span>
  );
}
