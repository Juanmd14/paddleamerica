import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { ConfirmedPair } from "@/types/models";

type Person = ConfirmedPair["player"];

/** Un jugador de la pareja: con ficha en el ranking, lleva a su perfil. */
function PairPerson({ person }: { person: Person }) {
  const content = (
    <>
      <Avatar name={person.name} src={person.avatarUrl} size="sm" />
      <span className="min-w-0 truncate font-semibold">{person.name}</span>
    </>
  );

  return person.slug ? (
    <Link
      href={`/jugadores/${person.slug}`}
      className="flex min-w-0 items-center gap-2.5 transition-colors hover:text-accent"
    >
      {content}
    </Link>
  ) : (
    <span className="flex min-w-0 items-center gap-2.5">{content}</span>
  );
}

/** Las parejas con lugar confirmado en un torneo, numeradas por orden de inscripción. */
export function ConfirmedPairs({ pairs }: { pairs: ConfirmedPair[] }) {
  return (
    <Card className="overflow-hidden">
      <ol className="divide-y divide-border">
        {pairs.map((pair, index) => (
          <li
            key={pair.id}
            className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5"
          >
            <span className="w-6 shrink-0 text-center font-display text-xl font-bold text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
              <PairPerson person={pair.player} />
              <span
                className="hidden text-xs font-semibold text-muted-foreground sm:block"
                aria-hidden="true"
              >
                y
              </span>
              <PairPerson person={pair.partner} />
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
