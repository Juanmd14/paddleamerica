import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
] as const;

type GenderChoiceProps = {
  name?: string;
  legend?: string;
  required?: boolean;
  defaultValue?: string | null;
  /** Id del texto de ayuda o error. */
  describedBy?: string;
  invalid?: boolean;
  className?: string;
};

/** Rama del jugador en dos botones grandes (radio). Sirve en el registro y en Mi cuenta. */
export function GenderChoice({
  name = "gender",
  legend = "Rama",
  required = false,
  defaultValue,
  describedBy,
  invalid = false,
  className,
}: GenderChoiceProps) {
  return (
    <fieldset
      className={className}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
    >
      <legend className="mb-1.5 text-sm font-medium text-foreground-soft">
        {legend}
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex h-11 cursor-pointer items-center justify-center rounded-lg border bg-surface px-3 text-sm font-semibold transition-colors hover:bg-muted has-checked:border-noche-950 has-checked:bg-noche-950 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-pista-200",
              invalid ? "border-danger" : "border-border-strong",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={defaultValue === option.value}
              required={required}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
