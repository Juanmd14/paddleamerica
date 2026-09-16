/**
 * Prepara las imágenes que usa el ranking.
 *
 * Fuentes, las dos en public/:
 *   cancha/cancha foto.png   cenital nocturna de la cancha entera, apaisada
 *   imagen hero test 1.png   la maqueta original, de donde salen las caras
 *
 * Salidas:
 *   cancha/completa.jpg   la cancha, entera y sin recortar. Solo se convierte a
 *                         JPEG para no servir 2,8 MB de PNG.
 *   fotos/<slug>.jpg      las cuatro caras del podio.
 *
 * La cancha NO se recorta: cualquier recorte le come el fondo y la cancha se ve
 * cortada. La foto ya viene con la red vertical al medio y los cuatro
 * cuadrantes completos, que es exactamente la composición que necesitamos.
 *
 * Correr con: node scripts/cortar-cancha.mjs
 */
import { existsSync } from "node:fs";
import sharp from "sharp";

const CANCHA = "public/cancha/cancha foto.png"; // 1536 × 1024
const MAQUETA = "public/imagen hero test 1.png"; // 1536 × 1024, opcional

/*
 * Geometría medida sobre la foto original (1536 × 1024):
 *
 *   línea de saque izquierda   x 138    →  138 px de fondo hasta el borde
 *   línea de saque derecha     x 1426   →  109 px de fondo hasta el borde
 *   red (centro)               x 780
 *   línea central horizontal   y 511
 *
 * La foto está encuadrada torcida: el fondo de la izquierda mide 29 px más que
 * el de la derecha. Con los cuatro bloques apoyados en sus líneas, esos 29 px
 * de más se ven como un espacio extra de un solo lado y la cancha queda
 * desbalanceada.
 *
 * Por eso se le sacan esos 29 px a la izquierda y nada más: los dos fondos
 * quedan de 109 px, la red al 49,8 % y las dos líneas a la misma distancia del
 * borde. No es recortar la cancha —los dos fondos siguen enteros—, es
 * emparejar el encuadre.
 */
const DESFASE = 29;

const completa = await sharp(CANCHA)
  .extract({ left: DESFASE, top: 0, width: 1536 - DESFASE, height: 1024 })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile("public/cancha/completa.jpg");

console.log(
  `completa: ${completa.width}×${completa.height} ` +
    `(${(completa.width / completa.height).toFixed(3)}:1), ` +
    `${Math.round(completa.size / 1024)} kB`,
);

// Las cuatro fotos de jugador salen de las tarjetas de la maqueta. Son
// placeholders: se reemplazan por las reales cuando estén en Supabase Storage.
// La maqueta es opcional — si no está, las que ya se generaron quedan como están.
const CARAS = [
  { slug: "martin-gomez", left: 74, top: 178 },
  { slug: "lucas-ferreyra", left: 1102, top: 178 },
  { slug: "tomas-aguirre", left: 74, top: 616 },
  { slug: "nicolas-ibarra", left: 1102, top: 616 },
];

if (!existsSync(MAQUETA)) {
  console.log(`\nSin ${MAQUETA}: no regenero las caras de public/fotos.`);
} else {
  for (const { slug, left, top } of CARAS) {
    const cara = await sharp(MAQUETA)
      .extract({ left: left + 11, top: top + 11, width: 82, height: 82 })
      .resize(200, 200)
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(`public/fotos/${slug}.jpg`);
    console.log(`${slug}: ${cara.width}×${cara.height}`);
  }
}
