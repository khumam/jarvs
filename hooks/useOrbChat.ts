"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useSpeechSynthesis } from "./useSpeechSynthesis";
import { sendChatMessage } from "@/lib/api";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

export interface ChatStats {
  model: string;
  latency: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  endpoint: string;
  apiStatus: string;
}

export function useOrbChat() {
  const [state, setState] = useState<OrbState>("idle");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [stats, setStats] = useState<ChatStats>({
    model: "—",
    latency: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    endpoint: "—",
    apiStatus: "Ready",
  });

  const { isListening, transcript, interimText, error: sttError, startListening: sttStart, stopListening: sttStop } = useSpeechRecognition();
  const { speak, cancel: ttsCancel, isSpeaking, visibleWordCount, words } = useSpeechSynthesis();

  const prevSpeakingRef = useRef(false);
  const processedTranscriptRef = useRef<string | null>(null);

  const startListening = useCallback(() => {
    ttsCancel();
    setState("listening");
    sttStart();
  }, [sttStart, ttsCancel]);

  const stopListening = useCallback(() => {
    sttStop();
  }, [sttStop]);

  // Process transcript when STT delivers a final result
  useEffect(() => {
    if (!transcript) return;
    if (transcript === processedTranscriptRef.current) return;

    console.log("[Orb] Processing transcript:", transcript);
    processedTranscriptRef.current = transcript;
    setLastTranscript(transcript);

    const process = async () => {
      setState("thinking");
      setStats(s => ({ ...s, apiStatus: "Requesting" }));
      try {
        const result = await sendChatMessage(transcript);
        console.log("[Orb] Got response:", result.response);
        setLastResponse(result.response);
        setStats({
          model: result.model,
          latency: result.latency,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.totalTokens,
          endpoint: result.endpoint,
          apiStatus: "Online",
        });
        setState("speaking");
        speak(result.response);
      } catch (err) {
        console.error("[Orb] Chat pipeline error:", err);
        setStats(s => ({ ...s, apiStatus: "Error" }));
        setState("idle");
      }
    };
    process();
  }, [transcript, speak]);

  // Track STT error → reset state
  useEffect(() => {
    if (sttError && state === "listening") {
      setState("idle");
    }
  }, [sttError, state]);

  // Track speaking → idle
  useEffect(() => {
    const wasSpeaking = prevSpeakingRef.current;
    prevSpeakingRef.current = isSpeaking;

    if (wasSpeaking && !isSpeaking && state === "speaking") {
      setState("idle");
    }
  }, [isSpeaking, state]);

  // Show interim text in bottom-left while listening
  const displayTranscript = lastTranscript || interimText;

  return {
    state: isListening ? "listening" : state,
    lastTranscript: displayTranscript,
    lastResponse,
    sttError,
    stats,
    currentText: words.current,
    visibleWordCount,
    startListening,
    stopListening,
    isListening,
  };
}
