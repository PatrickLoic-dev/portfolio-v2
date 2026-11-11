"use client";

import { Eye, EyeOff, PenLine, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { useRef, useState, useTransition } from "react";
import { EASE } from "@/components/motion/ease";
import { SortableItem } from "@/components/studio/sortable";
import { Switch } from "@/components/studio/switch";
import { useToast } from "@/components/studio/toast";
import { TranslateButton } from "@/components/studio/translate-button";
import { cn } from "@/lib/cn";
import { deleteTestimonial, reorderKindWords, saveTestimonial, type TestimonialInput } from "../../site-actions";

type Row = TestimonialInput & { id: string };

const BADGES: [TestimonialInput["tone"], string, string][] = [
  ["blob-b", "Sauge", "bg-blob-b"],
  ["blob-a", "Pêche", "bg-blob-a"],
  ["blob-c", "Sable", "bg-blob-c"],
  ["secondary", "Feuille", "bg-secondary"],
  ["muted", "Lin", "bg-muted"],
];
const badgeClass = (tone: string) => BADGES.find((b) => b[0] === tone)?.[2] ?? "bg-blob-b";

const blank: TestimonialInput = {
  id: null,
  name: "",
  initials: "",
  tone: "blob-b",
  roleEn: "",
  roleFr: "",
  company: "",
  quoteEn: "",
  quoteFr: "",
  visible: true,
};

const auto = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join("");

const input = "field min-h-11 rounded-xl py-2 text-[15px]";
const area = "field min-h-[120px] resize-y rounded-xl py-2.5 text-[15px] leading-relaxed";

function Form({ value, onCancel, onSaved }: { value: TestimonialInput; onCancel: () => void; onSaved: (row: Row) => void }) {
  const toast = useToast();
  const [v, setV] = useState(value);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const upd = (patch: Partial<TestimonialInput>) => setV((x) => ({ ...x, ...patch }));
  const id = v.id ?? "new";

  const submit = () =>
    start(async () => {
      const next = { ...v, initials: v.initials || auto(v.name) };
      const res = await saveTestimonial(next);
      if (!res.ok) return setError(res.error);
      setError("");
      onSaved({ ...next, id: res.data!.id });
      toast(v.id ? "Témoignage mis à jour" : "Témoignage ajouté");
    });

  const text = (key: "name" | "company" | "roleFr" | "roleEn" | "quoteFr" | "quoteEn", label: string, ph = "", multiline = false) => (
    <div className="flex flex-[1_1_220px] flex-col gap-1.5">
      <label htmlFor={`t-${id}-${key}`} className="text-[13px] font-semibold">
        {label}
      </label>
      {multiline ? (
        <textarea id={`t-${id}-${key}`} className={area} placeholder={ph} value={v[key]} onChange={(e) => upd({ [key]: e.target.value })} />
      ) : (
        <input id={`t-${id}-${key}`} className={input} placeholder={ph} value={v[key]} onChange={(e) => upd({ [key]: e.target.value })} />
      )}
    </div>
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap gap-3">
        {text("name", "Nom", "Ex. : Ignace Cabrel Elouga")}
        <div className="flex w-[120px] flex-col gap-1.5">
          <label htmlFor={`t-${id}-initials`} className="text-[13px] font-semibold">
            Initiales
          </label>
          <input
            id={`t-${id}-initials`}
            className={input}
            maxLength={3}
            placeholder={auto(v.name) || "IE"}
            value={v.initials}
            onChange={(e) => upd({ initials: e.target.value.toUpperCase() })}
          />
        </div>
        {text("company", "Entreprise", "Ex. : Think Tech Solutions")}
      </div>
      <div className="flex flex-wrap gap-3">
        {text("roleFr", "Rôle (FR)", "Associé gérant")}
        {text("roleEn", "Rôle (EN)", "Managing Partner")}
      </div>
      <div className="flex flex-wrap gap-3">
        {text("quoteFr", "Citation (FR)", "", true)}
        {text("quoteEn", "Citation (EN)", "", true)}
      </div>
      <TranslateButton
        context="Un témoignage client affiché sur le portfolio d'un développeur front-end : le rôle de la personne et sa citation."
        fields={{ role: { fr: v.roleFr, en: v.roleEn }, quote: { fr: v.quoteFr, en: v.quoteEn } }}
        onTranslated={(to, out) => upd(to === "en" ? { roleEn: out.role ?? v.roleEn, quoteEn: out.quote ?? v.quoteEn } : { roleFr: out.role ?? v.roleFr, quoteFr: out.quote ?? v.quoteFr })}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <div role="radiogroup" aria-label="Couleur du badge" className="flex items-center gap-2">
            {BADGES.map(([tone, label, cls]) => (
              <button
                key={tone}
                type="button"
                role="radio"
                aria-checked={v.tone === tone}
                aria-label={label}
                title={label}
                onClick={() => upd({ tone })}
                className={cn("size-8 rounded-full border border-ink/14", cls)}
                style={{ boxShadow: v.tone === tone ? "0 0 0 3px var(--card), 0 0 0 5px var(--foreground)" : "none" }}
              />
            ))}
          </div>
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <Switch checked={v.visible} onChange={(visible) => upd({ visible })} label="Visible sur le site" />
            Visible sur le site
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" className="btn btn-ghost min-h-11 px-4 text-sm" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary min-h-11 px-5 text-sm" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="m-0 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

export function TestimonialsManager({ initial }: { initial: Row[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [, start] = useTransition();
  // Order as last dragged (read when the drag ends).
  const latest = useRef(rows);

  const commitOrder = () =>
    start(async () => {
      const res = await reorderKindWords(
        "testimonials",
        latest.current.map((r) => r.id),
      );
      toast(res.ok ? "Ordre enregistré" : res.error, { tone: res.ok ? "ok" : "error" });
    });

  const remove = (row: Row) => {
    if (!window.confirm(`Supprimer le témoignage de ${row.name} ? Cette action est définitive.`)) return;
    start(async () => {
      const res = await deleteTestimonial(row.id);
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== row.id));
        toast("Témoignage supprimé");
      } else toast(res.error, { tone: "error" });
    });
  };

  const toggle = (row: Row) =>
    start(async () => {
      const next = { ...row, visible: !row.visible };
      const res = await saveTestimonial(next);
      if (res.ok) setRows((r) => r.map((x) => (x.id === row.id ? next : x)));
      toast(res.ok ? (next.visible ? "Affiché sur le site" : "Masqué du site") : res.error, { tone: res.ok ? "ok" : "error" });
    });

  return (
    <section className="flex flex-col gap-4" aria-labelledby="testimonials-title">
      <div className="hairline flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <h2 id="testimonials-title" className="m-0 flex items-center gap-2.5 text-xl font-bold">
          <span className="size-2.5 rounded-[3px] bg-accent" />
          Témoignages <span className="font-mono text-sm font-normal text-muted-foreground">{rows.length}</span>
        </h2>
        <button type="button" className="btn btn-primary min-h-11 px-[18px] text-sm" onClick={() => setEditing("new")} disabled={editing === "new"}>
          <Plus size={16} aria-hidden />
          Nouveau témoignage
        </button>
      </div>

      <AnimatePresence initial={false}>
        {editing === "new" && (
          <motion.div
            key="new"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="hairline rounded-[20px] border bg-card p-6">
              <Form
                value={blank}
                onCancel={() => setEditing(null)}
                onSaved={(row) => {
                  setRows((r) => [...r, row]);
                  setEditing(null);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {rows.length === 0 && editing !== "new" && (
        <p className="m-0 rounded-[20px] border border-dashed border-ink/18 px-6 py-10 text-center text-muted-foreground">
          Aucun témoignage. La section est masquée sur le site.
        </p>
      )}

      <Reorder.Group axis="y" values={rows} onReorder={(next) => {
          latest.current = next;
          setRows(next);
        }} className="m-0 flex list-none flex-col gap-3 p-0">
        {rows.map((row) => (
          <SortableItem key={row.id} value={row} onDrop={commitOrder} className="hairline rounded-[20px] border bg-card p-4">
            {editing === row.id ? (
              <div className="py-2 pr-2">
                <Form
                  value={row}
                  onCancel={() => setEditing(null)}
                  onSaved={(saved) => {
                    setRows((r) => r.map((x) => (x.id === saved.id ? saved : x)));
                    setEditing(null);
                  }}
                />
              </div>
            ) : (
              <div className={cn("flex flex-wrap items-start gap-4", !row.visible && "opacity-55")}>
                <span className={cn("flex size-12 flex-none items-center justify-center rounded-full font-bold", badgeClass(row.tone))} aria-hidden>
                  {row.initials || auto(row.name)}
                </span>
                <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-1.5">
                  <span className="font-semibold">
                    {row.name}
                    {!row.visible && <span className="label ml-2 text-muted-foreground">Masqué</span>}
                  </span>
                  <span className="text-sm text-muted-foreground">{[row.roleFr || row.roleEn, row.company].filter(Boolean).join(" · ")}</span>
                  <p className="m-0 line-clamp-2 text-[15px] leading-relaxed">« {row.quoteFr || row.quoteEn} »</p>
                  <span className="label text-muted-foreground">{[row.quoteFr && "FR", row.quoteEn && "EN"].filter(Boolean).join(" · ")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="icon-btn size-10"
                    aria-label={row.visible ? `Masquer ${row.name}` : `Afficher ${row.name}`}
                    title={row.visible ? "Masquer du site" : "Afficher sur le site"}
                    onClick={() => toggle(row)}
                  >
                    {row.visible ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
                  </button>
                  <button type="button" className="icon-btn size-10" aria-label={`Modifier ${row.name}`} title="Modifier" onClick={() => setEditing(row.id)}>
                    <PenLine size={16} aria-hidden />
                  </button>
                  <button type="button" className="icon-btn size-10" aria-label={`Supprimer ${row.name}`} title="Supprimer" onClick={() => remove(row)}>
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </SortableItem>
        ))}
      </Reorder.Group>
    </section>
  );
}
