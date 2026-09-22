export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}

export function gatewayConfigured() {
  return Boolean(
    process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  );
}

function apiKey() {
  return process.env.LLM_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
}

function baseUrl() {
  return (
    process.env.LLM_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    "https://openrouter.ai/api/v1"
  ).replace(/\/$/, "");
}

function projectId() {
  return process.env.LLM_PROJECT_ID || process.env.OPENAI_PROJECT_ID || "";
}

export async function complete(model: string, system: string, user: string) {
  const key = apiKey();
  if (!key) {
    throw new LlmError(
      "Add LLM_API_KEY (or OPENROUTER_API_KEY / OPENAI_API_KEY) to .env.local before running a review.",
    );
  }

  const response = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(projectId() ? { "OpenAI-Project": projectId() } : {}),
      ...(baseUrl().includes("openrouter.ai")
        ? {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "ResumeFlow",
          }
        : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const body = (await response.json().catch(() => null)) as {
    error?: { message?: string } | string;
    choices?: { message?: { content?: string } }[];
  } | null;

  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : body?.error?.message || `The model gateway returned ${response.status}.`;
    throw new LlmError(message);
  }

  const content = body?.choices?.[0]?.message?.content;
  if (!content) {
    throw new LlmError("The model returned an empty response.");
  }
  return content;
}

export function parseModelJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new LlmError("The model did not return JSON.");
  }
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    throw new LlmError("The model returned JSON that could not be parsed.");
  }
}
