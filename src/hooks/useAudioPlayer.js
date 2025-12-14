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
  const gainNodeRef = useRef(null);

  const cleanupAudioResources = useCallback(() => {
    // Clean up source node
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        // Ignore errors during cleanup
      }
      sourceRef.current = null;
    }

    // Clean up gain node
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch (e) {
        // Ignore errors during cleanup
      }
      gainNodeRef.current = null;
    }

    // Clean up analyser
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {
        // Ignore errors during cleanup
      }
      analyserRef.current = null;
    }

    // Clean up audio element
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        // Remove event listeners
        audioRef.current.onended = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.onloadedmetadata = null;
        audioRef.current.onerror = null;
        audioRef.current.oncanplaythrough = null;
        audioRef.current.src = "";
      } catch (e) {
        // Ignore errors during cleanup
      }
      audioRef.current = null;
    }

    // Clean up object URL
    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch (e) {
        // Ignore errors during cleanup
      }
      objectUrlRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    cleanupAudioResources();
    setIsPlaying(false);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setAudioFile(null);
  }, [cleanupAudioResources]);

  const loadAudio = useCallback(
    async (file) => {
      // Clean up previous audio completely
      cleanup();
      setError(null);

      if (!file) {
        setAudioFile(null);
        return;
      }

      setAudioFile(file);

      try {
        // Create or resume audio context
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            window.webkitAudioContext)();
        }

        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }

        // Create object URL
        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;

        // Create new audio element
        const audio = new Audio();
        audioRef.current = audio;
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";
        audio.src = objectUrl;

        // Set up event handlers
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
          if (!duration && audio.duration && audio.duration !== Infinity) {
            setDuration(audio.duration);
          }
        };

        audio.onloadedmetadata = () => {
          if (audio.duration && audio.duration !== Infinity) {
            setDuration(audio.duration);
          }
        };

        audio.onerror = (e) => {
          console.error("Audio element error:", e);
          setError("Error loading audio file");
          setIsReady(false);
        };

        // Wait for audio to be ready to play
        await new Promise((resolve, reject) => {
          const onCanPlayThrough = () => {
            audio.removeEventListener("canplaythrough", onCanPlayThrough);
            audio.removeEventListener("error", onLoadError);
            resolve();
          };

          const onLoadError = (error) => {
            audio.removeEventListener("canplaythrough", onCanPlayThrough);
            audio.removeEventListener("error", onLoadError);
            reject(new Error(`Failed to load audio: ${error.message}`));
          };

          audio.addEventListener("canplaythrough", onCanPlayThrough);
          audio.addEventListener("error", onLoadError);

          // Trigger loading
          audio.load();

          // Set timeout for loading
          setTimeout(() => {
            if (audio.readyState < 3) {
              reject(new Error("Audio loading timeout"));
            }
          }, 5000); // 5 second timeout
        });

        // Create audio context nodes
        if (audioContextRef.current && audioRef.current) {
          // Clean up existing nodes first
          if (sourceRef.current) {
            try {
              sourceRef.current.disconnect();
            } catch (e) {
              // Ignore
            }
          }

          // Create new source node
          sourceRef.current = audioContextRef.current.createMediaElementSource(
            audioRef.current
          );

          // Create gain node
          gainNodeRef.current = audioContextRef.current.createGain();
          gainNodeRef.current.gain.value = 1.0;

          // Create analyser
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 2048;
          analyserRef.current.smoothingTimeConstant = 0.6;

          // Connect nodes: source -> analyser -> gain -> destination
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(gainNodeRef.current);
          gainNodeRef.current.connect(audioContextRef.current.destination);
        }

        setIsReady(true);
      } catch (error) {
        console.error("Error loading audio:", error);
        cleanupAudioResources();
        setAudioFile(null);
        setError("Could not load audio file. Please try a different file.");
        throw error;
      }
    },
    [cleanup, cleanupAudioResources, duration]
  );

  const play = useCallback(async () => {
    if (!audioRef.current) {
      console.error("No audio element available");
      return;
    }

    if (!isReady) {
      console.error("Audio not ready");
      return;
    }

    try {
      // Resume audio context if needed
      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        await audioContextRef.current.resume();
      }

      // Start playback
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);

      // Check for common play() errors
      if (error.name === "NotAllowedError") {
        setError(
          "Autoplay blocked. Click play again or check browser permissions."
        );
      } else if (error.name === "NotSupportedError") {
        setError("Audio format not supported. Please try a different file.");
      } else {
        setError("Failed to play audio.");
      }

      setIsPlaying(false);
      throw error;
    }
  }, [isReady]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const seek = useCallback(
    (time) => {
      if (audioRef.current && !isNaN(time)) {
        const safeTime = Math.min(Math.max(time, 0), duration || Infinity);

        // Store current playing state
        const wasPlaying = isPlaying;

        // Pause briefly to ensure smooth seek
        if (wasPlaying) {
          audioRef.current.pause();
        }

        // Set the new time
        audioRef.current.currentTime = safeTime;
        setCurrentTime(safeTime);

        // Resume if it was playing
        if (wasPlaying) {
          // Small delay to ensure seek is processed
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play().catch((error) => {
                console.error("Error resuming after seek:", error);
                setIsPlaying(false);
              });
            }
          }, 10);
        }
      }
    },
    [duration, isPlaying]
  );

  const getAnalyser = useCallback((fftSize = 2048, smoothing = 0.6) => {
    if (!audioContextRef.current || !analyserRef.current) {
      return null;
    }

    // Update analyser settings if needed
    if (analyserRef.current.fftSize !== fftSize) {
      analyserRef.current.fftSize = fftSize;
    }

    if (analyserRef.current.smoothingTimeConstant !== smoothing) {
      analyserRef.current.smoothingTimeConstant = smoothing;
    }

    return analyserRef.current;
  }, []);

  const getAudioContext = useCallback(() => {
    return audioContextRef.current;
  }, []);

  useEffect(() => {
    return () => {
      // Clean up everything on unmount
      cleanupAudioResources();
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore errors during cleanup
        }
        audioContextRef.current = null;
      }
    };
  }, [cleanupAudioResources]);

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
    getAudioContext,
    audioContext: audioContextRef.current,
  };
};
