import { useState, useEffect } from "react";

export const useDeviceDetection = () => {
  const [deviceType, setDeviceType] = useState("desktop");

  const detectDeviceType = () => {
    const isMobile =
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;
    return isMobile ? "mobile" : "desktop";
  };

  useEffect(() => {
    const updateDeviceType = () => {
      const newType = detectDeviceType();
      setDeviceType(newType);
    };

    updateDeviceType();
    window.addEventListener("resize", updateDeviceType);

    return () => {
      window.removeEventListener("resize", updateDeviceType);
    };
  }, []);

  return deviceType;
};
