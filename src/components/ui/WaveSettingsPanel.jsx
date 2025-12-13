import React from "react";

const WaveSettingsPanel = ({ waveSettings, onSettingsChange, isExpanded }) => {
  const settings = [
    {
      key: "intensity",
      label: "Intensity",
      min: 0.1,
      max: 1,
      step: 0.05,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      key: "speed",
      label: "Speed",
      min: 0.2,
      max: 2,
      step: 0.1,
      format: (value) => `${value.toFixed(1)}x`,
    },
    {
      key: "reactivity",
      label: "Reactivity",
      min: 0.1,
      max: 1,
      step: 0.05,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      key: "complexity",
      label: "Complexity",
      min: 0,
      max: 1,
      step: 0.05,
      format: (value) => `${Math.round(value * 100)}%`,
    },
    {
      key: "maxAmplitude",
      label: "Max Amplitude",
      min: 0.1,
      max: 3,
      step: 0.1,
      format: (value) => `${value.toFixed(1)}x`,
    },
  ];

  return (
    <div className={`wave-settings-panel ${isExpanded ? "expanded" : ""}`}>
      <div className="settings-content">
        {settings.map((setting) => (
          <div key={setting.key} className="setting-item">
            <div className="setting-label">
              <span>{setting.label}</span>
              <span className="setting-value">
                {setting.format(waveSettings[setting.key])}
              </span>
            </div>
            <input
              type="range"
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={waveSettings[setting.key]}
              onChange={(e) =>
                onSettingsChange(setting.key, parseFloat(e.target.value))
              }
              className="setting-slider"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaveSettingsPanel;
