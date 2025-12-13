import React, { useState, useCallback } from "react";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useWaveform } from "./hooks/useWaveform";
import { useDraggable } from "./hooks/useDraggable";
import { useDeviceDetection } from "./hooks/useDeviceDetection";
import Scene from "./components/scene/Scene";
import WebGLCheck from "./components/scene/WebGLCheck";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import AudioUploader from "./components/ui/AudioUploader";
import WaveSettingsPanel from "./components/ui/WaveSettingsPanel";
import DraggablePanel from "./components/ui/DraggablePanel";
import { defaultPresets } from "./utils/presets";
import "./styles/App.scss";
function App() {
  const deviceType = useDeviceDetection();
  const [showPresets, setShowPresets] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [waveSettings, setWaveSettings] = useState({
    intensity: 0.5,
    speed: 1.0,
    reactivity: 0.7,
    complexity: 0.5,
    maxAmplitude: 1.0,
  });

  const [devSettings, setDevSettings] = useState(() => ({
    ...defaultPresets.base,
    ...(deviceType === "mobile"
      ? defaultPresets.mobile
      : defaultPresets.desktop),
  }));

  const {
    audioFile,
    isPlaying,
    isReady,
    currentTime,
    duration,
    error: audioError,
    loadAudio,
    play,
    pause,
    getAnalyser,
    cleanup: cleanupAudio,
  } = useAudioPlayer();

  const { position, isDragging, containerRef, handleMouseDown, resetPosition } =
    useDraggable({ x: 24, y: 24 });

  const analyser = getAnalyser(devSettings.fftSize, devSettings.smoothing);

  const waveform = useWaveform(analyser, isPlaying, waveSettings);

  React.useEffect(() => {
    setDevSettings((prev) => ({
      ...prev,
      ...(deviceType === "mobile"
        ? defaultPresets.mobile
        : defaultPresets.desktop),
    }));
  }, [deviceType]);

  const handleFileUpload = useCallback(
    async (file) => {
      try {
        await loadAudio(file);
      } catch (error) {
        console.error("Failed to load audio:", error);
      }
    },
    [loadAudio]
  );

  const handleWaveSettingChange = useCallback((key, value) => {
    setWaveSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleErrorRetry = useCallback(() => {
    cleanupAudio();
    resetPosition();
  }, [cleanupAudio, resetPosition]);

  const getPanelHeight = () => {
    if (!audioFile && !showControls && !showPresets) return "98px";
    if (!audioFile && showControls && !showPresets) return "295px";
    if (!audioFile && !showControls && showPresets) return "240px"; // Height for presets
    if (!audioFile && showControls && showPresets) return "437px"; // Both expanded
    if (audioFile && !showControls && !showPresets) return "176px";
    if (audioFile && showControls && !showPresets) return "380px";
    if (audioFile && !showControls && showPresets) return "318px"; // Audio + presets
    if (audioFile && showControls && showPresets) return "522px"; // All expanded
    return "98px";
  };

  const panelHeight = getPanelHeight();
  console.log(showPresets);
  return (
    <WebGLCheck>
      <ErrorBoundary
        onRetry={handleErrorRetry}
        customMessage="The visualization encountered an error. Try uploading a different audio file or adjusting settings."
      >
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
            style={{ opacity: devSettings.noise }}
          />

          <DraggablePanel
            position={position}
            isDragging={isDragging}
            onMouseDown={handleMouseDown}
            panelRef={containerRef}
            isExpanded={showControls}
            onToggleExpand={() => setShowControls(!showControls)}
            onTogglePresets={() => setShowPresets(!showPresets)}
            showPresets={showPresets}
            deviceType={deviceType}
            style={{ height: panelHeight }}
          >
            <div className="panel-content">
              <AudioUploader
                audioFile={audioFile}
                onFileSelect={handleFileUpload}
                onClear={() => handleFileUpload(null)}
                isPlaying={isPlaying}
                isReady={isReady}
                onPlay={play}
                onPause={pause}
                currentTime={currentTime}
                duration={duration}
                showPresets={showPresets}
              />

              <div className="status-indicator">
                <div
                  className={`status-dot ${isPlaying ? "playing" : "idle"}`}
                />
                <span>{isPlaying ? "PLAYING" : "IDLE"}</span>
              </div>

              <WaveSettingsPanel
                waveSettings={waveSettings}
                onSettingsChange={handleWaveSettingChange}
                isExpanded={showControls}
              />
            </div>
          </DraggablePanel>

          {audioError && <div className="audio-error">{audioError}</div>}
        </div>
      </ErrorBoundary>
    </WebGLCheck>
  );
}

export default App;
