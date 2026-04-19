const useSpeechDetection = async (onSpeechStart, onSpeechEnd) => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 512;
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);

  let speaking = false;
  let silenceTimer = null;

  function analyze() {
    analyser.getByteFrequencyData(data);
    const volume = data.reduce((a, b) => a + b, 0) / data.length;

    if (volume > 20) {
      // threshold (tune this)
      if (!speaking) {
        speaking = true;
        // onSpeechStart(stream);
        console.log("Speech start");
      }
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        speaking = false;
        // onSpeechEnd();
        console.log("Speech end");
      }, 800); // silence duration
    }

    requestAnimationFrame(analyze);
  }

  analyze();
};

export default useSpeechDetection;
