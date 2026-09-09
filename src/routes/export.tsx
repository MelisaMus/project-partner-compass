import { createFileRoute, redirect } from "@tanstack/react-router";

/** Alte Adresse: Der PDF-Export liegt jetzt unter „Berichte“. */
export const Route = createFileRoute("/export")({
  beforeLoad: () => {
    throw redirect({ to: "/berichte", replace: true });
  },
});
