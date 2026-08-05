import { getApiKey, setApiKey, setProvider } from "./config.js";
import { generateCommand } from "./openai.js";

const MAX_WORDS = 200;

const DESTRUCTIVE_PATTERNS = [
  { pattern: /\brm\s+-[a-z]*r[a-z]*f\b|\brm\s+-[a-z]*f[a-z]*r\b/i, reason: "recursive force delete" },
  { pattern: /\bDROP\s+(TABLE|DATABASE)\b/i, reason: "drops a table/database" },
  { pattern: /\bdocker\s+system\s+prune\b/i, reason: "prunes docker resources" },
  { pattern: /\bmkfs\b/i, reason: "reformats a filesystem" },
  { pattern: /\bdd\s+if=.*\bof=\/dev\//i, reason: "writes raw disk device" },
  { pattern: /\bgit\s+push\s+.*--force\b/i, reason: "force-pushes, can overwrite remote history" },
  { pattern: /\bchmod\s+-R\s+777\b/i, reason: "opens permissions recursively" },
  { pattern: /:\(\)\s*\{\s*:\|:&\s*\};:/, reason: "fork bomb" },
  { pattern: />\s*\/dev\/sd[a-z]\b/i, reason: "overwrites raw disk device" },
];

function sanitize(text) {
  const cleaned = text.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) throw new Error("Input is empty.");
  const wordCount = cleaned.split(" ").length;
  if (wordCount > MAX_WORDS) throw new Error(`Input too long (${wordCount} words, max ${MAX_WORDS}).`);
  return cleaned;
}

function checkDestructive(command) {
  return DESTRUCTIVE_PATTERNS.filter((p) => p.pattern.test(command)).map((p) => p.reason);
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "config") {
    if (args[1] === "set-key") {
      const key = args[2];
      if (!key) throw new Error("Usage: cmdgenie config set-key <key>");
      setApiKey(key);
      console.log("API key saved.");
      return;
    }
    if (args[1] === "set-provider") {
      const name = args[2];
      if (!name) throw new Error("Usage: cmdgenie config set-provider <name>");
      setProvider(name);
      console.log(`Provider set to ${name}.`);
      return;
    }
    throw new Error("Usage: cmdgenie config set-key|set-provider <value>");
  }

  const text = sanitize(args.join(" "));
  const apiKey = await getApiKey();
  const command = await generateCommand(text, apiKey);

  const warnings = checkDestructive(command);
  for (const reason of warnings) {
    console.log(`WARNING: this command ${reason} — review before running.`);
  }
  console.log(command);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
