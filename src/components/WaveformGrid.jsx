// src/components/WaveformGrid.jsx
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export default function WaveformGrid({
  waveform = [],
  isMirrored = false,
  opacity = 1,
  color = "#ffd700",
  blurAmount = 0,
  isPlaying = false,
  waveSettings = {
    intensity: 0.5,
    speed: 1.0,
    reactivity: 0.7,
    complexity: 0.5,
  },
  devSettings,
}) {
  const linesRef = useRef();
  const glowLinesRef = useRef();
  const timeRef = useRef(0);
  const waveStartTimeRef = useRef(0);
  const initialPositionsRef = useRef(null);

  // Color transition state
  const [colorTransition, setColorTransition] = useState(0); // 0 = gray, 1 = full color
  const colorTransitionRef = useRef(0);

  // Store waveform history for propagation
  const waveHistoryRef = useRef([]);
  const [activeWave, setActiveWave] = useState(false);

  const horizontalLines = devSettings?.horizontalLines || 40;
  const verticalLines = devSettings?.verticalLines || 60;
  const spacing = devSettings?.spacing || 0.15;

  // Track when wave starts and handle color transition
  useEffect(() => {
    if (isPlaying && waveform.some((v) => v > 0.1)) {
      if (!activeWave) {
        waveStartTimeRef.current = timeRef.current;
        setActiveWave(true);
      }
      // Store current waveform with timestamp
      waveHistoryRef.current.push({
        time: timeRef.current,
        waveform: [...waveform],
      });

      // Keep only recent history (last 3 seconds at 60fps max)
      const maxHistoryTime = 3.0;
      waveHistoryRef.current = waveHistoryRef.current.filter(
        (entry) => timeRef.current - entry.time <= maxHistoryTime
      );
    } else {
      setActiveWave(false);
    }
  }, [isPlaying, waveform, activeWave]);

  // Animate color transition
  useFrame((state, delta) => {
    if (isPlaying && activeWave) {
      // Fade in color when music plays
      if (colorTransitionRef.current < 1) {
        colorTransitionRef.current = Math.min(
          1,
          colorTransitionRef.current + delta * 2
        );
        setColorTransition(colorTransitionRef.current);
      }
    } else if (!isPlaying) {
      // Fade out color when music stops
      if (colorTransitionRef.current > 0) {
        colorTransitionRef.current = Math.max(
          0,
          colorTransitionRef.current - delta
        );
        setColorTransition(colorTransitionRef.current);
      }
    }
  });

  // Calculate center and max distance
  const maxDistance = useMemo(() => {
    return Math.sqrt(
      Math.pow((verticalLines / 2) * spacing, 2) +
        Math.pow((horizontalLines / 2) * spacing, 2)
    );
  }, [horizontalLines, verticalLines, spacing]);

  const { geometry, material, glowMaterial } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    // Base gray color for when no music is playing
    const baseGrayColor = new THREE.Color(0x666666);

    // Main color from devSettings or prop
    const mainColorHex = devSettings?.mainColor || color;
    const mainColor = new THREE.Color(mainColorHex);

    // Create a dense grid
    for (let z = 0; z < horizontalLines; z++) {
      const zPos = (z - horizontalLines / 2) * spacing;
      for (let x = 0; x < verticalLines - 1; x++) {
        const x1 = (x - verticalLines / 2) * spacing;
        const x2 = (x + 1 - verticalLines / 2) * spacing;

        vertices.push(x1, 0, zPos);
        vertices.push(x2, 0, zPos);

        // Colors will be updated in useFrame based on colorTransition
        // Initially set to gray
        colors.push(baseGrayColor.r, baseGrayColor.g, baseGrayColor.b);
        colors.push(baseGrayColor.r, baseGrayColor.g, baseGrayColor.b);
      }
    }

    // Create vertical lines
    for (let x = 0; x < verticalLines; x++) {
      const xPos = (x - verticalLines / 2) * spacing;
      for (let z = 0; z < horizontalLines - 1; z++) {
        const z1 = (z - horizontalLines / 2) * spacing;
        const z2 = (z + 1 - horizontalLines / 2) * spacing;

        vertices.push(xPos, 0, z1);
        vertices.push(xPos, 0, z2);

        // Initially gray
        colors.push(baseGrayColor.r, baseGrayColor.g, baseGrayColor.b);
        colors.push(baseGrayColor.r, baseGrayColor.g, baseGrayColor.b);
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const indices = [];
    for (let i = 0; i < vertices.length / 3; i += 2) {
      indices.push(i, i + 1);
    }
    geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

    // Materials - always use vertex colors
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: opacity,
      toneMapped: true,
    });

    const glowMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: opacity * (devSettings?.glowIntensity || 0.5),
      toneMapped: true,
      blending: THREE.AdditiveBlending,
    });

    return { geometry, material, glowMaterial };
  }, [
    color,
    opacity,
    blurAmount,
    devSettings,
    horizontalLines,
    verticalLines,
    spacing,
    maxDistance,
  ]);

  // Store initial positions
  useEffect(() => {
    if (geometry && geometry.attributes && geometry.attributes.position) {
      initialPositionsRef.current = new Float32Array(
        geometry.attributes.position.array
      );
    }
  }, [geometry]);

  // Update colors based on color transition
  useFrame(() => {
    if (!linesRef.current) return;
    if (!linesRef.current.geometry.attributes.color) return;

    // For mirrored version (reflection), always use gray
    const isMirroredReflection = isMirrored && color === "#666666";

    if (isMirroredReflection) {
      // Mirror always stays gray
      return;
    }

    // For main grid: blend between gray and main color based on colorTransition
    const colors = linesRef.current.geometry.attributes.color.array;
    const baseGrayColor = new THREE.Color(0x666666);
    const mainColorHex = devSettings?.mainColor || color;
    const mainColor = new THREE.Color(mainColorHex);

    const totalColors = colors.length / 3;

    for (let i = 0; i < totalColors; i++) {
      const baseIndex = i * 3;
      const x = initialPositionsRef.current?.[baseIndex] || 0;
      const z = initialPositionsRef.current?.[baseIndex + 2] || 0;

      // Calculate distance from center for brightness variation
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const normalizedDistance = Math.min(1, distanceFromCenter / maxDistance);
      const brightness = 0.8 + 0.4 * (1 - normalizedDistance);

      // Interpolate between gray and main color
      const targetColor = new THREE.Color().lerpColors(
        baseGrayColor,
        mainColor,
        colorTransition
      );

      // Apply brightness
      colors[baseIndex] = targetColor.r * brightness;
      colors[baseIndex + 1] = targetColor.g * brightness;
      colors[baseIndex + 2] = targetColor.b * brightness;
    }

    linesRef.current.geometry.attributes.color.needsUpdate = true;

    // Update glow lines too
    if (glowLinesRef.current && glowLinesRef.current.geometry) {
      const glowColors = glowLinesRef.current.geometry.attributes.color.array;
      for (let i = 0; i < colors.length; i++) {
        glowColors[i] = colors[i];
      }
      glowLinesRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  useFrame((state, delta) => {
    if (!linesRef.current) return;
    if (!linesRef.current.geometry) return;
    if (!linesRef.current.geometry.attributes) return;
    if (!linesRef.current.geometry.attributes.position) return;
    if (!initialPositionsRef.current) return;

    const positions = linesRef.current.geometry.attributes.position.array;
    const initialPositions = initialPositionsRef.current;
    const totalVertices = positions.length / 3;

    const baseHeightScale = devSettings?.baseHeightScale || 2.5;
    const heightScale = baseHeightScale * waveSettings.intensity;

    // Update time
    timeRef.current += delta * waveSettings.speed;

    // When NOT playing - return to flat
    if (!isPlaying || !activeWave) {
      let needsUpdate = false;
      const returnSpeed = 0.15;

      for (let i = 0; i < totalVertices; i++) {
        const baseIndex = i * 3;
        const currentY = positions[baseIndex + 1];

        if (Math.abs(currentY) > 0.001) {
          positions[baseIndex + 1] = currentY * (1 - returnSpeed);
          needsUpdate = true;
        } else {
          positions[baseIndex + 1] = 0;
        }

        positions[baseIndex] = initialPositions[baseIndex];
        positions[baseIndex + 2] = initialPositions[baseIndex + 2];
      }

      if (needsUpdate) {
        linesRef.current.geometry.attributes.position.needsUpdate = true;
        if (glowLinesRef.current) {
          glowLinesRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }

      // Clear history when not playing
      if (!isPlaying) {
        waveHistoryRef.current = [];
      }

      return;
    }

    // When PLAYING - create proper wave propagation
    const time = timeRef.current;
    const timeSinceWaveStart = time - waveStartTimeRef.current;
    const complexity = waveSettings.complexity;
    const waveformLength = waveform.length;

    // Get the current audio intensity (average of waveform)
    const currentIntensity =
      waveform.reduce((sum, val) => sum + val, 0) / waveformLength;

    for (let i = 0; i < totalVertices; i++) {
      const baseIndex = i * 3;
      const x = initialPositions[baseIndex];
      const z = initialPositions[baseIndex + 2];

      // Calculate distance from center (0 to 1)
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const normalizedDistance = Math.min(1, distanceFromCenter / maxDistance);

      // Wave propagation timing - center starts immediately, edges delayed
      const wavePropagationSpeed = devSettings?.wavePropagationSpeed || 4.0;
      const waveArrivalTime = normalizedDistance * wavePropagationSpeed;
      const waveActive = timeSinceWaveStart >= waveArrivalTime;

      let height = 0;

      if (waveActive && waveHistoryRef.current.length > 0) {
        // Calculate how long ago this point should have been affected
        const delayTime = waveArrivalTime;
        const targetTime = Math.max(0, time - delayTime);

        // Find the closest waveform in history to this target time
        let closestEntry = waveHistoryRef.current[0];
        let minDiff = Math.abs(targetTime - closestEntry.time);

        for (const entry of waveHistoryRef.current) {
          const diff = Math.abs(targetTime - entry.time);
          if (diff < minDiff) {
            minDiff = diff;
            closestEntry = entry;
          }
        }

        // Use the waveform value based on distance from center
        // Closer to center uses earlier parts of the waveform
        const waveformIndex = Math.min(
          waveformLength - 1,
          Math.floor(normalizedDistance * waveformLength)
        );

        let waveValue = closestEntry.waveform[waveformIndex] || 0;

        // Apply frequency-based weighting
        const bassWeight =
          (devSettings?.bassCenterFactor || 0.8) * (1 - normalizedDistance);
        const trebleWeight =
          (devSettings?.highEdgeFactor || 1.2) * normalizedDistance;

        // Bass affects center more, highs affect edges more
        waveValue = (waveValue * (bassWeight + trebleWeight)) / 2;

        // Base height from audio
        height = waveValue * heightScale;

        // Add propagating ripple effect
        const rippleFrequency = devSettings?.rippleFrequency || 8;
        const rippleSpeed = devSettings?.rippleSpeed || 4;
        const delayedTime = timeSinceWaveStart - waveArrivalTime;

        const ripple =
          Math.sin(
            distanceFromCenter * rippleFrequency - delayedTime * rippleSpeed
          ) *
          0.3 *
          complexity *
          (1 - normalizedDistance);
        height += ripple;

        // Add subtle organic movement
        const organicXFrequency = devSettings?.organicXFrequency || 4;
        const organicZFrequency = devSettings?.organicZFrequency || 3;

        height +=
          Math.sin(x * organicXFrequency + delayedTime * 2) *
          0.1 *
          complexity *
          (1 - normalizedDistance);
        height +=
          Math.cos(z * organicZFrequency + delayedTime * 1.5) *
          0.08 *
          complexity *
          (1 - normalizedDistance);

        // Apply center falloff for natural wave shape
        const centerFalloff = devSettings?.centerFalloff || 0.5;
        height *= 1 - normalizedDistance * centerFalloff;
      }

      // Mirror effect
      if (isMirrored) {
        height = -height * 0.8;
        if (blurAmount > 0) {
          positions[baseIndex] += (Math.random() - 0.5) * 0.01 * blurAmount;
          positions[baseIndex + 2] += (Math.random() - 0.5) * 0.01 * blurAmount;
        }
      }

      positions[baseIndex + 1] = height;
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true;

    // Update glow lines
    if (
      devSettings?.glowEnabled !== false &&
      glowLinesRef.current &&
      glowLinesRef.current.geometry
    ) {
      const glowPositions =
        glowLinesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i++) {
        glowPositions[i] = positions[i];
      }
      glowLinesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Glow layer */}
      {devSettings?.glowEnabled !== false && (
        <lineSegments
          ref={glowLinesRef}
          geometry={geometry.clone()}
          material={glowMaterial}
        />
      )}
      {/* Main lines */}
      <lineSegments ref={linesRef} geometry={geometry} material={material} />
    </group>
  );
}
