# Punto de Oro · Pádel regional

Sitio del circuito de pádel de América y la zona: torneos, ranking de jugadores y noticias.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, RLS) · lucide-react · ESLint · Prettier

## Arrancar

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

**No hace falta Supabase para empezar:** sin credenciales, el sitio usa los datos de ejemplo de `src/lib/demo-data.ts` (jugadores, torneos y noticias inventados). Solo el login y "Mi cuenta" necesitan Supabase.

## Marca y diseño

- **Nombre:** Punto de Oro (el punto decisivo en el pádel). Se cambia en `src/lib/site.ts`.
- **Colores:** `noche` (azul noche), `oro` (dorado) y `pista` (azul cancha), más tokens semánticos (`primary`, `surface`, `muted`, `accent`…). Todo en `src/app/globals.css`.
- **Tipografía:** Barlow Condensed para títulos (`font-display`) y Geist para texto.
- **Componentes base:** `src/components/ui/` (Button, Badge, Card, Input, Avatar, Container).
- **Vista del sistema de diseño:** [http://localhost:3000/ui](http://localhost:3000/ui).

## Páginas

| Ruta                | Qué muestra                                     |
| ------------------- | ----------------------------------------------- |
| `/`                 | Próximo torneo, torneos, noticias y top ranking |
| `/torneos`          | Próximos y finalizados                          |
| `/torneos/[slug]`   | Detalle del torneo                              |
| `/jugadores`        | Ranking masculino / femenino (`?rama=`)         |
| `/jugadores/[slug]` | Perfil y estadísticas del jugador               |
| `/noticias`         | Listado de noticias                             |
| `/noticias/[slug]`  | Nota completa                                   |
| `/login`            | Ingreso y registro                              |
| `/mi-cuenta`        | Ruta privada del usuario                        |
| `/ui`               | Sistema de diseño (interno)                     |

## Conectar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Copiá `.env.example` a `.env.local` y completá la URL y la _publishable key_ (**Project Settings → API Keys**).
3. En **Authentication → URL Configuration** poné `http://localhost:3000` como _Site URL_ y agregá `http://localhost:3000/auth/confirm` en _Redirect URLs_.
4. Creá las tablas y cargá los datos de ejemplo:

```bash
npm run db:login
npm run db:link
npx supabase db push --include-seed
npm run db:types
```

O pegá `supabase/migrations/20260915000000_initial_schema.sql` y después `supabase/seed.sql` en el **SQL Editor** del dashboard.

5. Reiniciá `npm run dev`.

## Scripts

| Comando              | Qué hace                                               |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Servidor de desarrollo                                 |
| `npm run build`      | Build de producción                                    |
| `npm run lint`       | ESLint                                                 |
| `npm run typecheck`  | Chequeo de tipos                                       |
| `npm run format`     | Prettier (ordena las clases de Tailwind)               |
| `npm run db:new xxx` | Nueva migración en `supabase/migrations`               |
| `npm run db:push`    | Aplica las migraciones pendientes al proyecto linkeado |
| `npm run db:types`   | Regenera `src/types/database.types.ts`                 |

## Estructura

```
src/
├── proxy.ts                 # Refresca la sesión y protege /mi-cuenta
├── app/                     # Páginas (App Router)
├── components/
│   ├── ui/                  # Componentes base del sistema de diseño
│   └── *.tsx                # Header, footer, tarjetas de torneo/noticia, ranking...
├── lib/
│   ├── data.ts              # Lectura de datos (Supabase o datos de ejemplo)
│   ├── demo-data.ts         # Datos de ejemplo
│   ├── site.ts              # Nombre, descripción y navegación
│   ├── labels.ts            # Textos de estados, ramas, etc.
│   ├── format.ts            # Fechas y números (es-AR)
│   └── supabase/            # Clientes de Supabase (server, client, proxy)
└── types/                   # Tipos de la base de datos
supabase/
├── migrations/              # Esquema: profiles, players, tournaments, news
└── seed.sql                 # Datos de ejemplo
```

## Ideas para seguir

- Fotos de jugadores y portadas en Supabase Storage (ya está configurado `next/image`).
- Inscripción a torneos desde la cuenta.
- Cuadros y resultados partido a partido.
- Panel de administración para cargar torneos y noticias.
- Deploy en Vercel.
