import type { Metadata } from "next";
import { createClubTournament } from "@/app/mi-club/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { TournamentForm } from "@/components/admin/tournament-form";
import { requireClubOwner } from "@/lib/auth";
import { getMyClubs } from "@/lib/data";

export const metadata: Metadata = { title: "Nuevo torneo" };

export default async function NewClubTournamentPage() {
  const user = await requireClubOwner("/mi-club/torneos/nuevo");
  const clubs = await getMyClubs();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Nuevo torneo"
        description="Completá los pasos. La vista previa te muestra cómo va a quedar en el sitio antes de crearlo."
      />
      <TournamentForm
        action={createClubTournament}
        clubs={clubs}
        clubOwnerId={user.id}
        submitLabel="Crear torneo"
      />
    </div>
  );
}
