import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { updateSiteSettings } from "@/app/admin/sitio/actions";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings, getStats } from "@/lib/data";
import { currentPeriod } from "@/lib/format";
import { STAT_KEYS, type StatKey, statLabel } from "@/lib/labels";

export const metadata: Metadata = { title: "Sitio" };

export default async function SiteSettingsPage() {
  await requireAdmin("/admin/sitio");
  const [settings, values] = await Promise.all([getSiteSettings(), getStats()]);
  const period = currentPeriod();

  const automatic = Object.fromEntries(
    STAT_KEYS.map((key) => [
      key,
      { label: statLabel(key, period), value: values[key] },
    ]),
  ) as Record<StatKey, { label: string; value: number }>;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Sitio"
        description="Lo que se ve arriba de todo en el inicio."
        actions={
          <ButtonLink href="/" size="sm" variant="ghost" target="_blank">
            <ExternalLink className="size-4" aria-hidden="true" />
            Ver el inicio
          </ButtonLink>
        }
      />
      <SiteSettingsForm
        action={updateSiteSettings}
        heroImageUrl={settings.heroImageUrl}
        stats={settings.stats}
        automatic={automatic}
      />
    </div>
  );
}
