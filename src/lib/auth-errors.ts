/** Mensajes en castellano para los códigos de error de Supabase Auth. */
const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "Email o contraseña incorrectos.",
  email_not_confirmed:
    "Todavía no confirmaste tu email. Revisá tu casilla (y la carpeta de spam).",
  user_already_exists: "Ya hay una cuenta con ese email. Probá ingresar.",
  email_exists: "Ya hay una cuenta con ese email. Probá ingresar.",
  weak_password:
    "La contraseña es muy débil. Usá al menos 6 caracteres, mezclando letras y números.",
  same_password: "La contraseña nueva tiene que ser distinta de la anterior.",
  email_address_invalid: "Ese email no es válido.",
  email_address_not_authorized:
    "No pudimos enviar el email a esa dirección. Probá con otra o escribinos.",
  validation_failed: "Revisá los datos: hay un campo con formato inválido.",
  over_email_send_rate_limit:
    "Mandamos demasiados emails seguidos. Esperá unos minutos y probá de nuevo.",
  over_request_rate_limit:
    "Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.",
  signup_disabled: "Por el momento no se pueden crear cuentas nuevas.",
  email_provider_disabled:
    "El ingreso con email está deshabilitado por el momento. Probá más tarde.",
  session_not_found: "Tu sesión expiró. Ingresá de nuevo.",
};

const FALLBACK = "No pudimos completar la operación. Probá de nuevo.";

export function authErrorMessage(error: { code?: string } | null | undefined) {
  return (error?.code && AUTH_ERRORS[error.code]) || FALLBACK;
}
