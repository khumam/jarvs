"use client";

import { useCallback, useRef, useState } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    // Find an Indonesian voice
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(voice => voice.lang === 'id-ID' || voice.lang === 'id_ID');
    console.log({voices});
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }
    utterance.lang = "id-ID";

    const words = text.split(" ");
    wordsRef.current = words;
    setVisibleWordCount(0);

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIndex = event.charIndex;
        const spokenText = text.substring(0, charIndex);
        const wordCount = spokenText.split(" ").filter(Boolean).length;
        setVisibleWordCount(wordCount);
      }
    };

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setVisibleWordCount(words.length);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVisibleWordCount(0);
  }, []);

  return { speak, cancel, isSpeaking, visibleWordCount, words: wordsRef };
}
