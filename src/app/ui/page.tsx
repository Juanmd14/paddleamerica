import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Podium } from "@/components/podium";
import { Net, type NetSize, netSizes } from "@/components/net";
import { NewsCard } from "@/components/news-card";
import { RankingTable } from "@/components/ranking-table";
import { PageHeader } from "@/components/page-header";
import { RankingList } from "@/components/ranking-list";
import { TournamentCard } from "@/components/tournament-card";
import { Avatar, avatarSizes } from "@/components/ui/avatar";
import { Badge, badgeTones } from "@/components/ui/badge";
import { Button, buttonSizes, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input, Label } from "@/components/ui/input";
import { demoNews, demoPlayers, demoTournaments } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Sistema de diseño",
  robots: { index: false },
};

const colorScales = {
  noche: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  oro: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
  pista: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
};

const vidrioColors = [
  "vidrio-noche",
  "vidrio-panel",
  "vidrio-linea",
  "vidrio-pelota",
  "vidrio-dato",
  "vidrio-texto",
  "vidrio-tenue",
  "vidrio-red-cinta",
  "vidrio-red-malla",
  "vidrio-red-fondo",
];

const netUsage: Record<NetSize, string> = {
  hero: "18px, con postes. Reservada para separadores fuertes.",
  seccion: "separador entre bloques del home y del perfil.",
  tabla: "la más finita. Hoy no se usa: la tabla del ranking va sin cortes.",
};

const semanticColors = [
  "background",
  "foreground",
  "foreground-soft",
  "surface",
  "muted",
  "muted-foreground",
  "border",
  "border-strong",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "ring",
  "success",
  "success-soft",
  "warning",
  "warning-soft",
  "danger",
  "danger-soft",
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="border-b border-border pb-3 font-display text-3xl font-bold uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div>
      <div
        className="h-14 rounded-lg border border-black/5"
        style={{ background: `var(--color-${color})` }}
      />
      <p className="mt-1 font-mono text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function DesignSystemPage() {
  // Página interna: solo existe en desarrollo (en producción responde 404).
  await connection();
  if (process.env.NODE_ENV === "production") notFound();

  const upcoming = demoTournaments.find((t) => t.status !== "finalizado");
  const finished = demoTournaments.find((t) => t.champions);
  const topPlayers = demoPlayers.filter((p) => p.gender === "masculino");

  return (
    <>
      <PageHeader
        eyebrow="Interno"
        title="Sistema de diseño"
        description="Tokens y componentes del sitio. Los tokens están en src/app/globals.css y los componentes base en src/components/ui. Esta página no existe en producción."
      />

      <Container className="space-y-16 py-12 sm:py-16">
        <Section title="Nocturno de vidrio">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Dirección 1b del concepto de Padel Pocho. La cancha es la grilla, no
            la decoración: sus cuatro zonas reales son las cuatro posiciones del
            podio y la jerarquía es la distancia a la red. La foto se usa
            entera: recortarla le come el fondo y la cancha se ve cortada.
          </p>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
            {vidrioColors.map((color) => (
              <Swatch key={color} color={color} label={color} />
            ))}
          </div>

          <Podium
            players={topPlayers.slice(0, 3)}
            title="8va caballeros"
            eyebrow="Actualizado al 10 de septiembre"
            className="border border-border"
          />

          <div>
            <h3 className="mb-3 text-sm font-semibold">Tabla del ranking</h3>
            <RankingTable players={topPlayers} startAt={4} />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">
              La red · tres tamaños, un solo uso cada uno
            </h3>
            <div className="space-y-6 bg-vidrio-noche p-6">
              {netSizes.map((size) => (
                <div key={size}>
                  <Net size={size} postes={size === "hero"} />
                  <p className="mt-2 font-mono text-xs text-vidrio-tenue">
                    {size} — {netUsage[size]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Colores de marca">
          {Object.entries(colorScales).map(([scale, steps]) => (
            <div key={scale}>
              <h3 className="mb-3 text-sm font-semibold capitalize">{scale}</h3>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-11">
                {steps.map((step) => (
                  <Swatch
                    key={step}
                    color={`${scale}-${step}`}
                    label={String(step)}
                  />
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Colores semánticos">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {semanticColors.map((name) => (
              <Swatch key={name} color={name} label={name} />
            ))}
          </div>
        </Section>

        <Section title="Tipografía">
          <Card className="space-y-5 p-6 sm:p-8">
            <p className="font-display text-7xl leading-none font-bold uppercase">
              Display
            </p>
            <p className="font-display text-4xl font-bold uppercase">
              Barlow Condensed — títulos
            </p>
            <p className="text-2xl font-bold tracking-tight">
              Geist — títulos de noticias
            </p>
            <p className="max-w-2xl text-lg leading-8 text-foreground-soft">
              Geist — cuerpo de texto. Martín Gómez y Nicolás Ibarra fueron los
              campeones del Invierno Pádel Tour.
            </p>
            <p className="text-sm text-muted-foreground">
              Geist — textos secundarios
            </p>
          </Card>
        </Section>

        <Section title="Botones">
          <div className="space-y-4">
            {buttonSizes.map((size) => (
              <div key={size} className="flex flex-wrap items-center gap-3">
                {buttonVariants
                  .filter((variant) => variant !== "inverse")
                  .map((variant) => (
                    <Button key={variant} variant={variant} size={size}>
                      {variant} {size}
                    </Button>
                  ))}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3 rounded-card bg-noche-950 p-6">
              <Button>primary</Button>
              <Button variant="inverse">inverse</Button>
            </div>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            {badgeTones
              .filter((tone) => tone !== "inverse")
              .map((tone) => (
                <Badge key={tone} tone={tone}>
                  {tone}
                </Badge>
              ))}
          </div>
          <div className="flex flex-wrap gap-2 rounded-card bg-noche-950 p-6">
            <Badge tone="primary">primary</Badge>
            <Badge tone="inverse">inverse</Badge>
          </div>
        </Section>

        <Section title="Formularios">
          <Card className="max-w-md space-y-4 p-6">
            <div>
              <Label htmlFor="ui-name">Nombre</Label>
              <Input id="ui-name" placeholder="Camila Rodríguez" />
            </div>
            <div>
              <Label htmlFor="ui-email">Email</Label>
              <Input
                id="ui-email"
                type="email"
                placeholder="nombre@correo.com"
              />
            </div>
            <Button className="w-full">Enviar</Button>
          </Card>
        </Section>

        <Section title="Avatares">
          <div className="flex flex-wrap items-end gap-4">
            {avatarSizes.map((size) => (
              <Avatar key={size} name="Camila Rodríguez" size={size} />
            ))}
          </div>
        </Section>

        <Section title="Tarjetas">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming && <TournamentCard tournament={upcoming} />}
            {finished && <TournamentCard tournament={finished} />}
            <NewsCard article={demoNews[0]} />
          </div>
          <Card className="overflow-hidden">
            <RankingList players={topPlayers.slice(0, 3)} />
          </Card>
        </Section>
      </Container>
    </>
  );
}
