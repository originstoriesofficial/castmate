const ASSEMBLYAI_API_KEY = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY as string;

export async function startLiveTranscription(onTranscript: (text: string) => void) {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS && window.webkitSpeechRecognition) {
    console.log("📱 Using webkitSpeechRecognition on iOS Safari");

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
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

  // ✅ All other browsers (Chrome, etc.) use AssemblyAI
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const socket = new WebSocket(
    `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${ASSEMBLYAI_API_KEY}`
  );

  let context: AudioContext;
  let processor: ScriptProcessorNode;
  let source: MediaStreamAudioSourceNode;

  socket.onopen = () => {
    console.log("✅ WebSocket connected to AssemblyAI");

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
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
      buf[l] = Math.min(1, buffer[l]) * 0x7fff;
    }
    return buf.buffer;
  }

  return () => {
    socket.close();
    stream.getTracks().forEach(track => track.stop());
    console.log("🛑 Assembly transcription stopped");
  };
}
