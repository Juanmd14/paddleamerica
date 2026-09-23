import type { Metadata } from "next";
import { createClub } from "@/app/admin/clubes/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ClubForm } from "@/components/admin/club-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nuevo club" };

export default async function NewClubPage() {
  await requireAdmin("/admin/clubes/nuevo");

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Nuevo club" />
      <ClubForm action={createClub} submitLabel="Guardar club" />
    </div>
  );
}
