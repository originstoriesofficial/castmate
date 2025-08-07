/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CREAM = '#f5eddd';
const RETRO_RED = '#a13d2d';

export default function ScriptPage() {
  const [script, setScript] = useState<any>(null);
  const [characters, setCharacters] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('parsedScript');
    if (data) {
      const parsed = JSON.parse(data);
      setScript(parsed);
      const chars = Array.from(new Set(parsed.lines.map((l: any) => l.character))) as string[];
      setCharacters(chars);
    }
  }, []);

  const handleSelect = (char: string) => {
    localStorage.setItem('selectedCharacter', char);
    router.push('/rehearse');
  };

  if (!script) return <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}><span>Loading...</span></div>;

  return (
    <div className="min-h-screen flex flex-col items-center py-12" style={{ background: CREAM }}>
      <h1 className="text-6xl font-black mb-8 text-center" style={{ color: RETRO_RED, fontFamily: 'serif' }}>
        Parsed Script
      </h1>
      <div className="mb-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: RETRO_RED, fontFamily: 'serif' }}>Choose your character:</h2>
        <div className="flex gap-4 flex-wrap justify-center">
          {characters.map((char) => (
            <button
              key={char}
              onClick={() => handleSelect(char)}
              className="px-6 py-2 rounded-full font-bold text-lg border-2 border-[#a13d2d] bg-[#f5eddd] text-[#a13d2d] hover:bg-[#a13d2d] hover:text-[#f5eddd] transition-colors"
              style={{ fontFamily: 'monospace' }}
            >
              {char}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full max-w-4xl bg-[#f5eddd] rounded-2xl shadow-xl border-4 border-[#a13d2d] p-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr style={{ color: RETRO_RED, fontFamily: 'serif' }}>
              <th className="py-2 px-2">Character</th>
              <th className="py-2 px-2">Dialog</th>
              <th className="py-2 px-2">Emotion</th>
              <th className="py-2 px-2">Cue</th>
            </tr>
          </thead>
          <tbody>
            {script.lines.map((line: any, idx: number) => (
              <tr key={idx} className="border-b border-[#a13d2d] last:border-b-0">
                <td className="py-2 px-2 font-bold" style={{ color: RETRO_RED, fontFamily: 'serif' }}>{line.character}</td>
                <td className="py-2 px-2" style={{ color: RETRO_RED, fontFamily: 'monospace' }}>{line.dialog}</td>
                <td className="py-2 px-2" style={{ color: RETRO_RED, fontFamily: 'monospace' }}>{line.emotion}</td>
                <td className="py-2 px-2" style={{ color: RETRO_RED, fontFamily: 'monospace' }}>{line.cue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 