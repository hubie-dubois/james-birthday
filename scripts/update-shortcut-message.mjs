import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const outputPath = fileURLToPath(new URL("../shortcut-message.txt", import.meta.url));
const generatorPath = fileURLToPath(new URL("./generate-shortcut-message.mjs", import.meta.url));
const forceUpdate = process.env.FORCE_SHORTCUT_UPDATE === "true";

function getGeneratedDateKey(message) {
  const match = message.match(/^Generated:\s+([A-Za-z]+ \d{1,2}, \d{4})\b/m);
  return match?.[1] ?? null;
}

async function readExistingMessage() {
  try {
    return await readFile(outputPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return "";
    }

    throw error;
  }
}

const [{ stdout: nextMessage }, currentMessage] = await Promise.all([
  execFileAsync(process.execPath, [generatorPath], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  }),
  readExistingMessage(),
]);

const nextDateKey = getGeneratedDateKey(nextMessage);
const currentDateKey = getGeneratedDateKey(currentMessage);

if (!nextDateKey) {
  throw new Error("Generated shortcut message is missing a Generated date.");
}

if (!forceUpdate && currentDateKey === nextDateKey) {
  console.log(`Shortcut message is already current for ${nextDateKey}.`);
  process.exit(0);
}

await writeFile(outputPath, nextMessage, "utf8");
console.log(`Wrote shortcut-message.txt for ${nextDateKey}.`);
