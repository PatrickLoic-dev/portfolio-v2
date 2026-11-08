"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { useToast } from "@/components/studio/toast";
import { addIdea, deleteIdea } from "../actions";

type Idea = { id: string; title: string };

/** "Idée rapide": jot a title now, write it later (pre-fills the new-note form). */
export function QuickIdea({ ideas }: { ideas: Idea[] }) {
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const [list, setList] = useOptimistic(ideas);
  const toast = useToast();

  const save = () => {
    const title = value.trim();
    if (!title) return;
    start(async () => {
      setList((l) => [{ id: `tmp-${Date.now()}`, title }, ...l]);
      const res = await addIdea(title);
      if (res.ok) setValue("");
      else toast(res.error, { tone: "error" });
    });
  };

  const remove = (id: string) =>
    start(async () => {
      setList((l) => l.filter((i) => i.id !== id));
      await deleteIdea(id);
    });

  return (
    <section className="hairline flex flex-col gap-3.5 rounded-[20px] border bg-card p-6">
      <h2 className="m-0 text-lg font-bold">Idée rapide</h2>
      <form
        className="flex flex-col gap-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="text-[13px] font-semibold" htmlFor="quick">
          Titre de la note
        </label>
        <input
          id="quick"
          className="field min-h-11 rounded-xl px-3.5 py-2.5 text-[15px]"
          placeholder="Ex. : Mes 5 règles pour les formulaires"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {list.length === 0 && <span className="text-[13px] text-muted-foreground">Notez une idée maintenant, rédigez-la plus tard.</span>}
        <button type="submit" className="btn btn-ghost min-h-11 text-sm" disabled={pending || !value.trim()}>
          Garder l&apos;idée
        </button>
      </form>
      {list.map((i) => (
        <div key={i.id} className="hairline flex items-center justify-between gap-2.5 border-t pt-2.5">
          <span className="min-w-0 flex-1 text-sm font-medium">{i.title}</span>
          <Link href={`/studio/notes/new?idee=${i.id}`} className="btn btn-primary min-h-9 px-3.5 text-sm">
            Rédiger
          </Link>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Supprimer l'idée « ${i.title} »`}
            onClick={() => remove(i.id)}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ))}
    </section>
  );
}
