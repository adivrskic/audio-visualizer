export const formatTime = (seconds) => {
  if (!seconds || seconds === Infinity || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const calculateProgress = (currentTime, duration) => {
  if (!duration || duration === 0) return 0;
  return (currentTime / duration) * 100;
};
