import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Scene from "./components/Scene";
import WebGLCheck from "./components/WebGLCheck";
import "./App.css";
import {
  Upload,
  Play,
  Pause,
  Music,
  X,
  Waves,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveform, setWaveform] = useState(Array(100).fill(0));
  const [isReady, setIsReady] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Draggable UI state
  const [uiPosition, setUiPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const uiRef = useRef(null);

  // Device detection state
  const [deviceType, setDeviceType] = useState("desktop");

  // Wave control settings
  const [waveSettings, setWaveSettings] = useState({
    intensity: 0.5,
    speed: 1.0,
    reactivity: 0.7,
    complexity: 0.5,
  });

  // Memoized presets to prevent recreation on every render
  const desktopPreset = useMemo(
    () => ({
      mainPositionX: -5.2,
      mainPositionY: 1.2,
      mainPositionZ: -2.7,
      mainRotationX: 9.3,
      mainRotationY: 19,
      mainRotationZ: 12.7,
      mainScale: 1.4,
      mirrorPositionX: -5.9,
      mirrorPositionY: -0.5,
      mirrorPositionZ: -2.7,
      mirrorRotationX: 9.3,
      mirrorRotationY: 19,
      mirrorRotationZ: 12.7,
      mirrorScale: 1.4,
      cameraX: 5.7,
      cameraY: 5,
      cameraZ: 5,
      cameraFOV: 60,
    }),
    []
  );

  const mobilePreset = useMemo(
    () => ({
      mainPositionX: -0.5,
      mainPositionY: 0.8,
      mainPositionZ: -0.5,
      mainRotationX: 5.3,
      mainRotationY: 12,
      mainRotationZ: 8.7,
      mainScale: 1.0,
      mirrorPositionX: -0.2,
      mirrorPositionY: 0.4,
      mirrorPositionZ: -0.6,
      mirrorRotationX: 5.3,
      mirrorRotationY: 12,
      mirrorRotationZ: 8.7,
      mirrorScale: 1.0,
      cameraX: 3.7,
      cameraY: 3,
      cameraZ: 3,
      cameraFOV: 75,
    }),
    []
  );

  // Default settings
  const defaultSettings = useMemo(
    () => ({
      devSettings: {
        horizontalLines: 50,
        verticalLines: 90,
        spacing: 0.1,
        baseHeightScale: 3.5,
        centerFalloff: 0.25,
        bassCenterFactor: 1.2,
        highEdgeFactor: 2,
        wavePropagationSpeed: 2,
        rippleFrequency: 4.5,
        rippleSpeed: 4.8,
        organicXFrequency: 3,
        organicZFrequency: 2.5,
        organicXSpeed: 2.5,
        organicZSpeed: 1.2,
        mainColor: "#e7f775",
        glowIntensity: 0.25,
        glowEnabled: true,
        cameraX: 5.7,
        cameraY: 5,
        cameraZ: 5,
        cameraRotationX: -0.6,
        cameraRotationY: 0.785,
        cameraRotationZ: 0,
        cameraFOV: 60,
        mainPositionX: -5.2,
        mainPositionY: 1.2,
        mainPositionZ: -2.7,
        mainRotationX: 9.3,
        mainRotationY: 19,
        mainRotationZ: 12.7,
        mainScale: 1.4,
        mirrorPositionX: -5.9,
        mirrorPositionY: -0.5,
        mirrorPositionZ: -2.7,
        mirrorRotationX: 9.3,
        mirrorRotationY: 19,
        mirrorRotationZ: 12.7,
        mirrorOpacity: 0.1,
        mirrorBlur: 0,
        mirrorScale: 1.4,
        bloomIntensity: 2,
        bloomThreshold: 0.67,
        bloomSmoothing: 0,
        vignette: 1,
        noise: 0.75,
        smoothing: 0.6,
        fftSize: 2048,
      },
    }),
    []
  );

  // Dev panel settings with default values
  const [devSettings, setDevSettings] = useState(defaultSettings.devSettings);

  // Detect device type on mount
  useEffect(() => {
    const detectDeviceType = () => {
      const isMobile =
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;
      return isMobile ? "mobile" : "desktop";
    };

    const detectedType = detectDeviceType();
    setDeviceType(detectedType);

    // Apply appropriate preset based on device
    if (detectedType === "mobile") {
      setDevSettings((prev) => ({
        ...prev,
        ...mobilePreset,
      }));
    } else {
      setDevSettings((prev) => ({
        ...prev,
        ...desktopPreset,
      }));
    }

    // Listen for window resize to update device type
    const handleResize = () => {
      const newType = detectDeviceType();
      if (newType !== deviceType) {
        setDeviceType(newType);
        if (newType === "mobile") {
          setDevSettings((prev) => ({
            ...prev,
            ...mobilePreset,
          }));
        } else {
          setDevSettings((prev) => ({
            ...prev,
            ...desktopPreset,
          }));
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [deviceType, desktopPreset, mobilePreset]);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);

  // Draggable UI Handlers
  const handleMouseDown = useCallback(
    (e) => {
      if (
        !e.target.closest(".panel-header") ||
        e.target.closest(".panel-minimize") ||
        e.target.closest(".upload-button") ||
        e.target.closest(".control-btn") ||
        e.target.closest('input[type="range"]')
      ) {
        return;
      }

      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - uiPosition.x,
        y: e.clientY - uiPosition.y,
      };
      e.preventDefault();
      e.stopPropagation();
    },
    [uiPosition]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      const maxX = window.innerWidth - (uiRef.current?.offsetWidth || 220);
      const maxY = window.innerHeight - (uiRef.current?.offsetHeight || 300);

      setUiPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
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
    setWaveform(Array(100).fill(0));
  }, []);

  const handleFileUpload = async (file) => {
    cleanup();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

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

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = devSettings.fftSize;
        analyserRef.current.smoothingTimeConstant = devSettings.smoothing;
        analyserRef.current.connect(audioContextRef.current.destination);
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
      };

      sourceRef.current = audioContextRef.current.createMediaElementSource(
        audioRef.current
      );
      sourceRef.current.connect(analyserRef.current);

      setIsReady(true);
    } catch (error) {
      console.error("Error loading audio:", error);
      cleanup();
      setAudioFile(null);
      alert("Could not load audio file. Please try a different file.");
    }
  };

  const updateWaveform = useCallback(() => {
    if (analyserRef.current && isPlaying) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

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
        const bassWeight =
          devSettings.bassCenterFactor * (1 - Math.abs(0.5 - position) * 2);
        const trebleWeight =
          devSettings.highEdgeFactor * Math.abs(0.5 - position) * 2;

        const lowAvg = lowSum / Math.max(1, lowFreqEnd - lowFreqStart) / 256;
        const highAvg =
          highSum / Math.max(1, highFreqEnd - highFreqStart) / 256;

        const combined =
          (lowAvg * bassWeight + highAvg * trebleWeight + normalized) / 3;

        const curved = Math.pow(combined, 2 - waveSettings.reactivity);
        newWaveform.push(curved);
      }

      setWaveform(newWaveform);
      animationRef.current = requestAnimationFrame(updateWaveform);
    }
  }, [isPlaying, waveSettings.reactivity, devSettings]);

  const handlePlay = async () => {
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
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setWaveform(Array(100).fill(0));
  };

  useEffect(() => {
    if (isPlaying) {
      updateWaveform();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [isPlaying, updateWaveform]);

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

  const formatTime = (seconds) => {
    if (!seconds || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileName = (name) => {
    if (name.length > 18) return name.substring(0, 15) + "...";
    return name;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      timeUpdateIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          if (!duration && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
        }
      }, 100);
    } else {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [isPlaying, duration]);

  return (
    <WebGLCheck>
      <div className="app">
        <div className="noise-bg"></div>
        <div className="canvas-container">
          <Scene
            waveform={waveform}
            isPlaying={isPlaying}
            waveSettings={waveSettings}
            devSettings={devSettings}
          />
        </div>

        <div
          className="film-grain-overlay"
          style={{
            opacity: devSettings.noise,
          }}
        />

        {/* Fixed-size draggable UI panel */}
        <div
          ref={uiRef}
          className={`ui-panel ${showControls ? "expanded" : ""} ${
            isDragging ? "dragging" : ""
          }`}
          style={{
            left: `${uiPosition.x}px`,
            top: `${uiPosition.y}px`,
            height:
              audioFile && showControls
                ? "340px"
                : audioFile && !showControls
                ? "176px"
                : !audioFile && showControls
                ? "255px"
                : "98px",
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Drag handle - entire top bar */}
          <div className="panel-header">
            <div className="drag-handle">
              <Waves size={14} />
              <span>WAVE</span>
              <span className="device-tag">{deviceType}</span>
            </div>
            <button
              className="panel-minimize"
              onClick={() => setShowControls(!showControls)}
            >
              {showControls ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
          </div>

          {/* Panel content with fixed container */}
          <div className="panel-content">
            {!audioFile ? (
              <button
                className="upload-button"
                onClick={() => fileInputRef.current.click()}
              >
                <Upload size={12} />
                <span>Upload Audio</span>
              </button>
            ) : (
              <>
                <div className="file-info">
                  <Music size={10} />
                  <span>{formatFileName(audioFile.name)}</span>
                  <span className="file-size">
                    {formatFileSize(audioFile.size)}
                  </span>
                </div>

                <div className="controls">
                  <button
                    className={`control-btn ${isPlaying ? "active" : ""}`}
                    onClick={isPlaying ? handlePause : handlePlay}
                    disabled={!isReady}
                  >
                    {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                    <span>{isPlaying ? "Pause" : "Play"}</span>
                  </button>

                  <button
                    className="control-btn"
                    onClick={() => handleFileUpload(null)}
                  >
                    <X size={10} />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="status">
                  <div className={`status-dot ${isPlaying ? "active" : ""}`} />
                  <span>{isPlaying ? "PLAYING" : "IDLE"}</span>
                  {duration > 0 && (
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(currentTime / duration) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="time-display">
                        <span>{formatTime(currentTime)}</span>
                        <span>/</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Control Panel - Fixed height, scrollable */}
            <div className={`control-section ${showControls ? "open" : ""}`}>
              <div className="control-section-content">
                <div className="control-item">
                  <label>
                    <span>Intensity</span>
                    <span className="control-value">
                      {Math.round(waveSettings.intensity * 100)}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={waveSettings.intensity}
                    onChange={(e) =>
                      setWaveSettings((s) => ({
                        ...s,
                        intensity: parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="control-item">
                  <label>
                    <span>Speed</span>
                    <span className="control-value">
                      {waveSettings.speed.toFixed(1)}x
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="2"
                    step="0.1"
                    value={waveSettings.speed}
                    onChange={(e) =>
                      setWaveSettings((s) => ({
                        ...s,
                        speed: parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="control-item">
                  <label>
                    <span>Reactivity</span>
                    <span className="control-value">
                      {Math.round(waveSettings.reactivity * 100)}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={waveSettings.reactivity}
                    onChange={(e) =>
                      setWaveSettings((s) => ({
                        ...s,
                        reactivity: parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="control-item">
                  <label>
                    <span>Complexity</span>
                    <span className="control-value">
                      {Math.round(waveSettings.complexity * 100)}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={waveSettings.complexity}
                    onChange={(e) =>
                      setWaveSettings((s) => ({
                        ...s,
                        complexity: parseFloat(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
        </div>
      </div>
    </WebGLCheck>
  );
}

export default App;
