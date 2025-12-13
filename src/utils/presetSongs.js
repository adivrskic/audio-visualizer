import { AudioLines, AudioWaveform, Disc2 } from "lucide-react";

export const presetSongs = [
  {
    id: "ambient",
    name: "Ambient Drift",
    filename: "ambient_drift.mp3",
    genre: "ambient",
    description: "Atmospheric synth textures",
    duration: "3:45",
  },
  {
    id: "techno",
    name: "Neon Grid",
    filename: "neon_grid.mp3",
    genre: "techno",
    description: "Pulsing electronic beat",
    duration: "4:20",
  },
  {
    id: "drum",
    name: "Circuit Pulse",
    filename: "circuit_pulse.mp3",
    genre: "drum & bass",
    description: "Rapid-fire rhythm",
    duration: "3:15",
  },
];

// Helper to get song file path
export const getPresetSongPath = (filename) => {
  // In development, public folder; in production, adjust as needed
  return `/audio/${filename}`;
};

// Helper to get genre icon
export const getGenreIcon = (genre) => {
  const icons = {
    ambient: <AudioLines />,
    techno: <AudioWaveform />,
    "drum & bass": <Disc2 />,
  };
  return icons[genre] || "🎵";
};
