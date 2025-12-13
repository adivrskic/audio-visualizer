import React, { useRef, useState } from "react";
import { Upload, X, Play, Loader2 } from "lucide-react";
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
  const [loadingPreset, setLoadingPreset] = useState(null);

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

  const formatTime = (seconds) => {
    if (!seconds || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
          disabled={!isReady}
        >
          <Play size={10} />
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button className="control-btn secondary" onClick={handleClear}>
          <X size={10} />
          Clear
        </button>
      </div>

      {duration > 0 && (
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentTime / duration) * 100}%` }}
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
