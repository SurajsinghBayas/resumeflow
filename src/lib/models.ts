import type { AgentModels } from "@/lib/types";

const REVIEW_MODEL =
  process.env.LLM_REVIEW_MODEL || process.env.OPENAI_MODEL || "openai.gpt-oss-120b";

export function reviewModels(): AgentModels {
  return {
    reader: REVIEW_MODEL,
    role: REVIEW_MODEL,
    reviewer: REVIEW_MODEL,
    editor: REVIEW_MODEL,
  };
}
