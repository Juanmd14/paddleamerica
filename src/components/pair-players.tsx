import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { categoryName } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { PublicProfile } from "@/types/models";

type Person = Pick<
  PublicProfile,
  "id" | "username" | "full_name" | "avatar_url" | "category"
>;

function PersonRow({
  person,
  fallbackName,
  label,
  href,
}: {
  person: Person | null;
  fallbackName: string;
  label?: string;
  /** Si viene, la fila lleva a la ficha de la persona. */
  href?: string;
}) {
  const name = person?.full_name || fallbackName;
  const details = [
    person?.username && `@${person.username}`,
    person?.category
      ? categoryName(person.category)
      : person && "sin categoría",
  ].filter(Boolean);

  const content = (
    <>
      <Avatar name={name} src={person?.avatar_url} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">
          {name}
          {label && (
            <span className="font-normal text-muted-foreground">
              {" "}
              · {label}
            </span>
          )}
        </p>
        {details.length > 0 && (
          <p className="truncate text-sm text-muted-foreground">
            {details.join(" · ")}
          </p>
        )}
      </div>
    </>
  );

  return (
    <li className="min-w-0">
      {href ? (
        <Link
          href={href}
          className="group -m-2 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
          title={`Ver el perfil de ${name}`}
        >
          {content}
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      ) : (
        <div className="flex items-center gap-3">{content}</div>
      )}
    </li>
  );
}

/** Los dos jugadores de una inscripción, con foto, usuario y categoría. */
export function PairPlayers({
  player,
  partner,
  partnerName,
  meId,
  adminLinks = false,
  className,
}: {
  player: Person | null;
  partner: Person | null;
  /** Nombre guardado de la pareja (las inscripciones viejas no tienen usuario). */
  partnerName: string;
  /** Para marcar cuál de los dos es el usuario que mira. */
  meId?: string;
  /** En el panel: cada jugador lleva a su ficha de usuario. */
  adminLinks?: boolean;
  className?: string;
}) {
  const isMe = (person: Person | null) =>
    meId !== undefined && person?.id === meId;
  const hrefOf = (person: Person | null) =>
    adminLinks && person ? `/admin/usuarios/${person.id}` : undefined;

  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <PersonRow
        person={player}
        fallbackName="Jugador"
        label={isMe(player) ? "vos" : undefined}
        href={hrefOf(player)}
      />
      <PersonRow
        person={partner}
        fallbackName={partnerName}
        label={isMe(partner) ? "vos" : undefined}
        href={hrefOf(partner)}
      />
    </ul>
  );
}
