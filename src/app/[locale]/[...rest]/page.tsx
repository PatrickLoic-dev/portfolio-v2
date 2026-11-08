import { notFound } from "next/navigation";

/** Catch unknown paths so they render the localized not-found page. */
export default function CatchAll() {
  notFound();
}
