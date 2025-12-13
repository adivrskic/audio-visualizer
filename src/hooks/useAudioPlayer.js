import { useState, useRef, useCallback, useEffect } from "react";

export const useAudioPlayer = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const objectUrlRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {}
      sourceRef.current = null;
    }

    setIsPlaying(false);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }, []);

  const loadAudio = useCallback(
    async (file) => {
      cleanup();
      setError(null);

      if (!file) {
        setAudioFile(null);
        return;
      }

      setAudioFile(file);

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            window.webkitAudioContext)();
        }

        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }

        audioRef.current = new Audio();
        audioRef.current.crossOrigin = "anonymous";

        objectUrlRef.current = URL.createObjectURL(file);
        audioRef.current.src = objectUrlRef.current;

        await new Promise((resolve, reject) => {
          audioRef.current.oncanplaythrough = resolve;
          audioRef.current.onerror = (e) =>
            reject(new Error("Failed to load audio file"));
          audioRef.current.load();
        });

        audioRef.current.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        audioRef.current.ontimeupdate = () => {
          setCurrentTime(audioRef.current.currentTime);
          if (!duration && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
        };

        setIsReady(true);
      } catch (error) {
        console.error("Error loading audio:", error);
        cleanup();
        setAudioFile(null);
        setError("Could not load audio file. Please try a different file.");
        throw error;
      }
    },
    [cleanup, duration]
  );

  const play = useCallback(async () => {
    if (!audioRef.current || !isReady) return;

    try {
      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        await audioContextRef.current.resume();
      }
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
      setError("Failed to play audio. Check browser permissions.");
      throw error;
    }
  }, [isReady]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current && !isNaN(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const getAnalyser = useCallback((fftSize = 2048, smoothing = 0.6) => {
    if (!audioContextRef.current || !audioRef.current) {
      return null;
    }

    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = fftSize;
      analyserRef.current.smoothingTimeConstant = smoothing;
      analyserRef.current.connect(audioContextRef.current.destination);
    }

    if (!sourceRef.current) {
      sourceRef.current = audioContextRef.current.createMediaElementSource(
        audioRef.current
      );
      sourceRef.current.connect(analyserRef.current);
    }

    return analyserRef.current;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
    };
  }, [cleanup]);

  return {
    audioFile,
    isPlaying,
    isReady,
    currentTime,
    duration,
    error,
    loadAudio,
    play,
    pause,
    seek,
    cleanup,
    getAnalyser,
    audioContext: audioContextRef.current,
  };
};
