const SEGMENT_SPLIT = /;|&&|\|\||\|/;

const FORK_BOMB = /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/;
const SQL = [
  [/\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i, "drops a table/database"],
  [/\bTRUNCATE\b/i, "truncates a table"],
  [/\bDELETE\s+FROM\b/i, "deletes rows"],
];
const RAW_DISK = /(^|\s)>\s*\/dev\/(sd|nvme|disk|hd|vd)/i;
const DEVICE = /^\/dev\/(sd|nvme|disk|rdisk|hd|vd)/i;

function flags(args) {
  const set = new Set();
  for (const a of args) {
    if (a.startsWith("--")) set.add(a.slice(2));
    else if (a.startsWith("-") && a.length > 1) for (const c of a.slice(1)) set.add(c);
  }
  return set;
}

function checkSegment(segment) {
  let words = segment.trim().split(/\s+/).filter(Boolean);
  // strip sudo/env/doas prefixes and their options / VAR=x assignments
  while (words.length) {
    const w = words[0];
    if (w === "sudo" || w === "doas") {
      words.shift();
      while (words[0]?.startsWith("-")) {
        const opt = words.shift();
        if (opt === "-u" || opt === "-g") words.shift();
      }
    } else if (w === "env" || /^[A-Za-z_]\w*=/.test(w)) words.shift();
    else break;
  }
  const [prog, ...args] = words;
  if (!prog) return [];
  const f = flags(args);
  const sub = args.find((a) => !a.startsWith("-"));
  const out = [];

  if (prog === "rm" && (f.has("r") || f.has("R") || f.has("recursive")) && (f.has("f") || f.has("force")))
    out.push("recursive force delete");
  else if (prog === "rm" && (f.has("r") || f.has("R") || f.has("recursive")) && args.some((a) => a === "/" || a === "~" || a === "/*"))
    out.push("recursive delete of root/home");
  if (prog === "git" && sub === "push" && (f.has("f") || f.has("force")))
    out.push("force-pushes, can overwrite remote history");
  if (prog === "git" && sub === "reset" && f.has("hard")) out.push("discards uncommitted changes");
  if (prog === "git" && sub === "clean" && f.has("f")) out.push("deletes untracked files");
  if (prog === "chmod" && args.includes("777")) out.push("opens permissions to everyone");
  if (prog === "dd" && args.some((a) => a.startsWith("of=") && DEVICE.test(a.slice(3))))
    out.push("writes raw disk device");
  if (prog === "find" && (args.includes("-delete") || (args.includes("-exec") && /^(rm|shred)$/.test(args[args.indexOf("-exec") + 1] || ""))))
    out.push("deletes matched files");
  if (/^mkfs/.test(prog)) out.push("reformats a filesystem");
  if (prog === "shred") out.push("irrecoverably overwrites files");
  if (prog === "kubectl" && sub === "delete") out.push("deletes kubernetes resources");
  if (prog === "docker" && sub === "system" && args.includes("prune")) out.push("prunes docker resources");
  return out;
}

export function checkDestructive(command) {
  const reasons = new Set();
  if (FORK_BOMB.test(command)) reasons.add("fork bomb");
  if (RAW_DISK.test(command)) reasons.add("overwrites raw disk device");
  for (const [re, reason] of SQL) if (re.test(command)) reasons.add(reason);
  // curl/wget piped into a shell
  if (/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh)\b/.test(command)) reasons.add("runs a downloaded script");
  for (const seg of command.split(SEGMENT_SPLIT)) for (const r of checkSegment(seg)) reasons.add(r);
  return [...reasons];
}
