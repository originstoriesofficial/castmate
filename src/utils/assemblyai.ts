const ASSEMBLYAI_API_KEY = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY as string;

// 🔑 fetch temporary realtime token from AssemblyAI
async function fetchRealtimeToken(): Promise<string> {
  const res = await fetch("https://api.assemblyai.com/v2/realtime/token", {
    method: "POST",
    headers: { authorization: ASSEMBLYAI_API_KEY },
  });
  if (!res.ok) throw new Error("Failed to fetch AssemblyAI token");
  const data = await res.json();
  return data.token;
}

export async function startLiveTranscription(
  onTranscript: (text: string) => void
) {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

  // ✅ fallback: iOS Safari local recognition
  if (isIOS && (window as any).webkitSpeechRecognition) {
    console.log("📱 Using webkitSpeechRecognition on iOS Safari");

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.trim();
      console.log("🗣️ iOS transcript:", transcript);
      onTranscript(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("❌ iOS SpeechRecognition error:", event.error);
    };

    recognition.start();

    return () => {
      recognition.stop();
      console.log("🛑 iOS recognition stopped");
    };
  }

  // ✅ All other browsers → AssemblyAI Realtime
  const token = await fetchRealtimeToken();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const socket = new WebSocket(
    `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
  );

  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let processor: ScriptProcessorNode | null = null;

  socket.onopen = () => {
    console.log("✅ Connected to AssemblyAI Realtime");

    context = new AudioContext({ sampleRate: 16000 });
    source = context.createMediaStreamSource(stream);
    processor = context.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(context.destination);

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const int16Data = convertFloat32ToInt16(input);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(int16Data);
      }
    };
  };

  socket.onmessage = (message) => {
    const res = JSON.parse(message.data);
    if (res.text) {
      console.log("🗣️ Assembly transcript:", res.text);
      onTranscript(res.text);
    }
  };

  socket.onerror = (err) => {
    console.error("❌ WebSocket error:", err);
  };

  socket.onclose = () => {
    console.log("🔌 WebSocket closed");
    if (processor) processor.disconnect();
    if (source) source.disconnect();
    if (context) context.close();
  };

  function convertFloat32ToInt16(buffer: Float32Array) {
    const buf = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      buf[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff;
    }
    return buf.buffer;
  }

  return () => {
    socket.close();
    stream.getTracks().forEach((t) => t.stop());
    console.log("🛑 Assembly transcription stopped");
  };
}
