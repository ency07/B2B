// Script de conversión de PNG a WebP
// Uso: node scripts/convert-to-webp.mjs
import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const PUBLIC_DIR = "public";
const TARGETS = [
  "axial_duct_fan.png",
  "extractor_hongo_inox.png",
  "industrial_centrifugal_fan.png",
  "industrial_plant_ventilation.png",
  "rotor_dynamic_balancing.png",
  "ventilador_encajonado.png",
];

const QUALITY = 75;

async function convert(inputName) {
  const input = join(PUBLIC_DIR, inputName);
  const ext = extname(inputName);
  const outputName = basename(inputName, ext) + ".webp";
  const output = join(PUBLIC_DIR, outputName);

  const before = (await stat(input)).size;
  await sharp(input)
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(output);
  const after = (await stat(output)).size;
  const saved = (((before - after) / before) * 100).toFixed(1);
  console.log(
    `✓ ${inputName} -> ${outputName}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB  (-${saved}%)`
  );
}

const main = async () => {
  console.log("Convirtiendo PNGs a WebP (q=" + QUALITY + ")...\n");
  for (const t of TARGETS) {
    try {
      await convert(t);
    } catch (e) {
      console.error(`✗ ${t}: ${e.message}`);
    }
  }
  console.log("\nListo. Actualizar referencias .png -> .webp en el codigo.");
};

main();
