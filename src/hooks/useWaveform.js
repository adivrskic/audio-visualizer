import { useState, useRef, useCallback, useEffect } from "react";

export const useWaveform = (analyser, isPlaying, waveSettings) => {
  const [waveform, setWaveform] = useState(Array(100).fill(0));
  const animationRef = useRef(null);

  const updateWaveform = useCallback(() => {
    if (!analyser || !isPlaying) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const newWaveform = [];
    const sampleCount = 100;

    for (let i = 0; i < sampleCount; i++) {
      const start = Math.floor((i / sampleCount) * bufferLength);
      const end = Math.floor(((i + 1) / sampleCount) * bufferLength);

      const lowFreqStart = 0;
      const lowFreqEnd = Math.floor(bufferLength * 0.3);
      const highFreqStart = Math.floor(bufferLength * 0.7);
      const highFreqEnd = bufferLength;

      let lowSum = 0;
      let highSum = 0;
      let totalSum = 0;

      for (let j = start; j < end; j++) {
        const value = dataArray[j];
        totalSum += value;

        if (j >= lowFreqStart && j < lowFreqEnd) {
          lowSum += value;
        } else if (j >= highFreqStart && j < highFreqEnd) {
          highSum += value;
        }
      }

      const avg = totalSum / (end - start);
      const normalized = avg / 256;

      const position = i / sampleCount;
      const bassWeight = 1 - Math.abs(0.5 - position) * 2;
      const trebleWeight = Math.abs(0.5 - position) * 2;

      const lowAvg = lowSum / Math.max(1, lowFreqEnd - lowFreqStart) / 256;
      const highAvg = highSum / Math.max(1, highFreqEnd - highFreqStart) / 256;

      const combined =
        (lowAvg * bassWeight + highAvg * trebleWeight + normalized) / 3;
      const curved = Math.pow(combined, 2 - waveSettings.reactivity);

      // Apply maxAmplitude
      const amplitudeAdjusted = curved * waveSettings.maxAmplitude;
      newWaveform.push(Math.min(amplitudeAdjusted, 1)); // Cap at 1
    }

    setWaveform(newWaveform);
    animationRef.current = requestAnimationFrame(updateWaveform);
  }, [analyser, isPlaying, waveSettings.reactivity, waveSettings.maxAmplitude]);

  useEffect(() => {
    if (isPlaying && analyser) {
      updateWaveform();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (!isPlaying) {
        setWaveform(Array(100).fill(0));
      }
    }
  }, [isPlaying, analyser, updateWaveform]);

  return waveform;
};
