import { useEffect, useState, useRef } from "react";

export const useMicLevel2 = (videoStream) => {
  const [level, setLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const mountedRef = useRef(true);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (err) {
          // Ignore disconnect errors
        }
        sourceRef.current = null;
      }

      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (err) {
          // Ignore disconnect errors
        }
        analyserRef.current = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {
          // Ignore close errors
        });
        audioContextRef.current = null;
      }
    };

    // If no stream provided or no audio tracks, clean up and set level to 0
    if (!videoStream) {
      if (mountedRef.current) setLevel(0);
      cleanup();
      return;
    }

    // Check if stream has audio tracks
    const audioTracks = videoStream.getAudioTracks();
    const hasAudio = audioTracks.length > 0 && 
                     audioTracks.some(track => track.enabled && track.readyState === 'live');

    if (!hasAudio) {
      if (mountedRef.current) setLevel(0);
      cleanup();
      return;
    }

    // Initialize audio analysis
    const initAudioAnalysis = async () => {
      try {
        // Create AudioContext
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error("AudioContext not supported in this browser");
        }

        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        // Resume audio context (required for Chrome autoplay policy)
        await audioContext.resume();

        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        
        // Configure analyser
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        analyser.minDecibels = -85;
        analyser.maxDecibels = -10;

        // Connect stream to analyser
        const source = audioContext.createMediaStreamSource(videoStream);
        sourceRef.current = source;
        source.connect(analyser);

        // Prepare data array
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!mountedRef.current || !analyserRef.current) return;

          // Get frequency data
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume for voice frequencies
          let sum = 0;
          let count = 0;
          
          // Focus on human voice frequencies (approximately 85Hz - 1000Hz)
          const startFreq = Math.floor(bufferLength * 0.02); // ~85 Hz
          const endFreq = Math.floor(bufferLength * 0.15); // ~1000 Hz
          
          for (let i = startFreq; i < endFreq && i < bufferLength; i++) {
            sum += dataArray[i];
            count++;
          }
          
          const avg = count > 0 ? sum / count : 0;
          
          // Convert to 0-100 scale (0-128 is the uint8 range for FFT data)
          const normalizedLevel = Math.min(100, Math.max(0, (avg / 128) * 100));
          
          // Optional: Apply threshold to filter out background noise
          const threshold = 5;
          const displayLevel = normalizedLevel > threshold ? normalizedLevel : 0;
          
          if (mountedRef.current) {
            setLevel(displayLevel);
          }
          
          // Schedule next update if still mounted
          if (mountedRef.current && analyserRef.current) {
            animationFrameIdRef.current = requestAnimationFrame(updateLevel);
          }
        };

        // Start the update loop
        updateLevel();

      } catch (err) {
        console.error("Error initializing audio analysis:", err);
        if (mountedRef.current) {
          setLevel(0);
        }
        cleanup();
      }
    };

    initAudioAnalysis();

    // Handle stream track ending events
    const handleTrackEnd = () => {
      if (mountedRef.current) {
        setLevel(0);
      }
      cleanup();
    };

    // Add event listeners for track ending
    audioTracks.forEach(track => {
      track.addEventListener('ended', handleTrackEnd);
      track.addEventListener('mute', () => {
        if (mountedRef.current) setLevel(0);
      });
      track.addEventListener('unmute', () => {
        // Audio analysis will resume on next animation frame
      });
    });

    // Cleanup function
    return () => {
      // Remove event listeners
      audioTracks.forEach(track => {
        track.removeEventListener('ended', handleTrackEnd);
        track.removeEventListener('mute', () => {});
        track.removeEventListener('unmute', () => {});
      });
      
      if (mountedRef.current) {
        setLevel(0);
      }
      cleanup();
    };
  }, [videoStream]);

  return level;
};