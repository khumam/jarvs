import { NextResponse } from "next/server";

const API_URL = process.env.OPENCLAW_API_URL;
const BEARER_TOKEN = process.env.OPENCLAW_BEARER_TOKEN;

export async function POST(request: Request) {
  if (!API_URL || !BEARER_TOKEN) {
    return NextResponse.json(
      { error: "Missing OPENCLAW_API_URL or OPENCLAW_BEARER_TOKEN in env" },
      { status: 500 }
    );
  }

  const { transcript } = await request.json();

  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'transcript' field" },
      { status: 400 }
    );
  }

  const endpoint = `${API_URL}/v1/chat/completions`;
  const startTime = Date.now();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${BEARER_TOKEN}`,
      "x-openclaw-agent-id": "main",
    },
    body: JSON.stringify({
      model: "openclaw",
      messages: [{ role: "user", content: transcript }],
    }),
  });

  const latency = Date.now() - startTime;

  if (!res.ok) {
    const text = await res.text();
    console.error("OpenClaw API error:", res.status, text);
    return NextResponse.json(
      {
        error: `Upstream API error: ${res.status}`,
        response: null,
        latency,
        model: "openclaw",
      },
      { status: res.status }
    );
  }

  const data = await res.json();

  const response =
    data.choices?.[0]?.message?.content ??
    data.response ??
    "No response received.";

  const usage = data.usage ?? {};
  const model = data.model ?? "openclaw";

  return NextResponse.json({
    response,
    latency,
    model,
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
    endpoint: "/v1/chat/completions",
  });
}
