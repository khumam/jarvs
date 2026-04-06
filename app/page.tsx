"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useOrbChat } from "@/hooks/useOrbChat";
import { HudPanel } from "@/components/HudPanel";

const OrbScene = dynamic(
  () => import("@/components/OrbScene").then((mod) => mod.OrbScene),
  { ssr: false }
);

export default function Home() {
  const {
    state,
    lastTranscript,
    lastResponse,
    sttError,
    stats,
    currentText,
    visibleWordCount,
    startListening,
    stopListening,
    isListening,
  } = useOrbChat();

  // Prevent hydration mismatch — only render dynamic content after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Spacebar only to toggle listening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const stateLabels: Record<string, string> = {
    idle: "STANDBY",
    listening: "RECEIVING",
    thinking: "PROCESSING",
    speaking: "TRANSMITTING",
  };

  const formatTokens = (n: number) => n.toLocaleString();
  const formatLatency = (ms: number) => ms > 0 ? `${ms}ms` : "—";

  return (
    <>
      {/* 3D Canvas — fills viewport, no click handler */}
      <div className="canvas-fill">
        <OrbScene state={state} />
      </div>
      <div className="vignette" />

      {/* ── Top Left: Model & Stats ── */}
      <HudPanel position="tl" title="System" dotColor="cyan">
        <div className="panel-row">
          <span className="panel-label">Model</span>
          <span className="panel-value cyan">{mounted ? stats.model : "—"}</span>
        </div>
        <div className="panel-row">
          <span className="panel-label">Tokens In</span>
          <span className="panel-value">{mounted && stats.promptTokens > 0 ? formatTokens(stats.promptTokens) : "—"}</span>
        </div>
        <div className="panel-row">
          <span className="panel-label">Tokens Out</span>
          <span className="panel-value">{mounted && stats.completionTokens > 0 ? formatTokens(stats.completionTokens) : "—"}</span>
        </div>
        <div className="panel-row">
          <span className="panel-label">Total Tokens</span>
          <span className="panel-value">{mounted && stats.totalTokens > 0 ? formatTokens(stats.totalTokens) : "—"}</span>
        </div>
        <div className="panel-row">
          <span className="panel-label">Latency</span>
          <span className={`panel-value ${mounted && stats.latency > 0 ? "green" : ""}`}>{mounted ? formatLatency(stats.latency) : "—"}</span>
        </div>
        <div className="panel-row">
          <span className="panel-label">Session</span>
          <span className="panel-value">{mounted ? stateLabels[state] : "STANDBY"}</span>
        </div>
      </HudPanel>

      {/* ── Top Right: API Health ── */}
      <HudPanel position="tr" title="Connection" dotColor={mounted && stats.apiStatus === "Online" ? "green" : mounted && stats.apiStatus === "Error" ? "magenta" : "cyan"}>
        <div className="panel-row">
          <span className="panel-label">API</span>
          <span className={`panel-value ${mounted && stats.apiStatus === "Online" ? "green" : mounted && stats.apiStatus === "Error" ? "magenta" : ""}`}>
            {mounted ? stats.apiStatus : "Ready"}
          </span>
        </div>
        <div className="panel-row">
          <span className="panel-label">Endpoint</span>
          <span className="panel-value">{mounted ? stats.endpoint : "—"}</span>
        </div>
        <div className="panel-row">
          <span className="panel-label">Protocol</span>
          <span className="panel-value">REST/POST</span>
        </div>
        <div className="panel-row">
          <span className="panel-label">STT</span>
          <span className={`panel-value ${mounted && isListening ? "magenta" : mounted && sttError ? "magenta" : ""}`}>
            {mounted ? (sttError ? "Error" : isListening ? "Active" : "Ready") : "Ready"}
          </span>
        </div>
        <div className="panel-row">
          <span className="panel-label">TTS</span>
          <span className={`panel-value ${mounted && state === "speaking" ? "green" : ""}`}>
            {mounted ? (state === "speaking" ? "Speaking" : "Idle") : "Idle"}
          </span>
        </div>
      </HudPanel>

      {/* ── Bottom Left: User Transcript ── */}
      <HudPanel position="bl" title="Input" dotColor={isListening ? "magenta" : "cyan"}>
        <div className="panel-body">
          {sttError ? (
            <span className="placeholder" style={{ color: "var(--magenta)" }}>{sttError}</span>
          ) : isListening && !lastTranscript ? (
            <span className="placeholder">Listening...</span>
          ) : lastTranscript ? (
            lastTranscript
          ) : (
            <span className="placeholder">Awaiting voice input</span>
          )}
        </div>
      </HudPanel>

      {/* ── Bottom Right: Bot Response ── */}
      <HudPanel position="br" title="Response" dotColor={state === "speaking" ? "green" : "cyan"}>
        <div className="panel-body">
          {currentText && currentText.length > 0 ? (
            currentText.map((word, i) => (
              <span key={i} className={`word ${i < visibleWordCount ? "visible" : ""}`}>
                {word}{" "}
              </span>
            ))
          ) : (
            <span className="placeholder">
              {state === "thinking" ? "Processing..." : "No response yet"}
            </span>
          )}
        </div>
      </HudPanel>

      {/* Space hint */}
      <div className={`click-hint ${state !== "idle" ? "hidden" : ""}`}>
        Press Space to speak &middot; Drag to rotate orb
      </div>
    </>
  );
}
