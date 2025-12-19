import { useEffect, useState, useRef } from "react";

export const useMicLevel = () => {
  const [level, setLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    const start = async () => {
      try {
        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        
        streamRef.current = stream;

        // Create AudioContext and resume it
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        // Must resume the AudioContext (it starts in suspended state)
        await audioContext.resume();
        
        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 2048; // Higher for smoother readings
        analyser.smoothingTimeConstant = 0.8; // Smooth the readings
        
        // Connect stream to analyser
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        // Prepare data array
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const tick = () => {
          if (!analyserRef.current) return;
          
          // Get frequency data
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume (more accurate calculation)
          let sum = 0;
          let count = 0;
          
          // Only analyze a portion of frequencies for voice (typically 85-255 Hz for human voice)
          // This gives us a more accurate reading of actual voice volume
          const startFreq = Math.floor(bufferLength * 0.02); // ~85 Hz
          const endFreq = Math.floor(bufferLength * 0.15); // ~1000 Hz
          
          for (let i = startFreq; i < endFreq && i < bufferLength; i++) {
            sum += dataArray[i];
            count++;
          }
          
          const avg = count > 0 ? sum / count : 0;
          
          // Convert to a 0-100 scale for easier use
          const normalizedLevel = Math.min(100, Math.max(0, (avg / 128) * 100));
          
          setLevel(normalizedLevel);
          animationFrameId = requestAnimationFrame(tick);
        };

        tick();
      } catch (err) {
        console.error("Mic level error:", err);
        setLevel(0);
      }
    };

    start();

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
        audioContextRef.current = null;
      }
    };
  }, []);

  return level;
};