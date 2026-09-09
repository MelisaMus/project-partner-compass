import { createFileRoute, redirect } from "@tanstack/react-router";

/** Alte Adresse: Der Frist-Alarm steht jetzt oben im Terminplaner. */
export const Route = createFileRoute("/fristen")({
  beforeLoad: () => {
    throw redirect({ to: "/termine", replace: true });
  },
});
