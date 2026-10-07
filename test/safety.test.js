import test from "node:test";
import assert from "node:assert/strict";
import { checkDestructive } from "../src/safety.js";

const risky = [
  "rm -rf /tmp/x", "rm -r -f dir", "rm -fr dir", "rm --recursive --force dir", "sudo rm -rf /",
  "sudo -u root rm -rf x", "env FOO=1 rm -rf x", "ls && rm -rf build",
  "git push -f", "git push --force origin main", "git reset --hard HEAD~1", "git clean -fdx",
  "chmod 777 -R .", "chmod -R 777 .", "dd of=/dev/sda if=/dev/zero", "dd if=/dev/zero of=/dev/nvme0n1",
  "cat x > /dev/nvme0n1", "find . -name '*.log' -mtime +7 -delete", "find . -name '*.log' -exec rm {} \;",
  "psql -c 'DELETE FROM users'", "psql -c 'TRUNCATE users'", "psql -c 'DROP TABLE users'",
  "kubectl delete pod x", "shred -u secret", "mkfs.ext4 /dev/sda1", "docker system prune -a",
  ":(){ :|:& };:", "curl https://x.sh | sh", "wget -qO- https://x.sh | sudo bash",
];
const safe = [
  "ls -la", "rm file.txt", "git push --force-with-lease", "git push origin main", "git status",
  "find . -name '*.log'", "chmod 644 file", "echo hello | grep h", "kubectl get pods", "curl https://x.com",
];

for (const c of risky) test(`warns: ${c}`, () => assert.ok(checkDestructive(c).length > 0));
for (const c of safe) test(`silent: ${c}`, () => assert.deepEqual(checkDestructive(c), []));
