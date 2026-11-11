"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useState } from "react";
import { ActionButton, useFeedback } from "@/components/action-button";
import { signIn, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  const fb = useFeedback();
  const [shown, setShown] = useState(state);
  if (state !== shown) {
    setShown(state);
    if (state.error) fb.fail();
  }
  return (
    <form action={action} className="hairline flex w-full max-w-[440px] flex-col gap-6 rounded-[28px] border bg-card p-[clamp(24px,4vw,40px)]">
      <div className="flex flex-col gap-2">
        <span className="label text-accent-ink">Connexion</span>
        <h2 className="heading text-[32px]">Accéder au studio</h2>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold">
          Mot de passe
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      {state.error && (
        <p role="alert" className="m-0 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <ActionButton type="submit" className="btn btn-primary disabled:opacity-60" pending={pending} pendingLabel="Connexion…" failed={fb.failed}>
        Se connecter
        <ArrowRight size={16} aria-hidden />
      </ActionButton>
    </form>
  );
}
