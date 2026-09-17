"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  countAccountsWithoutCategory,
  getAllTournaments,
  getMyNotifications,
  getMyProfile,
  getMyRegistrations,
  getNews,
} from "@/lib/data";
import { formatDate, formatDateRange } from "@/lib/format";

export type InboxInvitation = {
  id: number;
  slug: string;
  tournament: string;
  dates: string;
  inviter: string;
  inviterAvatar: string | null;
};

export type InboxWaiting = {
  id: number;
  slug: string;
  tournament: string;
  text: string;
};

export type Inbox = {
  invitations: InboxInvitation[];
  waiting: InboxWaiting[];
  missingCategory: boolean;
  /** Solo admins: inscripciones con la pareja aceptada que falta confirmar. */
  adminPending: number;
  /** Solo admins: cuentas que esperan categoría para poder anotarse. */
  adminWithoutCategory: number;
  notifications: {
    id: number;
    title: string;
    body: string | null;
    href: string | null;
    date: string;
    unread: boolean;
  }[];
  news: { slug: string; title: string; date: string }[];
};

/** Lo que muestra la ventana de avisos: pendientes, avisos y últimas noticias. */
export async function loadInbox(): Promise<Inbox | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const [
    registrations,
    profile,
    notifications,
    news,
    tournaments,
    adminWithoutCategory,
  ] = await Promise.all([
    getMyRegistrations(),
    getMyProfile(),
    getMyNotifications(8),
    getNews({ limit: 3 }),
    user.isAdmin ? getAllTournaments() : Promise.resolve([]),
    user.isAdmin ? countAccountsWithoutCategory() : Promise.resolve(0),
  ]);

  const open = registrations.filter(
    (registration) => registration.tournament.status === "inscripciones",
  );

  return {
    invitations: open
      .filter(
        (registration) =>
          registration.partner_id === user.id &&
          registration.status === "invitacion",
      )
      .map((registration) => ({
        id: registration.id,
        slug: registration.tournament.slug,
        tournament: registration.tournament.name,
        dates: formatDateRange(
          registration.tournament.starts_on,
          registration.tournament.ends_on,
        ),
        inviter: registration.player?.full_name || "Un jugador",
        inviterAvatar: registration.player?.avatar_url ?? null,
      })),
    waiting: open.flatMap((registration) => {
      const isOwner = registration.user_id === user.id;
      const partner =
        registration.partner?.full_name || registration.partner_name;
      const text =
        registration.status === "invitacion" && isOwner
          ? `Esperando que ${partner} acepte la invitación.`
          : registration.status === "pendiente"
            ? "Esperando que el organizador confirme el lugar."
            : null;
      return text
        ? [
            {
              id: registration.id,
              slug: registration.tournament.slug,
              tournament: registration.tournament.name,
              text,
            },
          ]
        : [];
    }),
    missingCategory: !profile?.category,
    adminWithoutCategory,
    adminPending: tournaments.reduce(
      (total, tournament) => total + tournament.pending,
      0,
    ),
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      href: notification.href,
      date: formatDate(notification.created_at),
      unread: !notification.read_at,
    })),
    news: news.map((article) => ({
      slug: article.slug,
      title: article.title,
      date: formatDate(article.published_at),
    })),
  };
}
