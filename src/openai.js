import OpenAI from "openai";

const SYSTEM_PROMPT =
  "You output exactly one shell command and nothing else. No explanation, no markdown, no backticks. " +
  "If the request is ambiguous, pick the most common safe default. If it cannot be expressed as a single " +
  "command, output a single line using && if needed.";

export async function generateCommand(userText, apiKey) {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    temperature: 0,
    max_tokens: 80,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userText },
    ],
  });

  const command = response.choices[0]?.message?.content?.trim() || "";
  return command.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
}
