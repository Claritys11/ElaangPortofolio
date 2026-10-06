"use client";

import { startTransition, useActionState } from "react";
import type { ActionState } from "@/lib/admin/form";

/**
 * useActionState wired through onSubmit instead of <form action>: React 19 resets a form after a
 * form action resolves, which would wipe the writer's input whenever validation fails.
 */
export function useFormAction(action: (prev: ActionState, fd: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(action, { ok: true });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return [state, onSubmit, pending] as const;
}
