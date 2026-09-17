import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { ZoomableAvatar } from "@/components/zoomable-avatar";
import { categoryName } from "@/lib/categories";
import { genderLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { PublicProfile } from "@/types/models";

type Person = Pick<
  PublicProfile,
  "id" | "username" | "full_name" | "avatar_url" | "category" | "gender"
>;

function PersonRow({
  person,
  fallbackName,
  label,
  href,
  showGender = false,
}: {
  person: Person | null;
  fallbackName: string;
  label?: string;
  showGender?: boolean;
  /** Si viene, la fila lleva a la ficha de la persona. */
  href?: string;
}) {
  const name = person?.full_name || fallbackName;
  const details = [
    person?.username && `@${person.username}`,
    person?.category
      ? categoryName(person.category)
      : person && "sin categoría",
    showGender &&
      person &&
      (person.gender ? genderLabel(person.gender) : "sin rama"),
  ].filter(Boolean);

  // Dentro de un link la foto no se puede agrandar (sería un botón dentro de un link).
  const avatar = href ? (
    <Avatar name={name} src={person?.avatar_url} size="sm" />
  ) : (
    <ZoomableAvatar name={name} src={person?.avatar_url} size="sm" />
  );
  const content = (
    <>
      {avatar}
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
  showGender = false,
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
  /** Muestra la rama de cada uno (torneos mixtos y panel). */
  showGender?: boolean;
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
        showGender={showGender}
      />
      <PersonRow
        person={partner}
        fallbackName={partnerName}
        label={isMe(partner) ? "vos" : undefined}
        href={hrefOf(partner)}
        showGender={showGender}
      />
    </ul>
  );
}
