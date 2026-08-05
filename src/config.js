import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const CONFIG_PATH = path.join(os.homedir(), ".cmdgenierc");

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

export function getProvider() {
  return readConfig().provider || "openai";
}

export function setProvider(name) {
  const config = readConfig();
  config.provider = name;
  writeConfig(config);
}

export function setApiKey(key, provider = getProvider()) {
  const config = readConfig();
  config.provider = config.provider || provider;
  config[provider] = { ...config[provider], apiKey: key };
  writeConfig(config);
}

export async function getApiKey(provider = getProvider()) {
  const config = readConfig();
  const existing = config[provider]?.apiKey;
  if (existing) return existing;

  const key = await prompt(`No API key found. Enter your ${provider} API key: `);
  if (!key) throw new Error("API key is required.");
  setApiKey(key, provider);
  return key;
}
