const ASSEMBLYAI_API_KEY = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY as string;

export async function startLiveTranscription(onTranscript: (text: string) => void) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // ✅ iOS Safari fallback to native webkitSpeechRecognition
  if (isIOS && typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        console.log("🗣️ You said (iOS):", finalTranscript);
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (err: any) => {
      console.error("❌ iOS SpeechRecognition error:", err);
    };

    recognition.start();

    return () => recognition.stop();
  }

  // ✅ Non-iOS: Use AssemblyAI real-time WebSocket
  const socket = new WebSocket(
    `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000`,
    []
  );

  let context: AudioContext;
  let processor: ScriptProcessorNode;
  let source: MediaStreamAudioSourceNode;

  socket.onopen = async () => {
    console.log("✅ WebSocket connected to AssemblyAI");

    context = new AudioContext({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      console.log("🗣️ You said:", res.text);
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
  };
}
