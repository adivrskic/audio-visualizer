// Scene.js - Final fixed version
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Billboard } from "@react-three/drei";
import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import WaveformGrid from "./WaveformGrid";
import PostProcessing from "./PostProcessing";
import * as THREE from "three";

// Create a glowing white text texture with blur effect
function createGlowingTextTexture(text, blurAmount = 0) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  const fontSize = 36;
  const fontFamily = "'Courier New', monospace";
  context.font = `bold ${fontSize}px ${fontFamily}`;
  const textWidth = context.measureText(text).width;

  // Add extra space for blur
  const blurPadding = blurAmount * 2;
  canvas.width = Math.max(128, textWidth + 40 + blurPadding);
  canvas.height = 50 + blurPadding;

  // Create glow effect
  const glowLayers = blurAmount > 0 ? 3 : 5;

  // Draw glow layers
  for (let i = glowLayers; i > 0; i--) {
    const alpha = (0.8 * i) / (glowLayers * 10);

    context.font = `bold ${fontSize}px ${fontFamily}`;
    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  // Draw main white text
  context.font = `bold ${fontSize}px ${fontFamily}`;
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // Apply blur filter if available
  if (blurAmount > 0 && context.filter !== undefined) {
    try {
      const tempCanvas = document.createElement("canvas");
      const tempContext = tempCanvas.getContext("2d");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      tempContext.drawImage(canvas, 0, 0);
      tempContext.filter = `blur(${blurAmount}px)`;
      tempContext.drawImage(tempCanvas, 0, 0);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(tempCanvas, 0, 0);
    } catch (e) {
      console.warn("Canvas filter not supported:", e);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}

// Create 2x2 matrix texture with blur
function createMatrixTexture(values, blurAmount = 0) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  const blurPadding = blurAmount * 2;
  canvas.width = 80 + blurPadding;
  canvas.height = 80 + blurPadding;

  // Draw bracket with possible blur
  context.strokeStyle =
    blurAmount > 0 ? `rgba(255, 255, 255, 0.7)` : `rgba(255, 255, 255, 0.9)`;
  context.lineWidth = blurAmount > 0 ? 4 : 3;
  context.strokeRect(10 + blurPadding / 2, 10 + blurPadding / 2, 60, 60);

  // Draw matrix values
  const fontSize = blurAmount > 0 ? 22 : 24;
  const fontFamily = "'Courier New', monospace";
  context.font = `bold ${fontSize}px ${fontFamily}`;
  context.fillStyle = blurAmount > 0 ? "rgba(255, 255, 255, 0.9)" : "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Position values in a 2x2 grid
  const centerOffset = blurPadding / 2;
  context.fillText(values[0], 25 + centerOffset, 25 + centerOffset);
  context.fillText(values[1], 55 + centerOffset, 25 + centerOffset);
  context.fillText(values[2], 25 + centerOffset, 55 + centerOffset);
  context.fillText(values[3], 55 + centerOffset, 55 + centerOffset);

  // Apply blur if needed
  if (blurAmount > 0 && context.filter !== undefined) {
    try {
      const tempCanvas = document.createElement("canvas");
      const tempContext = tempCanvas.getContext("2d");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      tempContext.drawImage(canvas, 0, 0);
      tempContext.filter = `blur(${blurAmount}px)`;
      tempContext.drawImage(tempCanvas, 0, 0);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(tempCanvas, 0, 0);
    } catch (e) {
      console.warn("Canvas filter not supported:", e);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return texture;
}

// Individual Data Sprite with distance-based blur
function DataSprite({ id, position, distance, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [texture, setTexture] = useState(null);
  const timerRef = useRef();

  // Move textTypes inside useEffect or useMemo to avoid dependency issues
  const textTypes = useMemo(
    () => [
      "0x3FA7",
      "0xBEEF",
      "0xCAFE",
      "0xDEAD",
      "0xF00D",
      "sin=0.707",
      "√2=1.414",
      "e^iπ=-1",
      "∫dx=x+C",
      "λ=c/f",
      "y=sin(ωt)",
      "f=1/T",
      "E=mc²",
      "SYS_OK",
      "FFT_RDY",
      "CPU_64%",
      "MEM_OK",
      "010101",
      "110011",
      "314159",
      "0.7071",
    ],
    []
  );

  useEffect(() => {
    const randomText = textTypes[Math.floor(Math.random() * textTypes.length)];

    // Calculate blur based on distance (0-4px blur for distant sprites)
    const blurAmount = Math.min(4, distance / 10);

    // Calculate opacity based on distance (further = more transparent)
    const maxOpacity = Math.max(0.3, 0.9 - distance / 30);

    const newTexture = createGlowingTextTexture(randomText, blurAmount);
    setTexture(newTexture);

    // Pop-in animation
    setTimeout(() => {
      setVisible(true);
      let opacityValue = 0;
      const fadeIn = setInterval(() => {
        opacityValue = Math.min(maxOpacity, opacityValue + 0.05);
        setOpacity(opacityValue);
        if (opacityValue >= maxOpacity) clearInterval(fadeIn);
      }, 50);
    }, 100);

    // Set random lifetime (3-6 seconds)
    const lifetime = 3000 + Math.random() * 3000;

    timerRef.current = setTimeout(() => {
      let opacityValue = maxOpacity;
      const fadeOut = setInterval(() => {
        opacityValue = Math.max(0, opacityValue - 0.05);
        setOpacity(opacityValue);
        if (opacityValue <= 0) {
          clearInterval(fadeOut);
          setVisible(false);
          setTimeout(() => onRemove(id), 100);
        }
      }, 50);
    }, lifetime);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (newTexture) newTexture.dispose();
    };
  }, [id, distance, onRemove, textTypes]);

  if (!visible || !texture) return null;

  return (
    <Billboard position={position}>
      <sprite scale={[0.8, 0.3, 1]}>
        <spriteMaterial
          map={texture}
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </Billboard>
  );
}

// 2x2 Matrix Sprite with distance-based blur
function MatrixSprite({ id, position, distance, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [texture, setTexture] = useState(null);
  const timerRef = useRef();

  useEffect(() => {
    // Generate random 2x2 matrix values (0-9)
    const values = [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
    ];

    // Calculate blur based on distance
    const blurAmount = Math.min(3, distance / 12);
    const maxOpacity = Math.max(0.4, 0.9 - distance / 25);

    const newTexture = createMatrixTexture(values, blurAmount);
    setTexture(newTexture);

    // Pop-in animation
    setTimeout(() => {
      setVisible(true);
      let opacityValue = 0;
      const fadeIn = setInterval(() => {
        opacityValue = Math.min(maxOpacity, opacityValue + 0.05);
        setOpacity(opacityValue);
        if (opacityValue >= maxOpacity) clearInterval(fadeIn);
      }, 50);
    }, 100);

    // Lifetime (4-7 seconds)
    const lifetime = 4000 + Math.random() * 3000;

    timerRef.current = setTimeout(() => {
      let opacityValue = maxOpacity;
      const fadeOut = setInterval(() => {
        opacityValue = Math.max(0, opacityValue - 0.05);
        setOpacity(opacityValue);
        if (opacityValue <= 0) {
          clearInterval(fadeOut);
          setVisible(false);
          setTimeout(() => onRemove(id), 100);
        }
      }, 50);
    }, lifetime);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (newTexture) newTexture.dispose();
    };
  }, [id, distance, onRemove]);

  if (!visible || !texture) return null;

  return (
    <Billboard position={position}>
      <sprite scale={[0.6, 0.6, 1]}>
        <spriteMaterial
          map={texture}
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </Billboard>
  );
}

// Main DataSprites component
function DataSprites({ waveform, isPlaying, waveSettings }) {
  const [sprites, setSprites] = useState([]);
  const [matrixSprites, setMatrixSprites] = useState([]);
  const [artifactSprites, setArtifactSprites] = useState([]);
  const spriteCounter = useRef(0);
  const matrixCounter = useRef(0);
  const artifactCounter = useRef(0);
  const spawnInterval = useRef(null);

  // Camera position (for distance calculation) - wrapped in useMemo
  const cameraPosition = useMemo(() => [5.7, 5, 5], []);

  // Generate positions at varying distances (some close, some far)
  const generatePosition = useCallback(() => {
    const basePos = [-5, 0.1, -3];

    // 70% close (2-6 units), 30% far (8-15 units)
    const isFar = Math.random() > 0.7;
    const minDist = isFar ? 8 : 2;
    const maxDist = isFar ? 15 : 6;

    const angle = Math.random() * Math.PI * 2;
    const distance = minDist + Math.random() * (maxDist - minDist);
    const height = isFar
      ? -2 + Math.random() * 4 // Far: more height variation
      : -0.5 + Math.random() * 1.5; // Close: near grid height

    const position = [
      basePos[0] + Math.cos(angle) * distance,
      basePos[1] + height,
      basePos[2] + Math.sin(angle) * distance,
    ];

    // Calculate distance from camera
    const distFromCamera = Math.sqrt(
      Math.pow(position[0] - cameraPosition[0], 2) +
        Math.pow(position[1] - cameraPosition[1], 2) +
        Math.pow(position[2] - cameraPosition[2], 2)
    );

    return { position, distance: distFromCamera };
  }, [cameraPosition]);

  // Wrap spawnRandomSprite in useCallback to avoid infinite re-renders
  const spawnRandomSprite = useCallback(() => {
    const { position, distance } = generatePosition();
    const rand = Math.random();

    if (rand < 0.5) {
      // Regular text sprite (50% chance)
      if (sprites.length < 2) {
        const newId = spriteCounter.current++;
        setSprites((prev) => [...prev, { id: newId, position, distance }]);
      }
    } else if (rand < 0.7) {
      // Matrix sprite (20% chance)
      if (matrixSprites.length < 1) {
        const newId = matrixCounter.current++;
        setMatrixSprites((prev) => [
          ...prev,
          { id: newId, position, distance },
        ]);
      }
    } else {
      // Rectangle artifact (30% chance)
      if (artifactSprites.length < 1) {
        const newId = artifactCounter.current++;
        setArtifactSprites((prev) => [
          ...prev,
          { id: newId, position, distance },
        ]);
      }
    }

    // Next spawn in 2-5 seconds
    const nextSpawn = 2000 + Math.random() * 3000;
    spawnInterval.current = setTimeout(spawnRandomSprite, nextSpawn);
  }, [
    generatePosition,
    sprites.length,
    matrixSprites.length,
    artifactSprites.length,
  ]);

  const removeSprite = useCallback((id, type) => {
    switch (type) {
      case "matrix":
        setMatrixSprites((prev) => prev.filter((sprite) => sprite.id !== id));
        break;
      case "artifact":
        setArtifactSprites((prev) => prev.filter((sprite) => sprite.id !== id));
        break;
      default:
        setSprites((prev) => prev.filter((sprite) => sprite.id !== id));
    }
  }, []);

  useEffect(() => {
    if (isPlaying && waveSettings.intensity > 0.2) {
      // Start with one sprite immediately
      setTimeout(spawnRandomSprite, 500);

      // Then start regular spawning
      const initialDelay = 1500 + Math.random() * 1500;
      spawnInterval.current = setTimeout(spawnRandomSprite, initialDelay);
    } else {
      // Clear everything when not playing
      setSprites([]);
      setMatrixSprites([]);
      setArtifactSprites([]);
      spriteCounter.current = 0;
      matrixCounter.current = 0;
      artifactCounter.current = 0;

      if (spawnInterval.current) {
        clearTimeout(spawnInterval.current);
        spawnInterval.current = null;
      }
    }

    return () => {
      if (spawnInterval.current) {
        clearTimeout(spawnInterval.current);
        spawnInterval.current = null;
      }
    };
  }, [isPlaying, waveSettings.intensity, spawnRandomSprite]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (spawnInterval.current) {
        clearTimeout(spawnInterval.current);
      }
    };
  }, []);

  return (
    <>
      {/* Regular text sprites */}
      {sprites.map((sprite) => (
        <DataSprite
          key={`text-${sprite.id}`}
          id={sprite.id}
          position={sprite.position}
          distance={sprite.distance}
          onRemove={(id) => removeSprite(id, "text")}
        />
      ))}

      {/* 2x2 Matrix sprites */}
      {matrixSprites.map((sprite) => (
        <MatrixSprite
          key={`matrix-${sprite.id}`}
          id={sprite.id}
          position={sprite.position}
          distance={sprite.distance}
          onRemove={(id) => removeSprite(id, "matrix")}
        />
      ))}

      {/* White rectangle artifacts */}
      {/* {artifactSprites.map((sprite) => (
        <RectangleArtifact
          key={`artifact-${sprite.id}`}
          id={sprite.id}
          position={sprite.position}
          distance={sprite.distance}
          onRemove={(id) => removeSprite(id, "artifact")}
        />
      ))} */}
    </>
  );
}

// Rest of Scene component remains the same...
export default function Scene({
  waveform,
  isPlaying,
  waveSettings,
  devSettings,
}) {
  const mainSettings = useMemo(
    () => ({
      position: [
        devSettings?.mainPositionX || -5,
        devSettings?.mainPositionY || 0.1,
        devSettings?.mainPositionZ || -3,
      ],
      rotation: [
        devSettings?.mainRotationX || -0.3,
        devSettings?.mainRotationY || 0,
        devSettings?.mainRotationZ || -0.1,
      ],
      scale: devSettings?.mainScale || 1.2,
      opacity: 1,
    }),
    [devSettings]
  );

  const mirroredSettings = useMemo(
    () => ({
      position: [
        devSettings?.mirrorPositionX || -5,
        devSettings?.mirrorPositionY || -1.0,
        devSettings?.mirrorPositionZ || -2.8,
      ],
      rotation: [
        devSettings?.mirrorRotationX || -0.3,
        devSettings?.mirrorRotationY || 0,
        devSettings?.mirrorRotationZ || -0.1,
      ],
      scale: devSettings?.mirrorScale || 1.0,
      opacity: devSettings?.mirrorOpacity || 0.15,
      blurAmount: (devSettings?.mirrorBlur || 0.01) * 100,
    }),
    [devSettings]
  );

  const cameraSettings = useMemo(
    () => ({
      position: [
        devSettings?.cameraX || 5.7,
        devSettings?.cameraY || 5,
        devSettings?.cameraZ || 5,
      ],
      rotation: [
        devSettings?.cameraRotationX || -0.6,
        devSettings?.cameraRotationY || 0.785,
        devSettings?.cameraRotationZ || 0,
      ],
      fov: devSettings?.cameraFOV || 60,
    }),
    [devSettings]
  );

  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 1);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      camera={{
        position: cameraSettings.position,
        fov: cameraSettings.fov,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
    >
      <Suspense fallback={null}>
        <PerspectiveCamera
          makeDefault
          position={cameraSettings.position}
          rotation={cameraSettings.rotation}
          fov={cameraSettings.fov}
        />

        <ambientLight
          intensity={0.3}
          color={devSettings?.mainColor || "#ffd700"}
        />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.6}
          color={devSettings?.mainColor || "#ffd700"}
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={0.2}
          color="#666666"
        />
        <pointLight
          position={[0, 2, 0]}
          intensity={0.5}
          color={devSettings?.mainColor || "#ffd700"}
          distance={15}
          decay={2}
        />

        {/* Data Sprites */}
        {isPlaying && waveSettings.intensity > 0.2 && (
          <DataSprites
            waveform={waveform}
            isPlaying={isPlaying}
            waveSettings={waveSettings}
          />
        )}

        {/* Main waveform grid */}
        <group
          position={mainSettings.position}
          rotation={mainSettings.rotation}
          scale={mainSettings.scale}
        >
          <WaveformGrid
            waveform={waveform}
            opacity={mainSettings.opacity}
            isPlaying={isPlaying}
            waveSettings={waveSettings}
            devSettings={devSettings}
          />
        </group>

        {/* Mirrored waveform grid */}
        <group
          position={mirroredSettings.position}
          rotation={mirroredSettings.rotation}
          scale={mirroredSettings.scale}
        >
          <WaveformGrid
            waveform={waveform}
            isMirrored={true}
            opacity={mirroredSettings.opacity}
            color="#666666"
            blurAmount={mirroredSettings.blurAmount}
            isPlaying={isPlaying}
            waveSettings={waveSettings}
            devSettings={devSettings}
          />
        </group>

        {/* Post Processing */}
        <PostProcessing devSettings={devSettings} />
      </Suspense>
    </Canvas>
  );
}
