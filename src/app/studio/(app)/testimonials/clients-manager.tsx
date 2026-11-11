"use client";

import { Eye, EyeOff, ImagePlus, PenLine, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion, Reorder } from "motion/react";
import { useRef, useState, useTransition } from "react";
import { EASE } from "@/components/motion/ease";
import { SortableItem } from "@/components/studio/sortable";
import { Switch } from "@/components/studio/switch";
import { useToast } from "@/components/studio/toast";
import { cn } from "@/lib/cn";
import { uploadImage } from "../../actions";
import { deleteClient, reorderKindWords, saveClient, type ClientInput } from "../../site-actions";

type Row = ClientInput & { id: string };

const blank: ClientInput = { id: null, name: "", logoUrl: null, url: null, visible: true };
const input = "field min-h-11 rounded-xl py-2 text-[15px]";

function Logo({ row, className }: { row: Pick<ClientInput, "name" | "logoUrl">; className?: string }) {
  return (
    <span className={cn("flex h-14 w-32 flex-none items-center justify-center rounded-xl border border-ink/8 bg-background px-3", className)}>
      {row.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.logoUrl} alt="" className="max-h-9 max-w-full object-contain" />
      ) : (
        <span className="display truncate text-lg text-muted-foreground">{row.name || "Logo"}</span>
      )}
    </span>
  );
}

function Form({ value, onCancel, onSaved }: { value: ClientInput; onCancel: () => void; onSaved: (row: Row) => void }) {
  const toast = useToast();
  const [v, setV] = useState(value);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [uploading, startUpload] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const upd = (patch: Partial<ClientInput>) => setV((x) => ({ ...x, ...patch }));
  const id = v.id ?? "new";

  const upload = (f: File) =>
    startUpload(async () => {
      const form = new FormData();
      form.set("file", f);
      form.set("svg", "1");
      const res = await uploadImage(form);
      if (res.ok) upd({ logoUrl: res.data!.url });
      else toast(res.error, { tone: "error" });
    });

  const submit = () =>
    start(async () => {
      const url = v.url?.trim() ? (/^https?:\/\//.test(v.url.trim()) ? v.url.trim() : `https://${v.url.trim()}`) : null;
      const next = { ...v, url };
      const res = await saveClient(next);
      if (!res.ok) return setError(res.error);
      setError("");
      onSaved({ ...next, id: res.data!.id });
      toast(v.id ? "Entreprise mise à jour" : "Entreprise ajoutée");
    });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold">Logo</span>
          <div className="flex items-center gap-2">
            <Logo row={v} />
            <input
              ref={file}
              type="file"
              accept="image/svg+xml,image/png,image/webp,image/avif,image/jpeg"
              className="sr-only"
              aria-label="Choisir un logo"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            <button type="button" className="btn btn-ghost min-h-11 px-4 text-sm" onClick={() => file.current?.click()} disabled={uploading}>
              <ImagePlus size={16} aria-hidden />
              {uploading ? "Envoi…" : v.logoUrl ? "Remplacer" : "Ajouter"}
            </button>
            {v.logoUrl && (
              <button type="button" className="icon-btn size-10" aria-label="Retirer le logo" onClick={() => upd({ logoUrl: null })}>
                <Trash2 size={16} aria-hidden />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-1.5">
          <label htmlFor={`c-${id}-name`} className="text-[13px] font-semibold">
            Nom
          </label>
          <input id={`c-${id}-name`} className={input} placeholder="Ex. : Asante Artsy" value={v.name} onChange={(e) => upd({ name: e.target.value })} />
        </div>
        <div className="flex flex-[1_1_240px] flex-col gap-1.5">
          <label htmlFor={`c-${id}-url`} className="text-[13px] font-semibold">
            Site web <span className="font-normal text-muted-foreground">(facultatif)</span>
          </label>
          <input
            id={`c-${id}-url`}
            className={input}
            inputMode="url"
            placeholder="https://"
            value={v.url ?? ""}
            onChange={(e) => upd({ url: e.target.value || null })}
          />
        </div>
      </div>
      <p className="m-0 text-[13px] text-muted-foreground">SVG ou PNG transparent de préférence. Le logo s&apos;affiche en gris et reprend ses couleurs au survol.</p>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <Switch checked={v.visible} onChange={(visible) => upd({ visible })} label="Visible sur le site" />
          Visible sur le site
        </span>
        <div className="flex items-center gap-2.5">
          <button type="button" className="btn btn-ghost min-h-11 px-4 text-sm" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary min-h-11 px-5 text-sm" disabled={pending || uploading}>
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

export function ClientsManager({ initial }: { initial: Row[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [, start] = useTransition();
  // Order as last dragged (read when the drag ends).
  const latest = useRef(rows);

  const commitOrder = () =>
    start(async () => {
      const res = await reorderKindWords(
        "clients",
        latest.current.map((r) => r.id),
      );
      toast(res.ok ? "Ordre enregistré" : res.error, { tone: res.ok ? "ok" : "error" });
    });

  const remove = (row: Row) => {
    if (!window.confirm(`Retirer ${row.name} de la liste ? Cette action est définitive.`)) return;
    start(async () => {
      const res = await deleteClient(row.id);
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== row.id));
        toast("Entreprise retirée");
      } else toast(res.error, { tone: "error" });
    });
  };

  const toggle = (row: Row) =>
    start(async () => {
      const next = { ...row, visible: !row.visible };
      const res = await saveClient(next);
      if (res.ok) setRows((r) => r.map((x) => (x.id === row.id ? next : x)));
      toast(res.ok ? (next.visible ? "Affichée sur le site" : "Masquée du site") : res.error, { tone: res.ok ? "ok" : "error" });
    });

  return (
    <section className="flex flex-col gap-4" aria-labelledby="clients-title">
      <div className="hairline flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <h2 id="clients-title" className="m-0 flex items-center gap-2.5 text-xl font-bold">
          <span className="size-2.5 rounded-[3px] bg-success" />
          Ils me font confiance <span className="font-mono text-sm font-normal text-muted-foreground">{rows.length}</span>
        </h2>
        <button type="button" className="btn btn-primary min-h-11 px-[18px] text-sm" onClick={() => setEditing("new")} disabled={editing === "new"}>
          <Plus size={16} aria-hidden />
          Ajouter une entreprise
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
          Aucune entreprise pour l&apos;instant. La bande de logos n&apos;apparaît pas sur l&apos;accueil.
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
              <div className={cn("flex flex-wrap items-center gap-4", !row.visible && "opacity-55")}>
                <Logo row={row} />
                <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
                  <span className="font-semibold">
                    {row.name}
                    {!row.visible && <span className="label ml-2 text-muted-foreground">Masquée</span>}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{row.url ? row.url.replace(/^https?:\/\/(www\.)?/, "") : "Sans lien"}</span>
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
                  <button type="button" className="icon-btn size-10" aria-label={`Retirer ${row.name}`} title="Retirer" onClick={() => remove(row)}>
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
