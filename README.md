# cmdgenie

Natural language to shell command CLI. Describe what you want, get one shell command printed back. Never auto-executes.

## Install

```
npm install -g cmdgenie-cli
```

Or run directly with node, no install:

```
node bin/cmdgenie "your request"
```

## Usage

```
cmdgenie "find all .log files older than 7 days and delete them"
```

First run prompts for your OpenAI API key and saves it to `~/.cmdgenierc` (chmod 600). Subsequent runs read it silently.

Set or change the key/provider directly:

```
cmdgenie config set-key <your-openai-key>
cmdgenie config set-provider openai
```

## Safety

- Print-only. cmdgenie never executes the generated command for you.
- Destructive-looking commands (`rm -rf`, `DROP TABLE`, `docker system prune`, `git push --force`, etc) get a `WARNING:` line printed above them. This is a heads-up, not a block — review before running.
- Input is capped at 200 words and sanitized locally before any API call.

## Config

- `~/.cmdgenierc` — JSON, holds provider name and API key(s) per provider.
- Default provider: `openai`, model `gpt-4.1-nano`.
