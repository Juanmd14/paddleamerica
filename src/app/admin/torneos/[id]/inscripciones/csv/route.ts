import { getCurrentUser } from "@/lib/auth";
import { getTournamentById, getTournamentRegistrations } from "@/lib/data";
import { categoryName } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { registrationStatus } from "@/lib/labels";

function csvCell(value: string | null | undefined) {
  const text = value ?? "";
  return /[";\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Inscripciones del torneo en CSV (con BOM y ";" para que Excel en castellano lo abra bien). */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/admin/torneos/[id]/inscripciones/csv">,
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return new Response("No encontrado", { status: 404 });

  const { id } = await params;
  const tournament = await getTournamentById(Number(id));
  if (!tournament) return new Response("No encontrado", { status: 404 });

  const registrations = await getTournamentRegistrations(tournament.id);
  const category = (value: number | null | undefined) =>
    value ? categoryName(value) : "";
  const header = [
    "Estado",
    "Jugador",
    "Usuario",
    "Categoría",
    "Email",
    "Teléfono",
    "Pareja",
    "Usuario pareja",
    "Categoría pareja",
    "Email pareja",
    "Teléfono pareja",
    "Observaciones",
    "Fecha de inscripción",
  ];
  const rows = registrations.map((registration) => [
    registrationStatus(registration.status).label,
    registration.profile?.full_name,
    registration.profile?.username && `@${registration.profile.username}`,
    category(registration.profile?.category) || registration.category,
    registration.profile?.email,
    registration.contact_phone,
    registration.partnerProfile?.full_name || registration.partner_name,
    registration.partnerProfile?.username &&
      `@${registration.partnerProfile.username}`,
    category(registration.partnerProfile?.category),
    registration.partnerProfile?.email,
    registration.partnerProfile?.phone,
    registration.notes,
    formatDate(registration.created_at),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(";"))
    .join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscripciones-${tournament.slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
