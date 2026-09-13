"use client";

import { useActionState } from "react";
import { type LoginActionState, verifyTwoFactorAction } from "@/app/admin/login/actions";

export function VerifyForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<LoginActionState, FormData>(
    verifyTwoFactorAction,
    {},
  );
  return (
    <form action={action} className="admin-login-form">
      <input name="returnTo" type="hidden" value={returnTo} />
      {state.error ? <p className="admin-login-error" role="alert">{state.error}</p> : null}
      <label htmlFor="code">Authenticator or recovery code</label>
      <input
        autoComplete="one-time-code"
        autoFocus
        id="code"
        inputMode="text"
        maxLength={14}
        name="code"
        placeholder="000000"
        required
      />
      <button disabled={pending} type="submit">{pending ? "Verifying…" : "Open workspace"}</button>
    </form>
  );
}
