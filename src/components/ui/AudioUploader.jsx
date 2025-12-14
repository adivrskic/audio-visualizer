import React, { useRef, useState, useEffect, useCallback } from "react";
import { Upload, X, Play, Pause, Loader2 } from "lucide-react";
import {
  formatFileName,
  formatFileSize,
  fetchPresetAudio,
} from "../../utils/audioUtils";
import { presetSongs, getGenreIcon } from "../../utils/presetSongs";

const AudioUploader = ({
  audioFile,
  onFileSelect,
  onClear,
  isPlaying,
  isReady,
  onPlay,
  onPause,
  currentTime,
  duration,
  showPresets,
}) => {
  const fileInputRef = useRef(null);
  const progressBarRef = useRef(null);
  const knobRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState(null);
  const [showKnob, setShowKnob] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [wasPlayingBeforeDrag, setWasPlayingBeforeDrag] = useState(false);
  const [draggedTime, setDraggedTime] = useState(0);

  // Update progress display
  const updateProgress = useCallback((percentage) => {
    if (knobRef.current) {
      knobRef.current.style.left = `${percentage}%`;
    }
  }, []);
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear();
    setLoadingPreset(null);
  };

  const formatTime = useCallback((seconds) => {
    if (!seconds || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handlePresetSelect = async (song) => {
    setLoadingPreset(song.id);
    try {
      const file = await fetchPresetAudio(song.filename);
      onFileSelect(file);
    } catch (error) {
      console.error("Failed to load preset:", error);
    } finally {
      setLoadingPreset(null);
    }
  };

  // Calculate position based on time
  const calculatePosition = useCallback(
    (time) => {
      if (!duration || duration === 0) return 0;
      return Math.min(Math.max((time / duration) * 100, 0), 100);
    },
    [duration]
  );

  // Calculate time based on position
  const calculateTime = useCallback(
    (position) => {
      if (!duration || duration === 0) return 0;
      return (position / 100) * duration;
    },
    [duration]
  );

  // Handle knob drag start
  const handleKnobMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Store playback state and pause if playing
      setWasPlayingBeforeDrag(isPlaying);
      if (isPlaying) {
        onPause();
      }

      setIsDragging(true);
      setShowKnob(true);

      const handleMouseMove = (moveEvent) => {
        if (!progressBarRef.current || !duration) return;

        const progressRect = progressBarRef.current.getBoundingClientRect();
        const x = moveEvent.clientX - progressRect.left;
        const percentage = Math.min(
          Math.max((x / progressRect.width) * 100, 0),
          100
        );
        const newTime = calculateTime(percentage);

        // Update the progress bar
        updateProgress(percentage);
        setDraggedTime(newTime);

        // Dispatch custom event for seeking during drag
        const seekEvent = new CustomEvent("audioSeek", {
          detail: { time: newTime, shouldPlay: false },
        });
        window.dispatchEvent(seekEvent);
      };

      const handleMouseUp = () => {
        setIsDragging(false);

        // Resume playback if it was playing before drag
        if (wasPlayingBeforeDrag && draggedTime > 0) {
          // Small delay to ensure seek has been processed
          setTimeout(() => {
            onPlay();
          }, 50);
        } else if (draggedTime > 0) {
          // If wasn't playing, just seek to the position
          const seekEvent = new CustomEvent("audioSeek", {
            detail: { time: draggedTime, shouldPlay: false },
          });
          window.dispatchEvent(seekEvent);
        }

        setWasPlayingBeforeDrag(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("mouseleave", handleMouseUp);

        // Hide knob after drag ends
        setTimeout(() => {
          if (!isHovering) {
            setShowKnob(false);
          }
        }, 1000);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mouseleave", handleMouseUp);

      // Initial click also sets position
      handleMouseMove(e);
    },
    [
      isPlaying,
      onPause,
      onPlay,
      calculateTime,
      duration,
      wasPlayingBeforeDrag,
      draggedTime,
      isHovering,
      updateProgress,
    ]
  );

  // Handle progress bar click (jump to position)
  const handleProgressBarClick = useCallback(
    (e) => {
      if (!progressBarRef.current || !duration || isDragging) return;

      const progressRect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - progressRect.left;
      const percentage = Math.min(
        Math.max((x / progressRect.width) * 100, 0),
        100
      );
      const newTime = calculateTime(percentage);

      updateProgress(percentage);

      // Dispatch custom event for seeking
      const seekEvent = new CustomEvent("audioSeek", {
        detail: { time: newTime, shouldPlay: isPlaying },
      });
      window.dispatchEvent(seekEvent);
    },
    [duration, isDragging, calculateTime, isPlaying, updateProgress]
  );

  // Update knob position when currentTime changes (but not when dragging)
  useEffect(() => {
    if (!isDragging && duration > 0) {
      const percentage = calculatePosition(currentTime);
      updateProgress(percentage);
    }
  }, [currentTime, duration, isDragging, calculatePosition, updateProgress]);

  // Handle hover state for knob
  const handleProgressBarMouseEnter = useCallback(() => {
    setIsHovering(true);
    setShowKnob(true);
  }, []);

  const handleProgressBarMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (!isDragging) {
      setShowKnob(false);
    }
  }, [isDragging]);

  // Add touch support for mobile
  const handleTouchStart = useCallback(
    (e) => {
      e.preventDefault();

      // Store playback state and pause if playing
      setWasPlayingBeforeDrag(isPlaying);
      if (isPlaying) {
        onPause();
      }

      setIsDragging(true);
      setShowKnob(true);

      const touch = e.touches[0];
      const progressRect = progressBarRef.current.getBoundingClientRect();
      const x = touch.clientX - progressRect.left;
      const percentage = Math.min(
        Math.max((x / progressRect.width) * 100, 0),
        100
      );
      const newTime = calculateTime(percentage);

      updateProgress(percentage);
      setDraggedTime(newTime);

      const seekEvent = new CustomEvent("audioSeek", {
        detail: { time: newTime, shouldPlay: false },
      });
      window.dispatchEvent(seekEvent);
    },
    [isPlaying, onPause, calculateTime, updateProgress]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (!progressBarRef.current || !duration) return;

      const touch = e.touches[0];
      const progressRect = progressBarRef.current.getBoundingClientRect();
      const x = touch.clientX - progressRect.left;
      const percentage = Math.min(
        Math.max((x / progressRect.width) * 100, 0),
        100
      );
      const newTime = calculateTime(percentage);

      updateProgress(percentage);
      setDraggedTime(newTime);

      const seekEvent = new CustomEvent("audioSeek", {
        detail: { time: newTime, shouldPlay: false },
      });
      window.dispatchEvent(seekEvent);
    },
    [duration, calculateTime, updateProgress]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    // Resume playback if it was playing before drag
    if (wasPlayingBeforeDrag && draggedTime > 0) {
      setTimeout(() => {
        onPlay();
      }, 50);
    } else if (draggedTime > 0) {
      const seekEvent = new CustomEvent("audioSeek", {
        detail: { time: draggedTime, shouldPlay: false },
      });
      window.dispatchEvent(seekEvent);
    }

    setWasPlayingBeforeDrag(false);
    if (!isHovering) {
      setShowKnob(false);
    }
  }, [wasPlayingBeforeDrag, draggedTime, onPlay, isHovering]);

  // Add effect to pause audio when dragging starts
  useEffect(() => {
    if (isDragging && isPlaying) {
      onPause();
    }
  }, [isDragging, isPlaying, onPause]);

  console.log("show: ", showPresets);

  if (!audioFile) {
    return (
      <div className="upload-section">
        <button
          className="upload-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={12} />
          <span>Upload Audio</span>
        </button>

        {showPresets && (
          <div className="preset-songs">
            <div className="preset-header">
              <span className="preset-title">BUILT-IN TRACKS</span>
            </div>
            <div className="preset-grid">
              {presetSongs.map((song) => (
                <button
                  key={song.id}
                  className={`preset-song-btn ${
                    loadingPreset === song.id ? "loading" : ""
                  }`}
                  onClick={() => handlePresetSelect(song)}
                  disabled={loadingPreset !== null}
                >
                  {loadingPreset === song.id ? (
                    <Loader2 size={12} className="spin" />
                  ) : (
                    <span className="genre-icon">
                      {getGenreIcon(song.genre)}
                    </span>
                  )}
                  <div className="song-info">
                    <span className="song-name">{song.name}</span>
                    <span className="song-details">
                      {song.genre} • {song.duration}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    );
  }

  const percentage = calculatePosition(currentTime);

  return (
    <div className="audio-info">
      <div className="file-details">
        <div className="file-name">{formatFileName(audioFile.name)}</div>
        <div className="file-size">{formatFileSize(audioFile.size)}</div>
      </div>

      <div className="audio-controls">
        <button
          className={`control-btn primary ${isPlaying ? "active" : ""}`}
          onClick={isPlaying ? onPause : onPlay}
          disabled={!isReady || !audioFile}
        >
          {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button className="control-btn secondary" onClick={handleClear}>
          <X size={10} />
          Clear
        </button>
      </div>

      {duration > 0 && (
        <div
          className="progress-section"
          onMouseEnter={handleProgressBarMouseEnter}
          onMouseLeave={handleProgressBarMouseLeave}
        >
          <div
            className="progress-bar"
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="progress-fill"
              style={{ width: `${percentage}%` }}
            />
            <div
              ref={knobRef}
              className={`progress-knob ${
                showKnob || isDragging ? "visible" : ""
              } ${isDragging ? "dragging" : ""}`}
              style={{ left: `${percentage}%` }}
              onMouseDown={handleKnobMouseDown}
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
  );
};

export default AudioUploader;
