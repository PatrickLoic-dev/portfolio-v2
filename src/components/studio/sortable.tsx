"use client";

import { GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { EASE } from "@/components/motion/ease";

/** A Reorder item that only drags from its grip, without selecting text on the way. */
export function SortableItem<T>({ value, className, onDrop, children }: { value: T; className?: string; onDrop: () => void; children: ReactNode }) {
  const controls = useDragControls();
  const startDrag = (e: PointerEvent) => {
    e.preventDefault();
    window.getSelection()?.removeAllRanges();
    document.documentElement.classList.add("select-none");
    const release = () => document.documentElement.classList.remove("select-none");
    window.addEventListener("pointerup", release, { once: true });
    window.addEventListener("pointercancel", release, { once: true });
    controls.start(e);
  };
  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      transition={{ duration: 0.3, ease: EASE }}
      whileDrag={{ scale: 1.01, boxShadow: "0 18px 40px -18px rgb(37 30 25 / 0.45)", zIndex: 10, position: "relative" }}
      className={className}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 inline-flex h-11 w-6 flex-none cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          title="Glisser pour réordonner"
          aria-hidden
          onPointerDown={startDrag}
        >
          <GripVertical size={16} />
        </span>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </Reorder.Item>
  );
}
