"use client";

import { Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useFeatures } from "@/components/studio/features";
import { ActionButton, useFeedback } from "@/components/action-button";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";
import { deleteSubscriber, sendNoteToSubscribers } from "../../newsletter-actions";

type Sub = { id: string; email: string; locale: "en" | "fr"; status: "pending" | "active" | "unsubscribed"; createdAt: string };
type SendRow = { id: string; noteId: string | null; subject: string; recipients: number; sentAt: string };
type NoteRow = { id: string; title: string; publishedAt: string | null };

const STATUS = {
  active: { label: "Confirmé", dot: "bg-success" },
  pending: { label: "En attente", dot: "bg-blob-c" },
  unsubscribed: { label: "Désinscrit", dot: "bg-ink/25" },
} as const;

const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function NewsletterManager({
  counts,
  subscribers,
  sends,
  notes,
}: {
  counts: { active: number; pending: number; unsubscribed: number };
  subscribers: Sub[];
  sends: SendRow[];
  notes: NoteRow[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const { mail } = useFeatures();
  const sendFb = useFeedback();
  const [filter, setFilter] = useState<"all" | Sub["status"]>("all");
  const sentIds = useMemo(() => new Set(sends.map((s) => s.noteId)), [sends]);
  const firstUnsent = notes.find((n) => !sentIds.has(n.id));
  const [noteId, setNoteId] = useState(firstUnsent?.id ?? notes[0]?.id ?? "");
  const chosen = notes.find((n) => n.id === noteId);
  const shown = subscribers.filter((s) => filter === "all" || s.status === filter);

  const send = () => {
    if (!chosen) return;
    const again = sentIds.has(chosen.id) ? "\n\nAttention : cette note a déjà été envoyée." : "";
    if (!window.confirm(`Envoyer « ${chosen.title} » à ${counts.active} abonné${counts.active > 1 ? "s" : ""} ?${again}`)) return;
    start(async () => {
      const res = await sendNoteToSubscribers(chosen.id);
      if (!res.ok) {
        sendFb.fail();
        return toast(res.error, { tone: "error" });
      }
      sendFb.ok();
      toast(`Note envoyée à ${res.data!.recipients} abonné${res.data!.recipients > 1 ? "s" : ""}`);
      router.refresh();
    });
  };

  const remove = (s: Sub) => {
    if (!window.confirm(`Supprimer définitivement ${s.email} de la liste ?`)) return;
    start(async () => {
      const res = await deleteSubscriber(s.id);
      toast(res.ok ? "Adresse supprimée" : res.error, { tone: res.ok ? "ok" : "error" });
      router.refresh();
    });
  };

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        {(
          [
            ["Abonnés confirmés", counts.active, "bg-success", "Reçoivent les notes"],
            ["En attente", counts.pending, "bg-blob-c", "N'ont pas encore confirmé"],
            ["Désinscrits", counts.unsubscribed, "bg-ink/25", "Ne reçoivent plus rien"],
          ] as const
        ).map(([label, value, dot, note]) => (
          <div key={label} className="hairline flex flex-col gap-2.5 rounded-2xl border bg-card p-5">
            <span className="label text-muted-foreground">{label}</span>
            <span className="display text-[44px]">{value}</span>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <span className={cn("size-2 rounded-full", dot)} />
              {note}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section className="hairline flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[20px] border bg-card p-6" aria-labelledby="send-title">
          <h2 id="send-title" className="m-0 text-lg font-bold">
            Envoyer une note
          </h2>
          {notes.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">Publiez d&apos;abord une note sur le blog.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nl-note" className="text-[13px] font-semibold">
                  Note publiée
                </label>
                <select
                  id="nl-note"
                  className="field min-h-11 rounded-xl py-2 text-[15px]"
                  value={noteId}
                  onChange={(e) => setNoteId(e.target.value)}
                >
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                      {sentIds.has(n.id) ? " (déjà envoyée)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
                L&apos;email reprend le titre, le chapeau et la couverture, avec un bouton vers la note. Les abonnés anglophones reçoivent la version
                anglaise quand elle existe.
              </p>
              <ActionButton
                type="button"
                className="btn btn-primary min-h-11 self-start text-sm"
                onClick={send}
                disabled={!mail || !counts.active || !chosen}
                pending={pending}
                pendingLabel="Envoi…"
                doneLabel="Envoyée"
                done={sendFb.done}
                failed={sendFb.failed}
              >
                <Send size={16} aria-hidden />
                {!mail
                  ? "Envoi indisponible (domaine non vérifié)"
                  : counts.active
                    ? `Envoyer à ${counts.active} abonné${counts.active > 1 ? "s" : ""}`
                    : "Aucun abonné confirmé"}
              </ActionButton>
            </>
          )}

          <h3 className="m-0 mt-3 text-base font-bold">Envois précédents</h3>
          {sends.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">Aucun envoi pour l&apos;instant.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {sends.map((s) => (
                <li key={s.id} className="hairline flex items-center justify-between gap-3 border-t py-2.5 text-sm">
                  <span className="min-w-0 truncate font-medium">{s.subject}</span>
                  <span className="flex-none font-mono text-xs text-muted-foreground">
                    {day(s.sentAt)} · {s.recipients}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="hairline flex min-w-0 flex-[999_1_480px] flex-col overflow-hidden rounded-[20px] border bg-card"
          aria-labelledby="subs-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
            <h2 id="subs-title" className="m-0 text-lg font-bold">
              Abonnés
            </h2>
            <div role="tablist" aria-label="Filtrer" className="flex flex-wrap gap-1">
              {(["all", "active", "pending", "unsubscribed"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "min-h-10 rounded-full px-3.5 text-[13px] font-medium",
                    filter === f ? "bg-ink text-card" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {f === "all" ? "Tous" : STATUS[f].label}
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 && (
            <p className="hairline m-0 border-t px-6 py-10 text-center text-sm text-muted-foreground">Personne ici pour l&apos;instant.</p>
          )}
          <ul className="m-0 list-none p-0">
            {shown.map((s) => (
              <li key={s.id} className="hairline flex items-center gap-4 border-t px-6 py-3">
                <span className={cn("size-2 flex-none rounded-full", STATUS[s.status].dot)} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{s.email}</span>
                <span className="label hidden text-muted-foreground sm:inline">{s.locale}</span>
                <span className="hidden w-24 text-[13px] text-muted-foreground sm:inline">{STATUS[s.status].label}</span>
                <span className="hidden font-mono text-xs text-muted-foreground md:inline">{day(s.createdAt)}</span>
                <button
                  type="button"
                  className="icon-btn size-10"
                  aria-label={`Supprimer ${s.email}`}
                  title="Supprimer"
                  onClick={() => remove(s)}
                  disabled={pending}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
