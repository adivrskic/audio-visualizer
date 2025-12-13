export const formatFileName = (name, maxLength = 18) => {
  if (!name) return "";
  if (name.length > maxLength) return name.substring(0, maxLength - 3) + "...";
  return name;
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

export const validateAudioFile = (file) => {
  if (!file) return { valid: false, error: "No file selected" };

  const validTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
  ];
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload an audio file.",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File too large. Maximum size is 50MB." };
  }

  return { valid: true, error: null };
};
// Add to existing file
export const fetchPresetAudio = async (filename) => {
  try {
    const response = await fetch(`/audio/${filename}`);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: "audio/mpeg" });
    return file;
  } catch (error) {
    console.error("Failed to fetch preset audio:", error);
    throw error;
  }
};

export const formatTime = (seconds) => {
  if (!seconds || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
