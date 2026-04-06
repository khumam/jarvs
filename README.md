# Professor

An AI voice assistant with an animated 3D orb interface. Speak to it, and it thinks, responds, and reads the answer back to you — all driven by a real-time STT → API → TTS pipeline.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Three.js](https://img.shields.io/badge/Three.js-0.183-black?logo=threedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)

---

## Features

- **3D Orb** — A fully animated Three.js orb that reacts in real-time to the current state (idle, listening, thinking, speaking) with color shifts, particle effects, pulsing glow, and rotating wireframe shells.
- **Voice Input (STT)** — Uses the browser's native Web Speech API to capture and transcribe your voice in Indonesian (`id-ID`), with interim results shown live.
- **AI Backend** — Sends the transcript to an OpenClaw-compatible REST API and streams back a response.
- **Voice Output (TTS)** — Reads the AI response aloud using the browser's Speech Synthesis API, with word-by-word highlighting in the HUD.
- **HUD Panels** — Four corner panels display model name, token usage, latency, API/STT/TTS status, the user's transcript, and the AI's response.
- **Keyboard Shortcut** — Press `Space` to start or stop listening from anywhere on the page.
- **Drag to Rotate** — The orb scene supports click-drag orbital rotation via `@react-three/drei`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5 |
| 3D | Three.js, React Three Fiber, Drei |
| Styling | Tailwind CSS v4 |
| Speech | Web Speech API (STT + TTS) |
| AI Backend | OpenClaw REST API (configurable) |

---

## Project Structure

```
professor/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        # Next.js API route — proxies requests to OpenClaw
│   ├── globals.css             # Global styles & HUD panel layout
│   ├── layout.tsx              # Root layout with fonts
│   └── page.tsx                # Main page — orb + all HUD panels
│
├── components/
│   ├── HudPanel.tsx            # Reusable HUD corner panel component
│   ├── NetworkLines.tsx        # Decorative network lines
│   ├── Orb.tsx                 # Core 3D orb mesh with all animations
│   └── OrbScene.tsx            # React Three Fiber canvas + camera + controls
│
├── hooks/
│   ├── useOrbChat.ts           # Orchestrates the full STT → API → TTS pipeline
│   ├── useSpeechRecognition.ts # Web Speech API abstraction (STT)
│   └── useSpeechSynthesis.ts   # Speech Synthesis API abstraction (TTS)
│
├── lib/
│   └── api.ts                  # sendChatMessage() — typed fetch wrapper for /api/chat
│
└── types/                      # Shared TypeScript types
```

---

## Orb States

The orb has four states that drive its visual behavior:

| State | Color | Behavior |
|---|---|---|
| `idle` | Cyan | Slow gentle pulse |
| `listening` | Magenta/Pink | Faster pulse, shells spin up |
| `thinking` | Amber | Rapid agitated pulse, fast ring rotation |
| `speaking` | Cyan | Deep breathing animation, echo rings ripple outward |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A running [OpenClaw](https://openclaw.ai)-compatible API endpoint
- A modern browser with Web Speech API support (Chrome / Edge recommended)

> **Note:** Speech recognition requires a **secure context** (HTTPS or `localhost`). It will not work over plain HTTP on a remote host.

### Installation

```bash
git clone <your-repo-url>
cd professor
npm install
```

### Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```
OPENCLAW_API_URL=https://your-openclaw-instance.com
OPENCLAW_BEARER_TOKEN=your_bearer_token_here
```

| Variable | Description |
|---|---|
| `OPENCLAW_API_URL` | Base URL of your OpenClaw-compatible backend (no trailing slash) |
| `OPENCLAW_BEARER_TOKEN` | Bearer token used to authenticate requests to the API |

These variables are **server-side only** — they are never exposed to the browser.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Usage

1. Open the app in a Chromium-based browser for best Speech API support.
2. Grant microphone permission when prompted.
3. Press **Space** (or click the hint at the bottom) to start listening.
4. Speak your message in Indonesian.
5. The orb transitions through `listening → thinking → speaking` automatically.
6. The response is read aloud, with words highlighted in the bottom-right panel as they are spoken.
7. Press **Space** again at any time to interrupt and start a new query.

---

## API Route

The `/api/chat` route acts as a secure server-side proxy to prevent exposing your API credentials to the client.

**Request**
```
POST /api/chat
Content-Type: application/json

{ "transcript": "your message here" }
```

**Response**
```json
{
  "response": "AI reply text",
  "latency": 432,
  "model": "openclaw",
  "promptTokens": 12,
  "completionTokens": 58,
  "totalTokens": 70,
  "endpoint": "/v1/chat/completions"
}
```

---

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---|---|---|---|---|
| Speech Recognition (STT) | ✅ | ✅ | ❌ | ⚠️ Partial |
| Speech Synthesis (TTS) | ✅ | ✅ | ✅ | ✅ |
| 3D Orb (WebGL) | ✅ | ✅ | ✅ | ✅ |

> Safari has a known quirk where the STT `isFinal` event may never fire — the app handles this by promoting the last interim result to final when recognition ends.

---