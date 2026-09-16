import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { TournamentForm } from "@/components/admin/tournament-form";
import { createTournament } from "@/app/admin/torneos/actions";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nuevo torneo" };

export default async function NewTournamentPage() {
  await requireAdmin("/admin/torneos/nuevo");

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Nuevo torneo"
        description="Completá los datos y subí el flyer. Podés dejarlo en “Próximamente” y abrir las inscripciones después."
      />
      <TournamentForm action={createTournament} submitLabel="Crear torneo" />
    </div>
  );
}
