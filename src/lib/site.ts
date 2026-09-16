/** Datos de marca. Cambiá el nombre del sitio desde acá. */
export const siteConfig = {
  name: "PaddleAmerica",
  tagline: "América · Rivadavia",
  region: "América y la zona",
  description:
    "Torneos, ranking y noticias del pádel de América, Rivadavia y la zona. Anotate en el próximo torneo y seguí a los mejores jugadores.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /**
   * Datos de contacto del circuito. Solo se muestran los que completes.
   * whatsapp: número con código de país, sin "+" ni espacios (ej. "5492392123456").
   * instagram: usuario sin "@".
   */
  contact: {
    whatsapp: "",
    instagram: "",
    email: "",
  },
};

export const mainNav = [
  { href: "/torneos", label: "Torneos" },
  { href: "/jugadores", label: "Ranking" },
  { href: "/noticias", label: "Noticias" },
];
