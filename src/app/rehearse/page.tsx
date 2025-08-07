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

// Improved: Wait for user to say the cue word or click Next
function waitForCue(cue: string, manualNextRef: React.MutableRefObject<boolean>): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !(window.SpeechRecognition || window.webkitSpeechRecognition)) {
      resolve();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let isRunning = false;
    let cueDetected = false;

    const startRecognition = () => {
      if (manualNextRef.current) {
        if (isRunning) recognition.stop();
        return;
      }
      if (!isRunning) {
        recognition.start();
        isRunning = true;
      }
    };

    recognition.onresult = (event: any) => {
      let allTranscripts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          allTranscripts.push(event.results[i][j].transcript.toLowerCase());
        }
      }
      if (allTranscripts.some(t => t.includes(cue.toLowerCase()))) {
        cueDetected = true;
        if (isRunning) recognition.stop();
      } else {
        if (isRunning) recognition.stop();
        // onend will trigger and call startRecognition again
      }
    };
    recognition.onerror = (e: any) => {
      if (isRunning) recognition.stop();
      // onend will trigger and call startRecognition again
    };
    recognition.onend = () => {
      isRunning = false;
      if (cueDetected || manualNextRef.current) {
        resolve();
      } else {
        setTimeout(() => {
          startRecognition();
        }, 200); // Small delay before restarting
      }
    };

    startRecognition();
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

  useEffect(() => {
    const data = localStorage.getItem('parsedScript');
    const char = localStorage.getItem('selectedCharacter');
    if (data && char) {
      setScript(JSON.parse(data));
      setCharacter(char);
    }
  }, []);

  const playLine = async (idx: number) => {
    if (!script || !character) return;
    const line = script.lines[idx];
    if (line.character !== character) {
      try {
        const res = await fetch('/api/generate-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: line.dialog, character: line.character }),
        });
        if (!res.ok) {
          console.error("Audio generation failed for line:", idx, await res.text());
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) audioRef.current.src = url;
        await audioRef.current?.play();
      } catch (err) {
        console.error("Audio fetch/play error:", err);
      }
    }
  };

  const handlePlay = async () => {
    setShowRestart(false);
    // Countdown before starting
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((res) => setTimeout(res, 800));
    }
    setCountdown(0); // Show 'Go!'
    await new Promise((res) => setTimeout(res, 600));
    setCountdown(null);
    setPlaying(true);
    for (let i = current; i < script.lines.length; i++) {
      setCurrent(i);
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
    // Clear localStorage and redirect to upload page
    localStorage.removeItem('parsedScript');
    localStorage.removeItem('selectedCharacter');
    router.push('/upload');
  };

  if (!script || !character) return <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}><span>Loading...</span></div>;

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
            <span>{line.dialog}</span>
            <span className="ml-2 italic">{line.emotion && `(${line.emotion})`}</span>
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
    </div>
  );
} 