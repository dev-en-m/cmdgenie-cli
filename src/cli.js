import { getApiKey, setApiKey, setProvider } from "./config.js";
import { generateCommand } from "./openai.js";
import { checkDestructive } from "./safety.js";

const MAX_WORDS = 200;

function sanitize(text) {
  const cleaned = text.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim();
  if (!cleaned) throw new Error("Input is empty.");
  const wordCount = cleaned.split(" ").length;
  if (wordCount > MAX_WORDS) throw new Error(`Input too long (${wordCount} words, max ${MAX_WORDS}).`);
  return cleaned;
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
