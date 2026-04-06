"use client";

import { useCallback, useRef, useState } from "react";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interimRef = useRef("");
  const hasFinalRef = useRef(false);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    setError(null);
    hasFinalRef.current = false;
    interimRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "id-ID";

    recognition.onstart = () => {
      console.log("[STT] Started listening");
      setIsListening(true);
      setTranscript(null);
      setInterimText("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;

      if (result.isFinal) {
        console.log("[STT] Final transcript:", text);
        hasFinalRef.current = true;
        interimRef.current = "";
        setTranscript(text);
        setInterimText("");
      } else {
        console.log("[STT] Interim:", text);
        interimRef.current = text;
        setInterimText(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);

      const messages: Record<string, string> = {
        "network": "Speech recognition needs a network connection. Make sure you're on HTTPS or localhost.",
        "not-allowed": "Microphone permission denied. Allow mic access in browser settings.",
        "no-speech": "No speech detected. Try again.",
        "audio-capture": "No microphone found. Connect a mic and try again.",
        "aborted": "Speech recognition was aborted.",
        "service-not-allowed": "Speech service not allowed. Use HTTPS or localhost.",
      };

      setError(messages[event.error] || `Speech recognition error: ${event.error}`);
      console.warn("[STT] Error:", event.error);
    };

    recognition.onend = () => {
      // Safari quirk: often never fires isFinal, so promote interim to final
      if (!hasFinalRef.current && interimRef.current) {
        console.log("[STT] Promoting interim to final:", interimRef.current);
        setTranscript(interimRef.current);
        setInterimText("");
        interimRef.current = "";
      }
      setIsListening(false);
      console.log("[STT] Ended");
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setError("Failed to start speech recognition. Check microphone permissions.");
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, transcript, interimText, error, startListening, stopListening };
}
