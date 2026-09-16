"use client";

import {
  Bell,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Newspaper,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import { type Inbox, loadInbox } from "@/app/mi-cuenta/inbox";
import { markNotificationsRead } from "@/app/mi-cuenta/actions";
import { InvitationResponse } from "@/components/invitation-response";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

/** Campana del header: abre una ventana con lo pendiente, los avisos y las noticias. */
export function NotificationsButton({ count }: { count: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [loading, startLoading] = useTransition();
  const [badge, setBadge] = useState(count);
  const [lastCount, setLastCount] = useState(count);
  // Si el servidor trae un número nuevo (otra página, otra acción), se actualiza.
  if (count !== lastCount) {
    setLastCount(count);
    setBadge(count);
  }

  function refresh() {
    startLoading(async () => {
      const next = await loadInbox();
      setInbox(next);
      setBadge(next?.invitations.length ?? 0);
      if (next?.notifications.some((notification) => notification.unread)) {
        await markNotificationsRead();
        // Actualiza el número de la campana y la lista de Mi cuenta.
        router.refresh();
      }
    });
  }

  function close() {
    setOpen(false);
  }

  const pendingCount =
    (inbox?.invitations.length ?? 0) +
    (inbox?.waiting.length ?? 0) +
    (inbox?.adminPending ? 1 : 0) +
    (inbox?.missingCategory ? 1 : 0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          refresh();
        }}
        aria-label={badge > 0 ? `Avisos: ${badge} sin ver` : "Avisos"}
        aria-haspopup="dialog"
        className="relative flex size-10 cursor-pointer items-center justify-center rounded-full text-noche-200 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Bell className="size-5" aria-hidden="true" />
        {badge > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4.5 font-bold text-primary-foreground tabular-nums">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={close}
        variant="sheet"
        title="Avisos"
        description={
          inbox
            ? pendingCount > 0
              ? `${pendingCount} ${pendingCount === 1 ? "cosa pendiente" : "cosas pendientes"}`
              : "No tenés nada pendiente"
            : "Cargando…"
        }
        footer={
          <Link
            href="/mi-cuenta"
            onClick={close}
            className="flex items-center justify-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover"
          >
            Ver todo en Mi cuenta
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        }
      >
        {!inbox ? (
          <div className="space-y-3 p-5 sm:p-6" aria-busy="true">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className={cn(loading && "opacity-70 transition-opacity")}>
            {pendingCount > 0 && (
              <InboxSection title="Pendiente">
                {inbox.invitations.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="space-y-3 bg-oro-50 px-5 py-4 sm:px-6"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={invitation.inviter}
                        src={invitation.inviterAvatar}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {invitation.inviter} te invitó a jugar
                        </p>
                        <Link
                          href={`/torneos/${invitation.slug}#inscripcion`}
                          onClick={close}
                          className="text-sm text-foreground-soft hover:text-accent"
                        >
                          {invitation.tournament} · {invitation.dates}
                        </Link>
                      </div>
                    </div>
                    <InvitationResponse
                      registrationId={invitation.id}
                      slug={invitation.slug}
                      onDone={refresh}
                      className="pl-12"
                    />
                  </li>
                ))}
                {inbox.adminPending > 0 && (
                  <InboxLink
                    href="/admin/torneos"
                    onClick={close}
                    icon={
                      <ClipboardCheck className="size-5" aria-hidden="true" />
                    }
                    title={`${inbox.adminPending} ${inbox.adminPending === 1 ? "inscripción" : "inscripciones"} para confirmar`}
                    text="Parejas que ya aceptaron y esperan tu confirmación."
                    highlight
                  />
                )}
                {inbox.waiting.map((item) => (
                  <InboxLink
                    key={item.id}
                    href={`/torneos/${item.slug}#inscripcion`}
                    onClick={close}
                    icon={<Clock className="size-5" aria-hidden="true" />}
                    title={item.tournament}
                    text={item.text}
                  />
                ))}
                {inbox.missingCategory && (
                  <InboxLink
                    href="/mi-cuenta#mis-datos"
                    onClick={close}
                    icon={<UserRound className="size-5" aria-hidden="true" />}
                    title="Todavía no tenés categoría"
                    text="La asigna el organizador. Hasta entonces no podés anotarte en torneos con categoría."
                  />
                )}
              </InboxSection>
            )}

            <InboxSection title="Últimos avisos">
              {inbox.notifications.length > 0 ? (
                inbox.notifications.map((notification) => {
                  const content = (
                    <>
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          notification.unread ? "bg-primary" : "bg-transparent",
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">
                          {notification.title}
                          {notification.unread && (
                            <span className="sr-only"> (nuevo)</span>
                          )}
                        </span>
                        {notification.body && (
                          <span className="mt-0.5 block text-sm text-foreground-soft">
                            {notification.body}
                          </span>
                        )}
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {notification.date}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={notification.id}>
                      {notification.href ? (
                        <Link
                          href={notification.href}
                          onClick={close}
                          className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-muted sm:px-6"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="flex gap-3 px-5 py-3.5 sm:px-6">
                          {content}
                        </div>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="px-5 py-4 text-sm text-muted-foreground sm:px-6">
                  Te avisamos acá cuando te inviten a jugar o confirmen tu
                  inscripción.
                </li>
              )}
            </InboxSection>

            {inbox.news.length > 0 && (
              <InboxSection title="Últimas noticias">
                {inbox.news.map((article) => (
                  <InboxLink
                    key={article.slug}
                    href={`/noticias/${article.slug}`}
                    onClick={close}
                    icon={<Newspaper className="size-5" aria-hidden="true" />}
                    title={article.title}
                    text={article.date}
                  />
                ))}
              </InboxSection>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

function InboxSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="bg-muted/60 px-5 py-2 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase sm:px-6">
        {title}
      </h3>
      <ul className="divide-y divide-border">{children}</ul>
    </section>
  );
}

function InboxLink({
  href,
  onClick,
  icon,
  title,
  text,
  highlight = false,
}: {
  href: string;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted sm:px-6",
          highlight && "bg-oro-50",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pista-50 text-accent">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{title}</span>
          <span className="block text-sm text-muted-foreground">{text}</span>
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
