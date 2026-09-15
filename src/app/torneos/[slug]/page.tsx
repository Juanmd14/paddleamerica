import {
  ArrowLeft,
  CalendarDays,
  type LucideIcon,
  MapPin,
  Medal,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getTournament } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import { genderLabel, tournamentStatus } from "@/lib/labels";
import { paragraphs } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/torneos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tournament = await getTournament(slug);
  return { title: tournament?.name ?? "Torneo no encontrado" };
}

export default async function TournamentPage({
  params,
}: PageProps<"/torneos/[slug]">) {
  const { slug } = await params;
  const tournament = await getTournament(slug);
  if (!tournament) notFound();

  const status = tournamentStatus(tournament.status);
  const dates = formatDateRange(tournament.starts_on, tournament.ends_on);

  const details: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: CalendarDays, label: "Fechas", value: dates },
    {
      icon: MapPin,
      label: "Sede",
      value: [tournament.venue, tournament.city].filter(Boolean).join(", "),
    },
    {
      icon: Users,
      label: "Categoría",
      value: `${tournament.category} · ${genderLabel(tournament.gender)}`,
    },
  ];
  if (tournament.prize) {
    details.push({ icon: Medal, label: "Premios", value: tournament.prize });
  }
  if (tournament.champions) {
    details.push({
      icon: Trophy,
      label: "Campeones",
      value: tournament.champions,
    });
  }

  return (
    <>
      <section className="bg-noche-950 text-white">
        <Container className="py-12 sm:py-16">
          <Link
            href="/torneos"
            className="inline-flex items-center gap-2 text-sm font-medium text-noche-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Todos los torneos
          </Link>
          <div className="mt-8">
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-5xl leading-none font-bold uppercase sm:text-7xl">
            {tournament.name}
          </h1>
          <p className="mt-4 text-lg text-noche-300">
            {dates} · {tournament.city}
          </p>
        </Container>
      </section>

      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Cover
            src={tournament.cover_url}
            alt=""
            className="rounded-card"
            sizes="(min-width: 1024px) 768px, 100vw"
          />
          {tournament.description && (
            <div className="mt-8 space-y-5 text-lg leading-8 text-noche-700">
              {paragraphs(tournament.description).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>

        <aside>
          <Card className="p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-2xl font-bold uppercase">
              Información
            </h2>
            <dl className="mt-6 space-y-5">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            {tournament.status === "inscripciones" && (
              <ButtonLink
                href={`/login?next=/torneos/${tournament.slug}`}
                size="lg"
                className="mt-8 w-full"
              >
                Quiero inscribirme
              </ButtonLink>
            )}
          </Card>
        </aside>
      </Container>
    </>
  );
}
