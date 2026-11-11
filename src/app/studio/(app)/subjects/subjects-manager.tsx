"use client";

import { PenLine, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { EASE } from "@/components/motion/ease";
import { ActionButton, useFeedback } from "@/components/action-button";
import { useToast } from "@/components/studio/toast";
import { tones, type Tone } from "@/lib/tones";
import { cn } from "@/lib/cn";
import { createSubject, deleteSubject, updateSubject, type SubjectInput } from "../../actions";

type Subject = SubjectInput & { id: string; slug: string; count: number };

const PALETTE: [Tone, string][] = [
  ["leaf", "Feuille"],
  ["sage", "Sauge"],
  ["sand", "Sable"],
  ["peach", "Pêche"],
  ["muted", "Lin"],
  ["terracotta", "Terracotta"],
];

const blank: SubjectInput = { nameFr: "", nameEn: "", descriptionFr: "", descriptionEn: "", tone: "leaf" };

function Swatches({ value, onChange, label }: { value: Tone; onChange: (t: Tone) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex min-h-11 items-center gap-2">
      {PALETTE.map(([key, name]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={name}
          title={name}
          onClick={() => onChange(key)}
          className="size-8 rounded-full border border-ink/14"
          style={{ background: tones[key].bg, boxShadow: value === key ? "0 0 0 3px var(--card), 0 0 0 5px var(--foreground)" : "none" }}
        />
      ))}
    </div>
  );
}

function Fields({ value, onChange, idPrefix }: { value: SubjectInput; onChange: (v: SubjectInput) => void; idPrefix: string }) {
  const field = (key: keyof SubjectInput, label: string, placeholder: string) => (
    <div className="flex flex-[1_1_200px] flex-col gap-1.5">
      <label className="text-[13px] font-semibold" htmlFor={`${idPrefix}-${key}`}>
        {label}
      </label>
      <input
        id={`${idPrefix}-${key}`}
        className="field min-h-11 rounded-xl py-2 text-[15px]"
        placeholder={placeholder}
        value={value[key]}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
      />
    </div>
  );
  return (
    <>
      <div className="flex flex-wrap gap-3">
        {field("nameFr", "Nom (FR)", "Ex. : Mobile")}
        {field("nameEn", "Nom (EN)", "Ex. : Mobile")}
      </div>
      <div className="flex flex-wrap gap-3">
        {field("descriptionFr", "Description (FR)", "Affichée sur la page Blog")}
        {field("descriptionEn", "Description (EN)", "Shown on the Blog page")}
      </div>
    </>
  );
}

export function SubjectsManager({ subjects }: { subjects: Subject[] }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const addFb = useFeedback();
  const editFb = useFeedback();
  const [draft, setDraft] = useState<SubjectInput>(blank);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<SubjectInput>(blank);

  const add = (e: FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await createSubject(draft);
      if (!res.ok) {
        addFb.fail();
        return setError(res.error);
      }
      addFb.ok();
      toast(`Sujet « ${draft.nameFr.trim()} » ajouté`);
      setDraft(blank);
      setError("");
    });
  };

  const commit = (id: string) =>
    start(async () => {
      const res = await updateSubject(id, edit);
      if (!res.ok) {
        editFb.fail();
        return toast(res.error, { tone: "error" });
      }
      editFb.ok();
      toast(`Sujet « ${edit.nameFr.trim()} » enregistré`);
      // Let the check mark play before the row closes.
      await new Promise((r) => setTimeout(r, 750));
      setEditing(null);
    });

  const recolor = (s: Subject, tone: Tone) =>
    start(async () => {
      const res = await updateSubject(s.id, { ...s, tone });
      if (!res.ok) toast(res.error, { tone: "error" });
    });

  const remove = (s: Subject) =>
    start(async () => {
      const res = await deleteSubject(s.id);
      if (!res.ok) return toast(res.error, { tone: "error" });
      toast("Sujet supprimé");
    });

  return (
    <>
      <form onSubmit={add} className="hairline flex flex-col gap-4 rounded-[20px] border bg-card p-5">
        <h2 className="m-0 text-base font-bold">Nouveau sujet</h2>
        <Fields value={draft} onChange={(v) => { setDraft(v); setError(""); }} idPrefix="new" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">Couleur</span>
            <Swatches value={draft.tone} onChange={(tone) => setDraft({ ...draft, tone })} label="Couleur du nouveau sujet" />
          </div>
          <ActionButton
            type="submit"
            className="btn btn-primary min-h-11 text-sm"
            pending={pending && !addFb.done}
            pendingLabel="Ajout…"
            doneLabel="Sujet ajouté"
            done={addFb.done}
            failed={addFb.failed}
          >
            Ajouter le sujet
          </ActionButton>
        </div>
        {error && (
          <span role="alert" className="text-[13px] font-medium text-danger">
            {error}
          </span>
        )}
      </form>

      <div className={cn("hairline overflow-hidden rounded-[20px] border bg-card transition-opacity", pending && "opacity-70")}>
        <div className="label grid grid-cols-[56px_minmax(0,1fr)_100px] gap-4 bg-surface px-5 py-3.5 text-[11px] text-muted-foreground nav:grid-cols-[56px_minmax(0,1fr)_120px_200px]">
          <span>Couleur</span>
          <span>Sujet</span>
          <span>Notes</span>
          <span className="hidden text-right nav:block">Actions</span>
        </div>
        <AnimatePresence initial={false}>
          {subjects.map((s) => {
            const locked = s.count > 0;
            const isEditing = editing === s.id;
            return (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="hairline border-t"
              >
                <div className="grid grid-cols-[56px_minmax(0,1fr)_100px] items-center gap-4 px-5 py-4 nav:grid-cols-[56px_minmax(0,1fr)_120px_200px]">
                  <span className="size-10 rounded-xl border border-ink/8" style={{ background: tones[s.tone as Tone]?.bg }} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="display text-[22px] tracking-[-0.03em]">{s.nameFr}</span>
                    <span className="truncate text-[13px] text-muted-foreground">
                      EN : {s.nameEn} · /blog?sujet={s.slug}
                    </span>
                  </div>
                  <Link
                    href={`/studio/notes?sujet=${s.id}`}
                    className="font-semibold underline decoration-accent underline-offset-[3px]"
                  >
                    {s.count} note{s.count > 1 ? "s" : ""}
                  </Link>
                  <div className="col-span-3 flex justify-end gap-1.5 nav:col-span-1">
                    <button
                      type="button"
                      className="icon-btn size-10"
                      aria-label={`Modifier ${s.nameFr}`}
                      title="Modifier"
                      onClick={() => {
                        setEditing(isEditing ? null : s.id);
                        setEdit({ nameFr: s.nameFr, nameEn: s.nameEn, descriptionFr: s.descriptionFr, descriptionEn: s.descriptionEn, tone: s.tone as Tone });
                      }}
                    >
                      <PenLine size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="icon-btn size-10"
                      aria-label={`Changer la couleur de ${s.nameFr}`}
                      title="Couleur suivante"
                      onClick={() => {
                        const i = PALETTE.findIndex(([k]) => k === s.tone);
                        recolor(s, PALETTE[(i + 1) % PALETTE.length][0]);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-btn size-10 hover:border-danger! hover:bg-danger! disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ink/18! disabled:hover:bg-transparent! disabled:hover:text-foreground"
                      aria-label={`Supprimer ${s.nameFr}`}
                      title={locked ? "Impossible : ce sujet contient des notes" : "Supprimer"}
                      disabled={locked}
                      onClick={() => remove(s)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {isEditing && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      onSubmit={(e) => {
                        e.preventDefault();
                        commit(s.id);
                      }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-3 bg-surface/60 px-5 pb-5 pt-2">
                        <Fields value={edit} onChange={setEdit} idPrefix={`edit-${s.id}`} />
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <Swatches value={edit.tone} onChange={(tone) => setEdit({ ...edit, tone })} label={`Couleur de ${s.nameFr}`} />
                          <div className="flex gap-2">
                            <button type="button" className="btn btn-ghost min-h-10 text-sm" onClick={() => setEditing(null)}>
                              Annuler
                            </button>
                            <ActionButton type="submit" className="btn btn-primary min-h-10 text-sm" pending={pending} done={editFb.done} failed={editFb.failed}>
                              Enregistrer
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
