/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const CREAM = '#f5eddd';
const RETRO_RED = '#a13d2d';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

let recognitionInstance: any = null;

function initRecognition(): any {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  if (!recognitionInstance) {
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';
  }
  return recognitionInstance;
}

function waitForCue(cue: string, manualNextRef: React.MutableRefObject<boolean>): Promise<void> {
  return new Promise((resolve) => {
    const recognition = initRecognition();
    if (!recognition) {
      console.warn("Speech recognition not supported.");
      resolve();
      return;
    }

    let resolved = false;
    let running = false;

    const stopAndResolve = () => {
      if (!resolved) {
        resolved = true;
        if (running) recognition.stop();
        cleanup();
        resolve();
      }
    };

    const manualCheckInterval = setInterval(() => {
      if (manualNextRef.current) {
        console.log("Manual override triggered");
        stopAndResolve();
      }
    }, 100);

    const timeout = setTimeout(() => {
      console.warn("Cue not detected within 15 seconds. Auto-continuing.");
      stopAndResolve();
    }, 15000);

    recognition.onstart = () => {
      running = true;
      console.log("🎤 Speech recognition started");
    };

    recognition.onend = () => {
      running = false;
      console.log("🛑 Speech recognition ended");
    };

    recognition.onresult = (event: any) => {
      const transcripts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          transcripts.push(event.results[i][j].transcript.toLowerCase());
        }
      }

      const cleanedCue = cue.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase();
      console.log("🗣️ User said:", transcripts.join(" | "));
      console.log("🎯 Looking for cue:", cleanedCue);

      if (transcripts.some((t) => t.includes(cleanedCue))) {
        console.log("✅ Cue matched — proceeding to next line.");
        stopAndResolve();
      }
    };

    recognition.onerror = (e: any) => {
      console.error("❌ Speech recognition error:", e.error);
    };

    const cleanup = () => {
      clearInterval(manualCheckInterval);
      clearTimeout(timeout);
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("❌ SpeechRecognition failed to start:", err);
      resolve();
    }
  });
}

