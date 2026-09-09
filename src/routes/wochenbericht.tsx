import { createFileRoute, redirect } from "@tanstack/react-router";

/** Alte Adresse: Wochenbericht und PDF-Export liegen jetzt gemeinsam unter „Berichte“. */
export const Route = createFileRoute("/wochenbericht")({
  beforeLoad: () => {
    throw redirect({ to: "/berichte", replace: true });
  },
});
