import { AudioLines, AudioWaveform, Disc2 } from "lucide-react";

export const presetSongs = [
  {
    id: "ambient",
    name: "Beats",
    filename: "beats.mp3",
    genre: "ambient",
    description: "Atmospheric textures",
    duration: "0:31",
  },
  {
    id: "trance",
    name: "Trance",
    filename: "trance.mp3",
    genre: "trance",
    description: "Pulsing electronic beat",
    duration: "3:21",
  },
  {
    id: "house",
    name: "House",
    filename: "house.mp3",
    genre: "house",
    description: "Rapid-fire rhythm",
    duration: "1:35",
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
    trance: <AudioWaveform />,
    house: <Disc2 />,
  };
  return icons[genre] || "🎵";
};
