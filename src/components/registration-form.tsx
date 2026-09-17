"use client";

import { Check, LoaderCircle, Search, X } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import {
  type PartnerOption,
  type RegistrationFormState,
  registerForTournament,
  searchPartners,
} from "@/app/torneos/[slug]/actions";
import { SubmitButton } from "@/components/submit-button";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RegistrationFormProps = {
  slug: string;
  defaultPhone?: string | null;
  /** WhatsApp para invitar a crear cuenta a una pareja que no está en el sitio. */
  signupShareUrl?: string;
};

/** Anotarse invitando a la pareja: se busca por @usuario o nombre entre las cuentas del sitio. */
export function RegistrationForm({
  slug,
  defaultPhone,
  signupShareUrl,
}: RegistrationFormProps) {
  const [state, formAction] = useActionState<RegistrationFormState, FormData>(
    registerForTournament.bind(null, slug),
    {},
  );
  const values = state.values ?? {};
  const errors = state.errors ?? {};

  const [query, setQuery] = useState(values.partner_username ?? "");
  const [selected, setSelected] = useState<PartnerOption | null>(null);
  const [results, setResults] = useState<PartnerOption[]>([]);
  const [searching, setSearching] = useState(false);
  /** Término de la última búsqueda terminada (para no decir "no encontramos" antes de buscar). */
  const [searchedTerm, setSearchedTerm] = useState("");
  const term = query.trim().replace(/^@/, "");
  const canSearch = !selected && term.length >= 2;

  useEffect(() => {
    if (!canSearch) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const found = await searchPartners(slug, term);
      if (!cancelled) {
        setResults(found);
        setSearchedTerm(term);
        setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canSearch, slug, term]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && <Alert tone="danger">{state.message}</Alert>}

      <div>
        <Label htmlFor="partner-search">Tu pareja</Label>
        <input
          type="hidden"
          name="partner_username"
          value={selected?.username ?? term}
        />
        {selected ? (
          <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success-soft px-3 py-2.5">
            <Avatar name={selected.name} src={selected.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{selected.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                @{selected.username}
                {selected.category && ` · ${selected.category}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
              className="flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
              aria-label="Elegir otra pareja"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="partner-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="@usuario o nombre"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="pl-9"
                role="combobox"
                aria-expanded={canSearch && results.length > 0}
                aria-controls="partner-results"
                aria-invalid={!!errors.partner_username}
                aria-describedby="partner-hint"
              />
              {searching && (
                <LoaderCircle
                  className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
            </div>
            {canSearch && results.length > 0 && (
              <ul
                id="partner-results"
                role="listbox"
                aria-label="Jugadores encontrados"
                className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
              >
                {results.map((option) => (
                  <li key={option.username} role="option" aria-selected={false}>
                    <button
                      type="button"
                      disabled={option.blocked !== null}
                      onClick={() => {
                        setSelected(option);
                        setResults([]);
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <Avatar
                        name={option.name}
                        src={option.avatarUrl}
                        size="sm"
                        className={cn(option.blocked && "opacity-50")}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate font-semibold",
                            option.blocked && "text-muted-foreground",
                          )}
                        >
                          {option.name}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          @{option.username}
                          {option.category
                            ? ` · ${option.category}`
                            : " · sin categoría"}
                          {option.gender && ` · ${option.gender}`}
                        </span>
                        {option.blocked && (
                          <span className="mt-0.5 block text-xs font-medium text-danger">
                            {option.blocked}
                          </span>
                        )}
                      </span>
                      {!option.blocked && (
                        <Check
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        {errors.partner_username ? (
          <FieldError id="partner-hint">{errors.partner_username}</FieldError>
        ) : (
          !selected && (
            <p
              id="partner-hint"
              className="mt-1.5 text-xs text-muted-foreground"
            >
              {canSearch &&
              !searching &&
              searchedTerm === term &&
              results.length === 0 ? (
                <>
                  No encontramos a nadie. Tu pareja tiene que tener cuenta:{" "}
                  {signupShareUrl ? (
                    <a
                      href={signupShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-success hover:underline"
                    >
                      invitala por WhatsApp a crearse una
                    </a>
                  ) : (
                    <a
                      href="/login?modo=registro"
                      className="font-semibold text-accent hover:text-accent-hover"
                    >
                      pasale el link para registrarse
                    </a>
                  )}
                  .
                </>
              ) : (
                "Tiene que tener cuenta en el sitio. Escribí su usuario o su nombre."
              )}
            </p>
          )
        )}
      </div>

      <div>
        <Label htmlFor="contact_phone">Tu teléfono (WhatsApp)</Label>
        <Input
          id="contact_phone"
          name="contact_phone"
          type="tel"
          autoComplete="tel"
          placeholder="2392 123456"
          required
          defaultValue={values.contact_phone ?? defaultPhone ?? ""}
          aria-invalid={!!errors.contact_phone}
          aria-describedby={
            errors.contact_phone ? "contact_phone-error" : undefined
          }
        />
        <FieldError id="contact_phone-error">{errors.contact_phone}</FieldError>
      </div>

      <div>
        <Label htmlFor="notes">
          Observaciones{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Horarios en los que no pueden jugar, etc."
          defaultValue={values.notes}
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? "notes-error" : undefined}
        />
        <FieldError id="notes-error">{errors.notes}</FieldError>
      </div>

      <SubmitButton size="lg" className="w-full" pendingLabel="Enviando…">
        Invitar y anotarnos
      </SubmitButton>
      <ol className="space-y-1.5 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <span className="font-semibold text-foreground">1.</span> Tu pareja
          recibe un aviso y acepta la invitación.
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-foreground">2.</span> El
          organizador ve los perfiles de los dos y confirma el lugar.
        </li>
      </ol>
    </form>
  );
}
