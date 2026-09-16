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
}: {
  person: Person | null;
  fallbackName: string;
  label?: string;
}) {
  const name = person?.full_name || fallbackName;
  const details = [
    person?.username && `@${person.username}`,
    person?.category
      ? categoryName(person.category)
      : person && "sin categoría",
  ].filter(Boolean);

  return (
    <li className="flex min-w-0 items-center gap-3">
      <Avatar name={name} src={person?.avatar_url} size="sm" />
      <div className="min-w-0">
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
    </li>
  );
}

/** Los dos jugadores de una inscripción, con foto, usuario y categoría. */
export function PairPlayers({
  player,
  partner,
  partnerName,
  meId,
  className,
}: {
  player: Person | null;
  partner: Person | null;
  /** Nombre guardado de la pareja (las inscripciones viejas no tienen usuario). */
  partnerName: string;
  /** Para marcar cuál de los dos es el usuario que mira. */
  meId?: string;
  className?: string;
}) {
  const isMe = (person: Person | null) =>
    meId !== undefined && person?.id === meId;

  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <PersonRow
        person={player}
        fallbackName="Jugador"
        label={isMe(player) ? "vos" : undefined}
      />
      <PersonRow
        person={partner}
        fallbackName={partnerName}
        label={isMe(partner) ? "vos" : undefined}
      />
    </ul>
  );
}
