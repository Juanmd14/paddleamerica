/**
 * Rama de la pareja según el torneo: en uno masculino o femenino juegan los
 * dos de esa rama; en uno mixto, un jugador de cada rama.
 * Mismo orden y mismos códigos que la función SQL pair_gender_error.
 */

export type GenderErrorCode =
  | "falta_rama"
  | "rama_no_corresponde"
  | "pareja_sin_rama"
  | "pareja_rama_no_corresponde"
  | "mixto_requiere_uno_de_cada";

const BRANCH: Record<string, string> = {
  masculino: "masculina",
  femenino: "femenina",
};

export function pairGenderErrorCode(
  tournamentGender: string,
  player: string | null,
  partner: string | null,
): GenderErrorCode | null {
  const single =
    tournamentGender === "masculino" || tournamentGender === "femenino";
  if (!player) return "falta_rama";
  if (single && player !== tournamentGender) return "rama_no_corresponde";
  if (!partner) return "pareja_sin_rama";
  if (single && partner !== tournamentGender) {
    return "pareja_rama_no_corresponde";
  }
  if (tournamentGender === "mixto" && player === partner) {
    return "mixto_requiere_uno_de_cada";
  }
  return null;
}

/** Mensaje para cada código (también los que devuelve la base al anotarse). */
export function genderErrorMessage(
  code: string,
  tournamentGender: string,
  partnerName = "Tu pareja",
): string | null {
  const branch = BRANCH[tournamentGender];
  const messages: Record<GenderErrorCode, string> = {
    falta_rama:
      "Todavía no elegiste tu rama (masculino o femenino). Elegila en Mi cuenta → Mis datos para poder anotarte.",
    rama_no_corresponde: branch
      ? `Este torneo es de la rama ${branch}: no te podés anotar.`
      : "Tu rama no corresponde a este torneo.",
    pareja_sin_rama: `${partnerName} todavía no eligió su rama. Pedile que la elija en Mi cuenta → Mis datos.`,
    pareja_rama_no_corresponde: branch
      ? `${partnerName} no es de la rama ${branch}, y este torneo es de esa rama.`
      : `${partnerName} no es de la rama de este torneo.`,
    mixto_requiere_uno_de_cada:
      "Es un torneo mixto: la pareja tiene que ser un jugador de cada rama.",
  };
  return code in messages ? messages[code as GenderErrorCode] : null;
}

/** Problemas de la rama propia (sin mirar a la pareja): null si puede anotarse. */
export function playerGenderError(
  tournamentGender: string,
  gender: string | null,
) {
  const code = pairGenderErrorCode(tournamentGender, gender, gender);
  return code === "falta_rama" || code === "rama_no_corresponde"
    ? genderErrorMessage(code, tournamentGender)
    : null;
}

/** Por qué la pareja no puede jugar por la rama (null si puede). */
export function pairGenderError(
  tournamentGender: string,
  player: string | null,
  partner: string | null,
  partnerName = "Tu pareja",
) {
  const code = pairGenderErrorCode(tournamentGender, player, partner);
  return code ? genderErrorMessage(code, tournamentGender, partnerName) : null;
}

/** Quiénes juegan, en una frase. */
export function genderRulesHelp(tournamentGender: string) {
  if (tournamentGender === "mixto") {
    return "Es mixto: cada pareja es un jugador de cada rama.";
  }
  const branch = BRANCH[tournamentGender];
  return branch ? `Juegan parejas de la rama ${branch}.` : "";
}
