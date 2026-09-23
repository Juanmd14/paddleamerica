import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { TournamentForm } from "@/components/admin/tournament-form";
import { createTournament } from "@/app/admin/torneos/actions";
import { requireAdmin } from "@/lib/auth";
import { getClubs } from "@/lib/data";

export const metadata: Metadata = { title: "Nuevo torneo" };

export default async function NewTournamentPage() {
  await requireAdmin("/admin/torneos/nuevo");
  const clubs = await getClubs();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Nuevo torneo"
        description="Completá los pasos. La vista previa te muestra cómo va a quedar en el sitio antes de crearlo."
      />
      <TournamentForm
        action={createTournament}
        clubs={clubs}
        submitLabel="Crear torneo"
      />
    </div>
  );
}
