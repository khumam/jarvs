export interface ChatResult {
  response: string;
  latency: number;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  endpoint: string;
}

export async function sendChatMessage(transcript: string): Promise<ChatResult> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Chat API error: ${res.status}`);
  }

  return {
    response: data.response ?? "No response received.",
    latency: data.latency ?? 0,
    model: data.model ?? "unknown",
    promptTokens: data.promptTokens ?? 0,
    completionTokens: data.completionTokens ?? 0,
    totalTokens: data.totalTokens ?? 0,
    endpoint: data.endpoint ?? "/v1/chat/completions",
  };
}
