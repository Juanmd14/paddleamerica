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
import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { type Inbox, loadInbox } from "@/app/mi-cuenta/inbox";
import { markNotificationsRead } from "@/app/mi-cuenta/actions";
import { InvitationResponse } from "@/components/invitation-response";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Campana del header: despliega un menú con lo pendiente, los avisos y las noticias. */
export function NotificationsButton({ count }: { count: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
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

  // Se cierra tocando afuera o con Escape (y el foco vuelve a la campana).
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus({ preventScroll: true });

    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pendingCount =
    (inbox?.invitations.length ?? 0) +
    (inbox?.waiting.length ?? 0) +
    (inbox?.adminPending ? 1 : 0) +
    (inbox?.missingCategory ? 1 : 0);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (open) {
            close();
            return;
          }
          setOpen(true);
          refresh();
        }}
        aria-label={badge > 0 ? `Avisos: ${badge} sin ver` : "Avisos"}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "relative flex size-10 cursor-pointer items-center justify-center rounded-full text-noche-200 transition-colors hover:bg-white/10 hover:text-white",
          open && "bg-white/10 text-white",
        )}
      >
        <Bell className="size-5" aria-hidden="true" />
        {badge > 0 && (
          <span className="absolute top-1 right-1 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-4.5 font-bold text-primary-foreground tabular-nums">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {/*
        Menú que baja desde la campana. En celulares ocupa el ancho de la
        pantalla (la campana no está pegada al borde) y deja libre la barra de abajo.
      */}
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Avisos"
          tabIndex={-1}
          className="fixed inset-x-3 top-[4.5rem] z-50 flex max-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-card border border-border bg-surface text-foreground shadow-2xl shadow-noche-950/30 transition-[opacity,translate] duration-150 outline-none sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:max-h-[min(36rem,calc(100dvh-6rem))] sm:w-96 starting:-translate-y-1 starting:opacity-0"
        >
          <div className="border-b border-border px-5 py-3.5">
            <p className="font-display text-xl leading-tight font-bold uppercase">
              Avisos
            </p>
            <p className="text-sm text-muted-foreground">
              {inbox
                ? pendingCount > 0
                  ? `${pendingCount} ${pendingCount === 1 ? "cosa pendiente" : "cosas pendientes"}`
                  : "No tenés nada pendiente"
                : "Cargando…"}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!inbox ? (
              <div className="space-y-3 p-5" aria-busy="true">
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
                        className="space-y-3 bg-oro-50 px-5 py-4"
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
                        href="/admin/inscripciones"
                        onClick={close}
                        icon={
                          <ClipboardCheck
                            className="size-5"
                            aria-hidden="true"
                          />
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
                        href="/mi-cuenta?seccion=datos"
                        onClick={close}
                        icon={
                          <UserRound className="size-5" aria-hidden="true" />
                        }
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
                              notification.unread
                                ? "bg-primary"
                                : "bg-transparent",
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
                      // Las no leídas se distinguen por el fondo, además del punto.
                      const row = cn(
                        "flex gap-3 px-5 py-3.5",
                        notification.unread && "bg-pista-50",
                      );
                      return (
                        <li key={notification.id}>
                          {notification.href ? (
                            <Link
                              href={notification.href}
                              onClick={close}
                              className={cn(
                                row,
                                "transition-colors",
                                notification.unread
                                  ? "hover:bg-pista-100"
                                  : "hover:bg-muted",
                              )}
                            >
                              {content}
                            </Link>
                          ) : (
                            <div className={row}>{content}</div>
                          )}
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-5 py-4 text-sm text-muted-foreground">
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
                        icon={
                          <Newspaper className="size-5" aria-hidden="true" />
                        }
                        title={article.title}
                        text={article.date}
                      />
                    ))}
                  </InboxSection>
                )}
              </div>
            )}
          </div>
          <div className="border-t border-border px-5 py-3">
            <Link
              href="/mi-cuenta?seccion=avisos"
              onClick={close}
              className="flex items-center justify-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover"
            >
              Ver todo en Mi cuenta
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
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
      <h3 className="bg-muted/60 px-5 py-2 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
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
          "flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted",
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