export default function RehearsePage() {
  const [script, setScript] = useState<any>(null);
  const [character, setCharacter] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const manualNextRef = useRef(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showRestart, setShowRestart] = useState(false);
  const router = useRouter();

  const audioCache = useRef<Map<number, string>>(new Map());
  const generatingAudio = useRef<Set<number>>(new Set());
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  useEffect(() => {
    const data = localStorage.getItem('parsedScript');
    const char = localStorage.getItem('selectedCharacter');
    if (data && char) {
      setScript(JSON.parse(data));
      setCharacter(char);
    }
  }, []);

  const generateAudioForLine = async (lineIndex: number) => {
    if (!script || !character || generatingAudio.current.has(lineIndex) || audioCache.current.has(lineIndex)) {
      return;
    }

    const line = script.lines[lineIndex];
    if (line.character === character) return;

    generatingAudio.current.add(lineIndex);
    try {
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: line.dialog, character: line.character }),
      });

      if (!res.ok) {
        console.error(`Audio generation failed for line ${lineIndex}:`, await res.text());
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioCache.current.set(lineIndex, url);
    } catch (err) {
      console.error(`Audio generation error for line ${lineIndex}:`, err);
    } finally {
      generatingAudio.current.delete(lineIndex);
    }
  };

  const initializeAudioGeneration = async () => {
    if (!script || !character) return;
    let count = 0;
    for (let i = 0; i < script.lines.length && count < 5; i++) {
      if (script.lines[i].character !== character) {
        await generateAudioForLine(i);
        count++;
      }
    }
  };

  const maintainAudioCache = async (currentIndex: number) => {
    if (!script || !character) return;
    let cachedCount = 0;
    for (let i = currentIndex; i < script.lines.length && cachedCount < 5; i++) {
      if (script.lines[i].character !== character) {
        if (!audioCache.current.has(i) && !generatingAudio.current.has(i)) {
          await generateAudioForLine(i);
        }
        cachedCount++;
      }
    }
  };

  useEffect(() => {
    if (script && character) initializeAudioGeneration();
  }, [script, character]);

  useEffect(() => {
    if (script && character && currentLineIndex >= 0) {
      maintainAudioCache(currentLineIndex);
    }
  }, [currentLineIndex, script, character]);

  const playLine = async (idx: number) => {
    if (!script || !character) return;
    const line = script.lines[idx];
  
    // Only play audio for other characters (not the user)
    if (line.character !== character) {
      let audioUrl = audioCache.current.get(idx);
  
      // If not cached, generate and cache it
      if (!audioUrl) {
        try {
          const res = await fetch('/api/generate-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: line.dialog, character: line.character }),
          });
  
          if (!res.ok) {
            console.error(`Audio generation failed for line ${idx}:`, await res.text());
            return;
          }
  
          const blob = await res.blob();
          audioUrl = URL.createObjectURL(blob);
          audioCache.current.set(idx, audioUrl);
        } catch (err) {
          console.error(`Audio generation error for line ${idx}:`, err);
          return;
        }
      }
  
      // Fetch the audio manually to bypass Vercel bot protection
      try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(objectUrl);
  
        await audio.play();
  
        // Optional: revoke URL after playback ends
        audio.onended = () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (err) {
        console.error(`Playback failed for line ${idx}:`, err);
      }
    }
  };
  
  const handlePlay = async () => {
    setShowRestart(false);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((res) => setTimeout(res, 800));
    }
    setCountdown(0);
    await new Promise((res) => setTimeout(res, 600));
    setCountdown(null);
    setPlaying(true);

    for (let i = current; i < script.lines.length; i++) {
      setCurrent(i);
      setCurrentLineIndex(i);
      const line = script.lines[i];
      if (line.character !== character) {
        await playLine(i);
        await new Promise((resolve) => {
          if (!audioRef.current) return resolve(null);
          audioRef.current.onended = () => resolve(null);
        });
      } else {
        setWaitingForUser(true);
        manualNextRef.current = false;
        await waitForCue(line.cue, manualNextRef);
        setWaitingForUser(false);
      }
    }

    setPlaying(false);
    setShowRestart(true);
  };

  const handleManualNext = () => {
    manualNextRef.current = true;
    setWaitingForUser(false);
  };

  const handleRestart = () => {
    audioCache.current.forEach((url) => URL.revokeObjectURL(url));
    audioCache.current.clear();
    generatingAudio.current.clear();
    setCurrentLineIndex(0);
    localStorage.removeItem('parsedScript');
    localStorage.removeItem('selectedCharacter');
    router.push('/upload');
  };

  useEffect(() => {
    return () => {
      audioCache.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  if (!script || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12" style={{ background: CREAM }}>
      <h1 className="text-6xl font-black mb-8 text-center" style={{ color: RETRO_RED, fontFamily: 'serif' }}>
        Rehearse as {character}
      </h1>
      <div className="w-full max-w-4xl bg-[#f5eddd] rounded-2xl shadow-xl border-4 border-[#a13d2d] p-6 mb-8">
        {script.lines.map((line: any, idx: number) => (
          <div
            key={idx}
            className={`p-4 my-2 rounded-xl transition-colors duration-200 ${idx === current ? 'bg-[#a13d2d] text-[#f5eddd]' : 'bg-[#f5eddd] text-[#a13d2d]'} ${line.character === character ? 'font-bold underline' : ''}`}
            style={{ fontFamily: line.character === character ? 'serif' : 'monospace' }}
          >
            <span className="mr-2">{line.character}:</span>
            <span>{line.dialog.replace(/\s*\([^)]*\)\s*$/, '')}</span>
          </div>
        ))}
      </div>
      <button
        onClick={handlePlay}
        disabled={playing}
        className="px-8 py-4 rounded-full font-bold text-lg shadow-md border-2 border-[#a13d2d] bg-[#a13d2d] text-[#f5eddd] hover:bg-[#f5eddd] hover:text-[#a13d2d] transition-colors"
      >
        {playing ? 'Playing...' : 'Play Scene'}
      </button>
      {waitingForUser && (
        <div className="flex flex-col items-center mt-6">
          <div className="text-lg font-mono mb-2" style={{ color: RETRO_RED }}>
            Please say your line and end with the cue word, or click Next to continue.
          </div>
          <button
            onClick={handleManualNext}
            className="px-6 py-2 rounded-full font-bold text-lg border-2 border-[#a13d2d] bg-[#f5eddd] text-[#a13d2d] hover:bg-[#a13d2d] hover:text-[#f5eddd] transition-colors"
          >
            Next
          </button>
        </div>
      )}
      <audio ref={audioRef} />
      {countdown !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="text-8xl font-black text-white drop-shadow-lg animate-pulse">
            {countdown === 0 ? 'Go!' : countdown}
          </div>
        </div>
      )}
      {showRestart && (
        <button
          onClick={handleRestart}
          className="mt-8 px-8 py-4 rounded-full font-bold text-lg shadow-md border-2 border-[#a13d2d] bg-[#a13d2d] text-[#f5eddd] hover:bg-[#f5eddd] hover:text-[#a13d2d] transition-colors"
        >
          Wanna Start Over?
        </button>
      )}
      <div className="mt-4 text-xs opacity-50" style={{ color: RETRO_RED }}>
        Cached: {audioCache.current.size} | Generating: {generatingAudio.current.size} | Current Line: {currentLineIndex}
      </div>
    </div>
  );
}
