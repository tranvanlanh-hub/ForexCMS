"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ContentActionState } from "@/app/admin/content/actions";

export function ContentFormShell({
  action,
  children,
  error,
}: {
  action: (state: ContentActionState, formData: FormData) => Promise<ContentActionState>;
  children: ReactNode;
  error?: string;
}) {
  const [actionState, formAction] = useActionState(action, { error: error ?? "" });
  const formRef = useRef<HTMLFormElement>(null);
  const submittedValuesRef = useRef<FormData | null>(null);

  useEffect(() => {
    const form = formRef.current;
    const submitted = submittedValuesRef.current;
    if (!form || !submitted || !actionState.error) return;

    for (const control of Array.from(form.elements)) {
      if (control instanceof HTMLInputElement) {
        if (control.type === "file") continue;
        const values = submitted.getAll(control.name).map(String);
        if (control.type === "checkbox" || control.type === "radio") {
          control.checked = values.includes(control.value);
        } else if (control.name) {
          control.value = values[0] ?? "";
        }
      } else if (control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement) {
        const values = submitted.getAll(control.name).map(String);
        if (control instanceof HTMLSelectElement && control.multiple) {
          for (const option of Array.from(control.options)) option.selected = values.includes(option.value);
        } else if (control.name) {
          control.value = values[0] ?? "";
        }
      }
    }
  }, [actionState]);

  return (
    <form
      action={formAction}
      className="content-editor"
      onSubmitCapture={(event) => {
        submittedValuesRef.current = new FormData(event.currentTarget);
      }}
      ref={formRef}
    >
      {actionState.error ? (
        <div className="editor-alert error" role="alert">
          {actionState.error}
        </div>
      ) : null}
      {children}
    </form>
  );
}
