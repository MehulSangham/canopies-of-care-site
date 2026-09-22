/**
 * Models the editor assistant may use. Shared between the client selector
 * and the agent route (which validates against this list).
 *
 * `id` is the direct-Anthropic model name; `gateway` is the Vercel AI
 * Gateway equivalent used when no ANTHROPIC_API_KEY is configured.
 */
export const AI_MODELS = [
  { id: 'claude-sonnet-4-5', label: 'Sonnet 4.5 · balanced', gateway: 'anthropic/claude-sonnet-4.5' },
  { id: 'claude-opus-4-1', label: 'Opus 4.1 · deep', gateway: 'anthropic/claude-opus-4.1' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5 · fast', gateway: 'anthropic/claude-haiku-4.5' },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]['id'];

export const DEFAULT_MODEL_ID: AiModelId = 'claude-sonnet-4-5';

export function isValidModelId(id: unknown): id is AiModelId {
  return typeof id === 'string' && AI_MODELS.some((m) => m.id === id);
}

/** localStorage key for the editor's model choice (shared by all assistants). */
export const MODEL_STORAGE_KEY = 'nis-ai-model';
