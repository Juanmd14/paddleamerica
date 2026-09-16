# PaddleAmerica · Pádel regional

Sitio del circuito de pádel de América, Rivadavia y la zona: torneos con inscripción online, ranking de jugadores y noticias.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, RLS) · lucide-react · ESLint · Prettier

## Arrancar

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

**No hace falta Supabase para empezar:** sin credenciales, el sitio usa los datos de ejemplo de `src/lib/demo-data.ts` (jugadores, torneos y noticias inventados). Las cuentas, las inscripciones y "Mi cuenta" necesitan Supabase.

## Marca y diseño

- **Nombre y contacto:** PaddleAmerica. Nombre, región y datos de contacto (WhatsApp, Instagram, email: solo se muestran los que completes) en `src/lib/site.ts`.
- **Colores:** `noche` (azul noche), `oro` (dorado) y `pista` (azul cancha), más tokens semánticos (`primary`, `surface`, `muted`, `accent`…). Todo en `src/app/globals.css`.
- **Tipografía:** Barlow Condensed para títulos (`font-display`) y Geist para texto.
- **Componentes base:** `src/components/ui/` (Button, Badge, Card, Input, Textarea, Alert, Avatar, Skeleton, Container).
- **Íconos e imágenes para compartir:** `src/app/icon.svg`, `apple-icon.tsx` y los `opengraph-image.tsx` (generales y por torneo, jugador y noticia) con `src/lib/og.tsx`.
- **Vista del sistema de diseño:** [http://localhost:3000/ui](http://localhost:3000/ui) (solo en desarrollo; en producción da 404).

## Páginas

| Ruta                    | Qué muestra                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `/`                     | Próximo torneo, números del circuito, torneos, noticias, top 5 |
| `/torneos`              | Flyers de los próximos torneos y resultados                    |
| `/torneos/[slug]`       | Detalle, cómo llegar, compartir e inscripción                  |
| `/jugadores`            | Top 4 sobre la cancha y tabla (`?rama=` y `?categoria=`)       |
| `/jugadores/[slug]`     | Perfil y estadísticas del jugador                              |
| `/noticias`             | Listado de noticias                                            |
| `/noticias/[slug]`      | Nota completa y más noticias                                   |
| `/login`                | Ingresar / crear cuenta (`?modo=registro`)                     |
| `/login/recuperar`      | Pedir link para una contraseña nueva                           |
| `/mi-cuenta`            | Mis inscripciones y mis datos (privada)                        |
| `/mi-cuenta/contrasena` | Cambiar contraseña (privada)                                   |
| `/ui`                   | Sistema de diseño (solo desarrollo)                            |

## Conectar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Copiá `.env.example` a `.env.local` y completá la URL y la _publishable key_ (**Project Settings → API Keys**).
3. En **Authentication → URL Configuration** poné `http://localhost:3000` como _Site URL_ y agregá `http://localhost:3000/**` en _Redirect URLs_ (en producción, lo mismo con tu dominio). Los links de confirmación y de recuperar contraseña vuelven a `/auth/confirm`.
4. Creá las tablas y cargá los datos de ejemplo:

```bash
npx supabase login --token sbp_...        # token de supabase.com/dashboard/account/tokens
npx supabase link --project-ref TU-REF -p "CONTRASEÑA_DE_LA_BASE"
npx supabase db push --include-seed
npm run db:types
```

El token puede ser de acceso limitado al proyecto. Necesita: _Project Settings_, _Connection Pooling_, _API Keys_, _API Key Secrets_, _Auth Config_ y _Data API Config_ en lectura, y _Database_ y _Migrations_ en lectura y escritura. `link` lee las claves del proyecto, así que sin _API Key Secrets_ falla.

O pegá en el **SQL Editor** del dashboard, en orden: `supabase/migrations/20260915000000_initial_schema.sql`, `supabase/migrations/20260916000000_tournament_registrations.sql` y `supabase/seed.sql`.

5. Reiniciá `npm run dev`.

## Emails (confirmación y recuperar contraseña)

El servicio de email que trae Supabase solo manda mails a los miembros de tu organización, y pocos por hora. Antes de publicar el sitio hay que configurar un SMTP propio:

1. En [Resend](https://resend.com) agregá tu dominio y cargá los registros DNS que te da en tu proveedor de DNS (Hostinger → DNS Zone). Resend usa el subdominio `send.`, así que no pisa el mail del dominio.
2. Creá una API key con permiso _Sending access_, limitada a ese dominio.
3. En Supabase → **Authentication → Emails → SMTP Settings**: host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña la API key; remitente `no-responder@tudominio` y nombre `PaddleAmerica`.
4. En **Authentication → Emails → Templates** pegá las plantillas en castellano:
   - _Confirm signup_ → asunto "Confirmá tu cuenta en PaddleAmerica", cuerpo `supabase/templates/confirmation.html`.
   - _Reset password_ → asunto "Elegí una contraseña nueva", cuerpo `supabase/templates/recovery.html`.

   Los links van a `/auth/confirm` con `token_hash`, así funcionan aunque el mail se abra en otro dispositivo. Requieren que la URL de redirección esté permitida (`https://tudominio/**` en _Redirect URLs_).

5. Encendé **Authentication → Sign In / Providers → Email → Confirm email**.
6. En producción: _Site URL_ con tu dominio y `NEXT_PUBLIC_SITE_URL` con la misma URL.

## Inscripciones

- Cualquier usuario con cuenta se anota con su pareja en los torneos con `status = inscripciones`. Queda **pendiente**.
- El organizador las ve en **Table Editor → tournament_registrations** y cambia `status` a `confirmada` o `cancelada`.
- El usuario ve el estado en **Mi cuenta** y puede darse de baja mientras las inscripciones sigan abiertas (la baja borra la fila, así puede volver a anotarse).
- Las reglas están en las políticas RLS de la migración: nadie ve inscripciones ajenas ni se anota en torneos cerrados.

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
├── app/                     # Páginas (App Router); los listados usan grupos (lista)/(ranking) para su loading.tsx
├── components/
│   ├── ui/                  # Componentes base del sistema de diseño
│   └── *.tsx                # Header, footer, tarjetas de torneo/noticia, ranking...
├── lib/
│   ├── auth.ts              # getCurrentUser(): usuario logueado (getClaims, memoizado)
│   ├── data.ts              # Lectura de datos (Supabase o datos de ejemplo)
│   ├── demo-data.ts         # Datos de ejemplo
│   ├── site.ts              # Nombre, descripción y navegación
│   ├── labels.ts            # Textos de estados, ramas, etc.
│   ├── format.ts            # Fechas y números (es-AR)
│   └── supabase/            # Clientes de Supabase (server, client, proxy)
└── types/                   # Tipos de la base de datos
supabase/
├── migrations/              # Esquema: profiles, players, tournaments, news, tournament_registrations
└── seed.sql                 # Datos de ejemplo
```

## Próximos pasos

- **Rendimiento:** las lecturas públicas usan el cliente con cookies, así que todas las páginas se generan en cada request. Conviene leerlas con un cliente sin cookies y cachearlas.
- Separar **Jugadores** (buscador) de **Ranking** (tabla + resultados).
- Panel de administración para cargar torneos, noticias y flyers (Supabase Storage) y confirmar inscripciones.
- Vincular la cuenta con el jugador del ranking e historial de torneos por jugador.
- Deploy en Vercel (completá `NEXT_PUBLIC_SITE_URL` con el dominio final).
