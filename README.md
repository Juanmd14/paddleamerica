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
| `/admin`                | Panel de administración (solo admins, ver abajo)               |
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

O pegá en el **SQL Editor** del dashboard, en orden, todos los archivos de `supabase/migrations/` y después `supabase/seed.sql`.

5. Reiniciá `npm run dev`.

## Emails

Hay dos tipos de email y los dos necesitan **un dominio propio verificado en Resend**:

- **Los de Supabase Auth** (confirmar la cuenta, recuperar la contraseña): salen por el SMTP que configures en Supabase. El servicio que trae Supabase solo manda a los miembros de tu organización y pocos por hora.
- **Los avisos del sitio** (te invitaron a jugar, tu pareja aceptó o canceló, inscripción confirmada, categoría asignada, ahora sos admin): los manda la app con la API de Resend. Sin las variables, esos avisos quedan solo en la campanita.

**Checklist para cuando compres el dominio:**

1. En [Resend](https://resend.com) agregá el dominio y cargá los registros DNS que te da en tu proveedor (Hostinger → DNS Zone). Usa el subdominio `send.`, así que no pisa el mail del dominio. Esperá a que diga _Verified_.
2. Creá una API key con permiso _Sending access_, limitada a ese dominio.
3. En Vercel → Settings → Environment Variables (Production), y después **Redeploy**:
   - `RESEND_API_KEY` = la API key.
   - `EMAIL_FROM` = `PaddleAmerica <avisos@tudominio>`.
   - `SUPABASE_SECRET_KEY` = Supabase → Project Settings → API Keys → _Secret keys_. Solo servidor, **nunca** con `NEXT_PUBLIC_`: la usa `src/lib/supabase/admin.ts` para leer el email de la pareja cuando un jugador la invita.
   - `NEXT_PUBLIC_SITE_URL` = `https://tudominio` (tipo **Config**, no Secret).
4. Supabase → **Authentication → Emails → SMTP Settings**: host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña la API key, remitente `no-responder@tudominio`, nombre `PaddleAmerica`. En **Authentication → Rate Limits** subí los emails por hora.
5. **Authentication → Emails → Templates**:
   - _Confirm signup_ → asunto "Confirmá tu cuenta en PaddleAmerica", cuerpo `supabase/templates/confirmation.html`.
   - _Reset password_ → asunto "Elegí una contraseña nueva", cuerpo `supabase/templates/recovery.html`.

   Los links van a `/auth/confirm` con `token_hash`, así funcionan aunque el mail se abra en otro dispositivo. Si Supabase no acepta la URL de redirección, arman el link con la _Site URL_.

6. **Authentication → URL Configuration**: _Site URL_ `https://tudominio` (sin barra final) y en _Redirect URLs_ `https://tudominio/**`, `https://paddleamerica.vercel.app/**` y `http://localhost:3000/**`.
7. En Vercel → Domains, agregá el dominio.
8. Probá con dos cuentas de prueba: recuperar contraseña (tiene que llegar el mail y el link tiene que funcionar), invitar, aceptar y confirmar desde el panel.
9. Recién ahí encendé **Authentication → Sign In / Providers → Email → Confirm email** y probá crear una cuenta. Después borrá las cuentas de prueba desde el panel.

## Inscripciones

- Cada inscripción es de a dos. El jugador busca a su pareja por `@usuario` o por nombre y la invita. Si la pareja no tiene cuenta, puede mandarle por WhatsApp el link para registrarse.
- La pareja recibe un aviso y **acepta o rechaza**. Después de invitar, el botón _Avisale por WhatsApp_ le manda el link. Recién al aceptar ocupan lugar en el cupo.
- El sitio no deja anotarse a quien no cumple la **categoría** (rango o suma) o la **rama** del torneo: en uno masculino o femenino juegan los dos de esa rama; en uno mixto, uno de cada.
- El admin ve los perfiles de los dos y confirma o rechaza en **Panel → Para confirmar** o dentro de cada torneo. Les llega un aviso a los dos (y un email si están configurados).
- Cualquiera de los dos puede cancelar mientras las inscripciones sigan abiertas; al otro le llega un aviso.
- Todo pasa por funciones de la base (`register_pair`, `respond_invitation`, `cancel_registration`) que validan categoría, rama, cupo y repetidos. Nadie ve inscripciones ajenas y solo los admins cambian estados.

## Panel de administración

En `/admin`, solo para cuentas marcadas como admin:

- **Torneos:** crear, editar y borrar (con flyer). Un torneo con inscripciones no se puede borrar: pasalo a _Finalizado_. Desde cada torneo: inscripciones, confirmar o rechazar, WhatsApp con un toque y CSV para Excel.
  - **Ubicación:** dirección y link de Google Maps (en Maps: _Compartir → Copiar vínculo_). La página del torneo muestra el mapa y el botón _Cómo llegar_.
  - **Cupo:** en parejas. Cuentan las pendientes y las confirmadas; al llenarse, el sitio muestra _Cupo completo_ y la base no deja anotarse (trigger `check_tournament_capacity`). Rechazar una inscripción o subir el cupo libera lugares.
  - **Abren las inscripciones:** día y hora (argentina). Mientras el torneo está en _Próximamente_, la tarjeta muestra “Abre el 14/9 a las 12:00” y a esa hora las inscripciones se abren solas: una tarea de Supabase (`pg_cron`, job `abrir-inscripciones`) revisa cada minuto y pasa el torneo a _Inscripciones abiertas_.
- **Noticias:** borrador, publicada o programada (fecha futura), con portada.
- **Jugadores:** alta, edición y foto. Si alguien deja de jugar, tildá _Ya no compite_: sale del ranking y del inicio pero conserva puntos e historial (se puede reactivar).
- **Usuarios:** la categoría de cada cuenta (1ra a 8va). La asigna solo el admin, no el jugador, y define en qué torneos se puede anotar. Al asignarla, al jugador le llega un aviso. Desde ahí también se borra una cuenta que ya no se usa (se borran sus inscripciones y avisos; no se puede si es admin o tiene inscripciones en torneos sin terminar). En la ficha de cada cuenta se la **vincula con su jugador del ranking**: desde ahí su categoría y su rama salen del jugador (si las cambiás en el jugador, cambian en la cuenta), y el jugador ve su puesto en Mi cuenta.
- **Sitio:** foto de fondo del inicio y los 4 números de la franja (se calculan solos; elegís cuáles mostrar y podés corregir título o valor).
- **Carga de puntos:** subí un Excel (.xlsx) o CSV, elegí si _reemplaza_ el total o _suma_ los puntos de un torneo, revisá la vista previa y aplicá. La última carga se puede deshacer. La planilla modelo trae la columna **Código** (el slug del jugador) para que no haya errores al relacionar filas.

**Marcar a alguien como admin:** la persona se registra en el sitio y después un admin abre **Panel → Usuarios → su ficha → Hacer admin** (le llega un aviso). Desde el mismo botón se quita el admin. Nadie puede quitarse el admin a sí mismo y siempre queda al menos uno. Si no queda ningún admin con acceso, en el **SQL Editor** de Supabase (o con el CLI):

```bash
npx supabase db query --linked "update public.profiles set is_admin = true where email = 'su-email@ejemplo.com'"
```

Las imágenes se guardan en el bucket público `media` de Supabase Storage (solo los admins pueden subir).

**Emails de avisos:** ver la sección _Emails_. Sin configurar, los avisos quedan solo en la campanita de cada cuenta.

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
├── proxy.ts                 # Refresca la sesión y protege /mi-cuenta y /admin
├── app/                     # Páginas (App Router); los listados usan grupos (lista)/(ranking) para su loading.tsx
│   └── admin/               # Panel de administración (cada página y acción llama a requireAdmin)
├── components/
│   ├── ui/                  # Componentes base del sistema de diseño
│   ├── admin/               # Formularios, subida de imágenes y carga de puntos del panel
│   └── *.tsx                # Header, footer, tarjetas de torneo/noticia, ranking...
├── lib/
│   ├── auth.ts              # getCurrentUser() y requireAdmin()
│   ├── email.ts             # Envío de emails con Resend (opcional)
│   ├── points-import.ts     # Lectura de Excel/CSV y detección de columnas para la carga de puntos
│   ├── data.ts              # Lectura de datos (Supabase o datos de ejemplo)
│   ├── demo-data.ts         # Datos de ejemplo
│   ├── site.ts              # Nombre, descripción y navegación
│   ├── labels.ts            # Textos de estados, ramas, etc.
│   ├── format.ts            # Fechas y números (es-AR)
│   └── supabase/            # Clientes de Supabase (server, client, proxy)
└── types/                   # Tipos de la base de datos
supabase/
├── migrations/              # Esquema, RLS, rol admin, avisos, Storage y carga de puntos
├── templates/               # Plantillas de email de Supabase Auth en castellano
└── seed.sql                 # Datos de ejemplo
```

## Próximos pasos

- **Rendimiento:** las lecturas públicas usan el cliente con cookies, así que todas las páginas se generan en cada request. Conviene leerlas con un cliente sin cookies y cachearlas.
- Separar **Jugadores** (buscador) de **Ranking** (tabla + resultados).
- Historial de torneos por jugador.
- Deploy en Vercel (completá `NEXT_PUBLIC_SITE_URL` con el dominio final).
