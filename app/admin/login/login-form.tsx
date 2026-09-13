"use client";

import { useActionState } from "react";
import { beginLoginAction, type LoginActionState } from "@/app/admin/login/actions";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<LoginActionState, FormData>(
    beginLoginAction,
    {},
  );
  return (
    <form action={action} className="admin-login-form">
      <input name="returnTo" type="hidden" value={returnTo} />
      <label className="admin-login-honeypot" aria-hidden="true">
        Company<input autoComplete="off" name="company" tabIndex={-1} />
      </label>
      {state.error ? <p className="admin-login-error" role="alert">{state.error}</p> : null}
      <label htmlFor="username">Username</label>
      <input autoCapitalize="none" autoComplete="username" autoFocus id="username" maxLength={64} name="username" required />
      <label htmlFor="password">Password</label>
      <input autoComplete="current-password" id="password" maxLength={128} name="password" required type="password" />
      <button disabled={pending} type="submit">{pending ? "Checking…" : "Continue securely"}</button>
    </form>
  );
}
