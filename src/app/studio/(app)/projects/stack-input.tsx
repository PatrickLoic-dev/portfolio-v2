"use client";

import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { canonicalTag, sameTag, TECH_LABELS, TechGlyph, techOf } from "@/components/tech";
import { cn } from "@/lib/cn";

const MAX_TAGS = 12;
const MAX_SHOWN = 8;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Best matches first: name starts with the query, then a word does, then it appears anywhere. */
function rank(options: string[], query: string): string[] {
  const q = norm(query);
  if (!q) return options;
  const score = (o: string) => {
    if (norm(o).startsWith(q)) return 0;
    if (o.toLowerCase().split(/[\s./-]+/).some((w) => norm(w).startsWith(q))) return 1;
    if (norm(o).includes(q)) return 2;
    return -1;
  };
  return options
    .map((o, i) => ({ o, i, s: score(o) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.o);
}

/**
 * Stack field: chips for the chosen technologies and an input that suggests
 * known technologies and tags already used on other projects.
 * Enter / Tab / comma adds, arrows move, Escape closes, Backspace on an empty
 * field removes the last chip.
 */
export function StackInput({ value, onChange, used }: { value: string[]; onChange: (tags: string[]) => void; used: string[] }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const full = value.length >= MAX_TAGS;

  // Tags already used on projects come first (most used first), then every known technology.
  const pool = useMemo(() => {
    const out: string[] = [];
    for (const t of [...used, ...TECH_LABELS]) if (!out.some((o) => sameTag(o, t))) out.push(canonicalTag(t));
    return out;
  }, [used]);

  const typed = query.trim();
  const matches = rank(
    pool.filter((o) => !value.some((v) => sameTag(v, o))),
    typed,
  ).slice(0, MAX_SHOWN);
  const exact = typed && [...matches, ...value].some((o) => sameTag(o, typed));
  // Last option: add exactly what was typed when it isn't a suggestion.
  const options = typed && !exact && !value.some((v) => sameTag(v, typed)) ? [...matches, `__new__${canonicalTag(typed)}`] : matches;
  const showList = open && !full && options.length > 0;
  const current = Math.min(active, options.length - 1);

  const add = (raw: string) => {
    const tag = canonicalTag(raw.replace(/^__new__/, ""));
    if (!tag || full || value.some((v) => sameTag(v, tag))) return;
    onChange([...value, tag]);
    setQuery("");
    setActive(0);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (options.length) setActive((i) => (Math.min(i, options.length - 1) + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (e.key === "Enter" || (e.key === "Tab" && showList && typed) || e.key === ",") {
      if (e.key === "Tab" && !typed) return;
      e.preventDefault();
      if (showList && options[current]) add(options[current]);
      else if (typed) add(typed);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !query && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const optionLabel = (o: string) => (o.startsWith("__new__") ? o.slice(7) : o);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-input`} className="text-[13px] font-semibold">
        Stack{" "}
        <span className="font-normal text-muted-foreground">
          ({value.length}/{MAX_TAGS})
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <AnimatePresence initial={false}>
          {value.map((tag) => (
            <motion.span
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-ink/14 bg-background pl-2.5 pr-1 font-mono text-xs"
            >
              {techOf(tag) && <TechGlyph name={tag} size={14} />}
              {tag}
              <button
                type="button"
                aria-label={`Retirer ${tag}`}
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-muted"
                onClick={() => onChange(value.filter((x) => x !== tag))}
              >
                <X size={12} aria-hidden />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <div className="relative">
          <input
            id={`${id}-input`}
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${id}-opt-${current}` : undefined}
            autoComplete="off"
            disabled={full}
            className="field min-h-9 w-[220px] rounded-full px-3 py-1.5 text-sm disabled:opacity-50"
            placeholder={full ? "Maximum atteint" : "+ Ajouter (ex. Next.js)"}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
          />
          {showList && (
            <ul
              id={`${id}-list`}
              role="listbox"
              aria-label="Suggestions"
              className="hairline absolute left-0 top-[calc(100%+6px)] z-30 m-0 max-h-[300px] w-[260px] list-none overflow-y-auto rounded-2xl border bg-card p-1.5 shadow-[0_18px_40px_-18px_rgb(37_30_25/0.45)]"
            >
              {options.map((o, i) => {
                const isNew = o.startsWith("__new__");
                const label = optionLabel(o);
                return (
                  <li
                    key={o}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={i === current}
                    // mousedown keeps focus in the input (blur would close the list first).
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(o);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm",
                      i === current ? "bg-surface" : "",
                      isNew && "text-accent-ink",
                    )}
                  >
                    <span className="inline-flex w-4 flex-none justify-center text-muted-foreground" aria-hidden>
                      {isNew ? <Plus size={14} /> : techOf(label) ? <TechGlyph name={label} size={15} /> : <span className="text-xs">#</span>}
                    </span>
                    {isNew ? (
                      <span>
                        Ajouter « <b>{label}</b> »
                      </span>
                    ) : (
                      label
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
