import type { Metadata } from "next";
import { createPlayer } from "@/app/admin/jugadores/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PlayerForm } from "@/components/admin/player-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nuevo jugador" };

export default async function NewPlayerPage() {
  await requireAdmin("/admin/jugadores/nuevo");

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Nuevo jugador"
        description="Para cargar muchos jugadores o puntos de una vez, usá la carga desde Excel."
      />
      <PlayerForm action={createPlayer} submitLabel="Crear jugador" />
    </div>
  );
}
