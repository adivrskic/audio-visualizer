// src/components/WebGLCheck.jsx
import { useEffect, useState } from "react";

export default function WebGLCheck({ children }) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [, setError] = useState(null);

  useEffect(() => {
    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        if (!gl) {
          setWebglSupported(false);
          setError("WebGL is not supported in your browser.");
          return;
        }

        // Check for specific extensions that indicate better support
        const extensions = [
          "OES_texture_float",
          "WEBGL_draw_buffers",
          "EXT_blend_minmax",
        ];

        for (const ext of extensions) {
          if (!gl.getExtension(ext)) {
            console.warn(`WebGL extension ${ext} not supported`);
          }
        }

        setWebglSupported(true);
      } catch (err) {
        console.error("WebGL check failed:", err);
        setWebglSupported(false);
        setError(err.message || "Failed to initialize WebGL.");
      }
    };

    checkWebGLSupport();

    // Handle WebGL context loss
    const handleContextLoss = (event) => {
      console.error("WebGL context lost:", event);
      setWebglSupported(false);
      setError("WebGL context was lost. Please refresh the page.");
      event.preventDefault();
    };

    const handleContextRestored = () => {
      console.log("WebGL context restored");
      setWebglSupported(true);
      setError(null);
    };

    window.addEventListener("webglcontextlost", handleContextLoss);
    window.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      window.removeEventListener("webglcontextlost", handleContextLoss);
      window.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className="webgl-error-overlay">
        <div className="webgl-error-content">
          <div className="error-icon">⚠️</div>
          <h2>WebGL Not Supported</h2>
          <p className="error-message">
            Your browser or device does not support WebGL 2.0., or it is
            disabled or otherwise unavailable
          </p>
          <div className="error-details">
            <ul className="solutions-list">
              <li>Use a modern browser like Chrome, Firefox, or Edge</li>
              <li>Enable hardware acceleration in browser settings</li>
              <li>Update your graphics drivers</li>
              <li>Try a different device</li>
            </ul>
          </div>
          <div className="error-actions">
            <button
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              Retry
            </button>
            <button
              onClick={() => {
                // Provide alternative experience or documentation
                window.open("https://get.webgl.org/", "_blank");
              }}
              className="learn-more-button"
            >
              Learn More
            </button>
          </div>
          <div className="browser-support">
            <p>Supported browsers:</p>
            <div className="browser-icons">
              <span>Chrome 51+</span>
              <span>Firefox 51+</span>
              <span>Safari 10+</span>
              <span>Edge 79+</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
