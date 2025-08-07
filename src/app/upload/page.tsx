/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const CREAM = '#f5eddd';
const RETRO_RED = '#a13d2d';

const PdfPreview = dynamic(() => import("./PdfPreview"), { ssr: false });

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  // const [numPages, setNumPages] = useState<number>(0);
  const [lines, setLines] = useState<any[]>([]);
  const [characters, setCharacters] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLines([]);
    setCharacters([]);
    setSelectedCharacter(null);
    setError("");
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleParse = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setLines([]);
    setCharacters([]);
    setSelectedCharacter(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/parse-script", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setLines(data.lines || []);
        // Extract unique characters
        const chars = Array.from(new Set((data.lines || []).map((l: any) => l.character))) as string[];
        setCharacters(chars);
      } else {
        setError(data.error || "Failed to parse PDF");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = (char: string) => {
    setSelectedCharacter(char);
    // Store in localStorage for use in rehearsal/voice gen
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCharacter', char);
      localStorage.setItem('parsedScript', JSON.stringify({ lines }));
    }
    router.push("/rehearse");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-16 px-4" style={{ background: CREAM }}>
      <div className="w-full max-w-xl bg-[#f5eddd] border-4 border-[#a13d2d] rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6">
        <h1 className="text-4xl font-black mb-2" style={{ color: RETRO_RED, fontFamily: 'serif' }}>Upload Your Script</h1>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="mb-4 text-lg font-mono border-2 border-[#a13d2d] rounded px-4 py-2 bg-[#f5eddd] text-[#a13d2d] focus:outline-none focus:border-[#a13d2d]"
        />
        {file && (
          <div className="w-full flex flex-col items-center gap-2">
            <div className="border-2 border-[#a13d2d] rounded-xl overflow-hidden bg-white shadow-md w-full max-w-md">
              <PdfPreview file={file} />
            </div>
            <button
              onClick={handleParse}
              disabled={loading}
              className="mt-4 px-8 py-3 rounded-full font-bold text-lg border-2 border-[#a13d2d] bg-[#a13d2d] text-[#f5eddd] hover:bg-[#f5eddd] hover:text-[#a13d2d] transition-colors shadow-md disabled:opacity-60"
            >
              {loading ? "Parsing…" : "Extract Text"}
            </button>
          </div>
        )}
        {lines.length > 0 && (
          <>
            <div className="w-full mt-6 p-4 bg-[#f5eddd] border-2 border-[#a13d2d] rounded-xl font-mono text-[#a13d2d] text-base whitespace-pre-wrap overflow-auto max-h-96 shadow-inner">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th>Character</th>
                    <th>Dialog</th>
                    <th>Emotion</th>
                    <th>Cue</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx}>
                      <td>{line.character}</td>
                      <td>{line.dialog}</td>
                      <td>{line.emotion}</td>
                      <td>{line.cue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {characters.length > 0 && !selectedCharacter && (
              <div className="w-full flex flex-col items-center mt-4">
                <h2 className="text-xl font-bold mb-2" style={{ color: RETRO_RED, fontFamily: 'serif' }}>Choose your character:</h2>
                <div className="flex gap-4 flex-wrap justify-center">
                  {characters.map((char) => (
                    <button
                      key={char}
                      onClick={() => handleSelectCharacter(char)}
                      className="px-6 py-2 rounded-full font-bold text-lg border-2 border-[#a13d2d] bg-[#f5eddd] text-[#a13d2d] hover:bg-[#a13d2d] hover:text-[#f5eddd] transition-colors"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {char}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedCharacter && (
              <div className="w-full flex flex-col items-center mt-4">
                <div className="text-lg font-mono" style={{ color: RETRO_RED }}>
                  You selected: <span className="font-bold">{selectedCharacter}</span>
                </div>
                <div className="text-base mt-2">You can now proceed to rehearse or generate voices for the other characters.</div>
              </div>
            )}
          </>
        )}
        {error && (
          <div className="w-full mt-4 p-3 bg-red-100 border-2 border-red-400 rounded-xl font-mono text-red-700 text-base text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 