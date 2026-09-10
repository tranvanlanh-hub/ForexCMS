"use client";
import { useFormStatus } from "react-dom";
export function SaveContentButton({ editing }: {
    editing: boolean;
}) {
    const { pending } = useFormStatus();
    return <button type="submit" className="button button-dark save-content" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Create article"}<span aria-hidden="true">{pending ? "…" : "↑"}</span></button>;
}
