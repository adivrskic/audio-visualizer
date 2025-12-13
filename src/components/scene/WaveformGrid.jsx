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
    maxAmplitude: 1.0, // New control
  },
  devSettings,
}) {
  const linesRef = useRef();
  const glowLinesRef = useRef();
  const timeRef = useRef(0);
  const waveStartTimeRef = useRef(0);
  const initialPositionsRef = useRef(null);

  // Store waveform history for propagation
  const waveHistoryRef = useRef([]);
  const [activeWave, setActiveWave] = useState(false);

  // Audio analysis for better beat detection
  const audioAnalysisRef = useRef({
    bassIntensity: 0,
    midIntensity: 0,
    trebleIntensity: 0,
    overallIntensity: 0,
    beatDetected: false,
    lastBeatTime: 0,
    beatStrength: 0,
    rhythmicPattern: [],
    peakAmplitude: 0,
  });

  const horizontalLines = devSettings?.horizontalLines || 40;
  const verticalLines = devSettings?.verticalLines || 60;
  const spacing = devSettings?.spacing || 0.15;

  // Analyze waveform for better beat detection
  const analyzeWaveform = (waveformArray) => {
    const length = waveformArray.length;
    const bassRange = Math.floor(length * 0.3); // 0-30% for bass
    const midRange = Math.floor(length * 0.5); // 30-80% for mids
    const trebleRange = length - bassRange - midRange; // 80-100% for treble

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let overallSum = 0;
    let peakValue = 0;

    for (let i = 0; i < length; i++) {
      const value = waveformArray[i];
      overallSum += value;
      peakValue = Math.max(peakValue, value);

      if (i < bassRange) {
        bassSum += value;
      } else if (i < bassRange + midRange) {
        midSum += value;
      } else {
        trebleSum += value;
      }
    }

    return {
      bassIntensity: bassSum / bassRange || 0,
      midIntensity: midSum / midRange || 0,
      trebleIntensity: trebleSum / trebleRange || 0,
      overallIntensity: overallSum / length || 0,
      peakAmplitude: peakValue,
    };
  };

  // Improved beat detection with rhythmic analysis
  const detectBeat = (currentAnalysis) => {
    const { bassIntensity, overallIntensity, peakAmplitude } = currentAnalysis;
    const currentTime = timeRef.current;

    // Store recent intensities for pattern analysis
    audioAnalysisRef.current.rhythmicPattern.push({
      time: currentTime,
      intensity: overallIntensity,
      bass: bassIntensity,
      peak: peakAmplitude,
    });

    // Keep only last 2 seconds of data
    audioAnalysisRef.current.rhythmicPattern =
      audioAnalysisRef.current.rhythmicPattern.filter(
        (entry) => currentTime - entry.time <= 2.0
      );

    // Calculate moving average
    const avgIntensity =
      audioAnalysisRef.current.rhythmicPattern.reduce(
        (sum, entry) => sum + entry.intensity,
        0
      ) / Math.max(1, audioAnalysisRef.current.rhythmicPattern.length);

    const avgPeak =
      audioAnalysisRef.current.rhythmicPattern.reduce(
        (sum, entry) => sum + entry.peak,
        0
      ) / Math.max(1, audioAnalysisRef.current.rhythmicPattern.length);

    // Detect beat when intensity is significantly above average
    const intensityThreshold = avgIntensity * 1.5;
    const peakThreshold = avgPeak * 1.3;
    const isBeat =
      (overallIntensity > intensityThreshold && overallIntensity > 0.3) ||
      (peakAmplitude > peakThreshold && peakAmplitude > 0.4);

    if (isBeat && currentTime - audioAnalysisRef.current.lastBeatTime > 0.1) {
      audioAnalysisRef.current.beatDetected = true;
      audioAnalysisRef.current.lastBeatTime = currentTime;
      const beatStrengthCalc = Math.min(
        1,
        (overallIntensity - avgIntensity) * 2 + (peakAmplitude - avgPeak) * 1.5
      );
      audioAnalysisRef.current.beatStrength = beatStrengthCalc;
    } else {
      // Fade out beat detection
      const timeSinceBeat = currentTime - audioAnalysisRef.current.lastBeatTime;
      if (timeSinceBeat > 0.2) {
        audioAnalysisRef.current.beatDetected = false;
        audioAnalysisRef.current.beatStrength *= 0.8; // Faster decay for sharper beats
      }
    }

    // Update peak amplitude
    audioAnalysisRef.current.peakAmplitude = peakAmplitude;
  };

  // Track when wave starts
  useEffect(() => {
    if (isPlaying && waveform.some((v) => v > 0.1)) {
      if (!activeWave) {
        waveStartTimeRef.current = timeRef.current;
        setActiveWave(true);
      }

      // Analyze current waveform
      const analysis = analyzeWaveform(waveform);
      audioAnalysisRef.current = {
        ...audioAnalysisRef.current,
        ...analysis,
      };
      detectBeat(analysis);

      // Store current waveform with timestamp
      waveHistoryRef.current.push({
        time: timeRef.current,
        waveform: [...waveform],
        analysis: { ...analysis },
      });

      // Keep only recent history
      const maxHistoryTime = 3.0;
      waveHistoryRef.current = waveHistoryRef.current.filter(
        (entry) => timeRef.current - entry.time <= maxHistoryTime
      );
    } else {
      setActiveWave(false);
      audioAnalysisRef.current.beatDetected = false;
      audioAnalysisRef.current.beatStrength = 0;
      audioAnalysisRef.current.peakAmplitude = 0;
    }
  }, [isPlaying, waveform, activeWave]);

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

        // Set main color
        colors.push(mainColor.r, mainColor.g, mainColor.b);
        colors.push(mainColor.r, mainColor.g, mainColor.b);
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

        // Set main color
        colors.push(mainColor.r, mainColor.g, mainColor.b);
        colors.push(mainColor.r, mainColor.g, mainColor.b);
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

    // Materials - with enhanced properties
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: opacity,
      toneMapped: true,
      linewidth: 1,
    });

    const glowMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: opacity * (devSettings?.glowIntensity || 0.5),
      toneMapped: true,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });

    return { geometry, material, glowMaterial };
  }, [color, opacity, devSettings, horizontalLines, verticalLines, spacing]);

  // Store initial positions
  useEffect(() => {
    if (geometry && geometry.attributes && geometry.attributes.position) {
      initialPositionsRef.current = new Float32Array(
        geometry.attributes.position.array
      );
    }
  }, [geometry]);

  // Update colors with more dynamic variations
  useFrame(() => {
    if (!linesRef.current) return;
    if (!linesRef.current.geometry.attributes.color) return;

    // For mirrored version, use gray color
    const isMirroredReflection = isMirrored && color === "#666666";

    if (isMirroredReflection) {
      // Mirror uses gray color with subtle variations
      const colors = linesRef.current.geometry.attributes.color.array;
      const grayColor = new THREE.Color(0x666666);
      const totalColors = colors.length / 3;

      for (let i = 0; i < totalColors; i++) {
        const baseIndex = i * 3;
        const x = initialPositionsRef.current?.[baseIndex] || 0;
        const z = initialPositionsRef.current?.[baseIndex + 2] || 0;

        // Distance-based brightness for mirror
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const normalizedDistance = Math.min(
          1,
          distanceFromCenter / maxDistance
        );
        const brightness = 0.4 + 0.2 * (1 - normalizedDistance);

        // Add subtle time-based variation
        const timeVariation =
          0.95 + 0.05 * Math.sin(timeRef.current * 0.3 + x * 0.5 + z * 0.5);

        colors[baseIndex] = grayColor.r * brightness * timeVariation;
        colors[baseIndex + 1] = grayColor.g * brightness * timeVariation;
        colors[baseIndex + 2] = grayColor.b * brightness * timeVariation;
      }

      linesRef.current.geometry.attributes.color.needsUpdate = true;
      return;
    }

    // For main grid: dynamic color variations
    const colors = linesRef.current.geometry.attributes.color.array;
    const mainColorHex = devSettings?.mainColor || color;
    const mainColor = new THREE.Color(mainColorHex);

    const totalColors = colors.length / 3;
    const { bassIntensity, midIntensity, trebleIntensity, peakAmplitude } =
      audioAnalysisRef.current;
    const { beatStrength } = audioAnalysisRef.current;
    const beatPulse = beatStrength;

    // Calculate overall energy level
    const energyLevel = Math.min(
      1,
      ((bassIntensity + midIntensity + trebleIntensity) / 3) * 1.5
    );

    for (let i = 0; i < totalColors; i++) {
      const baseIndex = i * 3;
      const x = initialPositionsRef.current?.[baseIndex] || 0;
      const z = initialPositionsRef.current?.[baseIndex + 2] || 0;

      // Calculate distance from center
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const normalizedDistance = Math.min(1, distanceFromCenter / maxDistance);

      // Base brightness with distance falloff
      let brightness = 0.7 + 0.3 * (1 - normalizedDistance);

      // Energy-based brightness boost
      brightness *= 1 + energyLevel * 0.3;

      // Frequency response brightness variations
      if (normalizedDistance < 0.3) {
        brightness *= 1 + bassIntensity * 0.4; // Strong bass response in center
      } else if (normalizedDistance < 0.7) {
        brightness *= 1 + midIntensity * 0.2; // Moderate mid response
      } else {
        brightness *= 1 + trebleIntensity * 0.1; // Subtle treble response
      }

      // Beat pulse effect - more dramatic
      brightness *= 1 + beatPulse * 0.5;

      // Peak amplitude effect - extra brightness on peaks
      const peakEffect = Math.min(1, peakAmplitude * 2);
      brightness *= 1 + peakEffect * 0.2;

      // Add complex noise for organic feel
      const noiseX = Math.sin(x * 3 + timeRef.current * 1.2) * 0.1;
      const noiseZ = Math.cos(z * 3 + timeRef.current * 0.8) * 0.1;
      const noise = 0.9 + (noiseX + noiseZ) * 0.1;
      brightness *= noise;

      // Complexity setting affects color saturation
      const saturationBoost = 1.0 + waveSettings.complexity * 0.3;

      // Create color with saturation boost
      const color = mainColor.clone();
      if (saturationBoost > 1.0) {
        color.multiplyScalar(saturationBoost);
      }

      colors[baseIndex] = color.r * brightness;
      colors[baseIndex + 1] = color.g * brightness;
      colors[baseIndex + 2] = color.b * brightness;
    }

    linesRef.current.geometry.attributes.color.needsUpdate = true;

    // Update glow lines with enhanced effects
    if (glowLinesRef.current && glowLinesRef.current.geometry) {
      const glowColors = glowLinesRef.current.geometry.attributes.color.array;
      // Make glow colors slightly brighter and more saturated
      const glowBoost = 1.2 + energyLevel * 0.3;
      for (let i = 0; i < colors.length; i++) {
        glowColors[i] = Math.min(1, colors[i] * glowBoost);
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

    // Base settings with waveSettings multipliers
    const baseHeightScale = devSettings?.baseHeightScale || 2.5;
    const maxAmplitude = waveSettings.maxAmplitude || 1.0;
    const intensity = waveSettings.intensity || 0.5;
    const reactivity = waveSettings.reactivity || 0.7;
    const complexity = waveSettings.complexity || 0.5;
    const speed = waveSettings.speed || 1.0;

    // Combined height scale with all multipliers
    const heightScale = baseHeightScale * intensity * maxAmplitude * 2.0;

    // Update time with speed multiplier
    timeRef.current += delta * speed;

    // Get current analysis data
    const {
      bassIntensity,
      midIntensity,
      trebleIntensity,
      overallIntensity,
      peakAmplitude,
    } = audioAnalysisRef.current;
    const { beatDetected, beatStrength } = audioAnalysisRef.current;

    // Enhanced beat multiplier with maxAmplitude
    const beatMultiplier = 1.0 + beatStrength * (0.8 + maxAmplitude * 0.7);

    // When NOT playing - return to flat with interesting idle animation
    if (!isPlaying || !activeWave) {
      let needsUpdate = false;
      const returnSpeed = 0.08 + reactivity * 0.07; // Reactivity affects return speed

      // Interesting idle animation that uses complexity setting
      const idleWave =
        Math.sin(timeRef.current * (0.3 + complexity * 0.4)) *
        (0.05 + complexity * 0.05) *
        maxAmplitude;

      for (let i = 0; i < totalVertices; i++) {
        const baseIndex = i * 3;
        const x = initialPositions[baseIndex];
        const z = initialPositions[baseIndex + 2];
        const currentY = positions[baseIndex + 1];

        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        const normalizedDistance = Math.min(
          1,
          distanceFromCenter / maxDistance
        );

        // Target Y position with complexity-based pattern
        let targetY = idleWave * (1 - normalizedDistance);

        // Add subtle pattern based on position
        const patternX =
          Math.sin(x * (1 + complexity * 2) + timeRef.current * 0.2) *
          0.02 *
          complexity;
        const patternZ =
          Math.cos(z * (1 + complexity * 2) + timeRef.current * 0.15) *
          0.02 *
          complexity;
        targetY +=
          (patternX + patternZ) * (1 - normalizedDistance) * maxAmplitude;

        // If currently above/below target, slowly return
        if (Math.abs(currentY - targetY) > 0.001) {
          positions[baseIndex + 1] =
            currentY * (1 - returnSpeed) + targetY * returnSpeed;
          needsUpdate = true;
        } else {
          positions[baseIndex + 1] = targetY;
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

    // When PLAYING - enhanced wave propagation with all settings active
    const time = timeRef.current;
    const timeSinceWaveStart = time - waveStartTimeRef.current;
    const waveformLength = waveform.length;

    // Enhanced frequency strengths with reactivity multiplier
    const bassStrength = Math.min(1, bassIntensity * (2 + reactivity));
    const midStrength = Math.min(1, midIntensity * (1.5 + reactivity * 0.5));
    const trebleStrength = Math.min(
      1,
      trebleIntensity * (1.2 + reactivity * 0.3)
    );

    // Peak amplitude effect - extra boost on loud parts
    const peakEffect = Math.min(2, peakAmplitude * 3) * maxAmplitude;

    for (let i = 0; i < totalVertices; i++) {
      const baseIndex = i * 3;
      const x = initialPositions[baseIndex];
      const z = initialPositions[baseIndex + 2];

      // Calculate distance from center (0 to 1)
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const normalizedDistance = Math.min(1, distanceFromCenter / maxDistance);

      // Wave propagation timing - complexity affects timing patterns
      let wavePropagationSpeed = devSettings?.wavePropagationSpeed || 4.0;
      wavePropagationSpeed *= 1 + complexity * 0.5; // Complexity makes timing more varied

      // Different speeds for different frequencies
      if (normalizedDistance < 0.3) {
        wavePropagationSpeed *= 0.7 + bassStrength * 0.6; // Bass waves are slower
      } else if (normalizedDistance < 0.7) {
        wavePropagationSpeed *= 0.9 + midStrength * 0.4; // Mid waves are moderate
      } else {
        wavePropagationSpeed *= 1.1 + trebleStrength * 0.5; // Treble waves are faster
      }

      const waveArrivalTime = normalizedDistance * wavePropagationSpeed;
      const waveActive = timeSinceWaveStart >= waveArrivalTime;

      let height = 0;
      let frequencyMultiplier = 1.0;

      if (waveActive && waveHistoryRef.current.length > 0) {
        // Find the waveform entry that matches this point's timing
        const targetTime = Math.max(0, time - waveArrivalTime);
        let closestEntry = waveHistoryRef.current[0];
        let minDiff = Math.abs(targetTime - closestEntry.time);

        for (const entry of waveHistoryRef.current) {
          const diff = Math.abs(targetTime - entry.time);
          if (diff < minDiff) {
            minDiff = diff;
            closestEntry = entry;
          }
        }

        // Get waveform value with reactivity enhancement
        const waveformIndex = Math.min(
          waveformLength - 1,
          Math.floor(
            normalizedDistance * waveformLength * (1 + bassStrength * 0.3)
          )
        );

        let waveValue = closestEntry.waveform[waveformIndex] || 0;

        // Apply reactivity curve - makes response more dynamic
        const reactivityCurve = Math.pow(waveValue, 2 - reactivity);
        waveValue = reactivityCurve;

        // Enhanced frequency-based response with all settings
        if (normalizedDistance < 0.3) {
          // Center responds strongly to bass
          const bassResponse = devSettings?.bassCenterFactor || 1.2;
          frequencyMultiplier =
            bassStrength * bassResponse * (2.5 - normalizedDistance * 2);
          frequencyMultiplier *= 1 + intensity * 0.5; // Intensity affects bass response
        } else if (normalizedDistance < 0.7) {
          // Middle responds to mids
          frequencyMultiplier = midStrength * 1.0;
          frequencyMultiplier *= 1 + complexity * 0.3; // Complexity affects mid detail
        } else {
          // Edges respond to treble
          const trebleResponse = devSettings?.highEdgeFactor || 1.2;
          frequencyMultiplier =
            trebleStrength * trebleResponse * normalizedDistance;
          frequencyMultiplier *= 1 + maxAmplitude * 0.2; // Max amplitude affects treble
        }

        // Base height with all multipliers
        let baseHeight =
          waveValue * heightScale * frequencyMultiplier * beatMultiplier;

        // Apply peak effect boost
        baseHeight *= 1 + peakEffect * 0.3;

        // Multi-layered ripple effects with complexity control
        const rippleCount = Math.floor(2 + complexity * 3); // More ripples with higher complexity
        let rippleHeight = 0;

        for (let r = 0; r < rippleCount; r++) {
          const rippleFrequency =
            (devSettings?.rippleFrequency || 8) * (1 + r * 0.4);
          const rippleSpeed = (devSettings?.rippleSpeed || 4) * (1 + r * 0.25);
          const delayedTime = timeSinceWaveStart - waveArrivalTime;
          const ripplePhase = (r * Math.PI * 2) / rippleCount;
          const rippleIntensity = (0.2 + intensity * 0.3) / rippleCount;

          rippleHeight +=
            Math.sin(
              distanceFromCenter * rippleFrequency * (1 + midStrength * 0.3) +
                delayedTime * rippleSpeed * (1 + overallIntensity * 0.4) +
                ripplePhase
            ) *
            rippleIntensity *
            (1 - normalizedDistance);
        }

        // Apply maxAmplitude to ripples
        rippleHeight *= maxAmplitude;
        height = baseHeight + rippleHeight;

        // Enhanced organic movement with complexity layers
        const organicLayers = Math.floor(1 + complexity * 2);
        let organicHeight = 0;

        for (let o = 0; o < organicLayers; o++) {
          const xFreq = devSettings?.organicXFrequency || 4 * (1 + o * 0.5);
          const zFreq = devSettings?.organicZFrequency || 3 * (1 + o * 0.4);
          const xSpeed = devSettings?.organicXSpeed || 2.5 * (1 + o * 0.3);
          const zSpeed = devSettings?.organicZSpeed || 1.2 * (1 + o * 0.2);
          const delayedTime = timeSinceWaveStart - waveArrivalTime;
          const organicIntensity = (0.08 + complexity * 0.04) / organicLayers;

          organicHeight +=
            (Math.sin(
              x * xFreq + delayedTime * xSpeed * (1 + bassStrength * 0.2)
            ) *
              organicIntensity +
              Math.cos(
                z * zFreq + delayedTime * zSpeed * (1 + trebleStrength * 0.1)
              ) *
                (organicIntensity * 0.7)) *
            (1 - normalizedDistance);
        }

        // Apply intensity to organic movement
        organicHeight *= intensity * maxAmplitude;
        height += organicHeight;

        // Complex noise patterns with reactivity control
        const noiseScale = 0.15 + reactivity * 0.1;
        const noiseFreq = 1.5 + complexity * 1.5;
        const noiseHeight =
          Math.sin(x * noiseFreq + time * (1.2 + bassStrength * 0.3)) *
          Math.cos(z * noiseFreq + time * (0.9 + trebleStrength * 0.2)) *
          Math.sin(time * 0.7 + x * 0.3 + z * 0.3) *
          noiseScale *
          complexity *
          (1 - normalizedDistance);

        height += noiseHeight * maxAmplitude;

        // Beat impact - creates sharper movements on beats
        if (beatDetected) {
          const beatFrequency = 25 + beatStrength * 15;
          const beatImpact =
            Math.sin(time * beatFrequency) *
            0.15 *
            beatStrength *
            (1 - normalizedDistance) *
            maxAmplitude *
            intensity;
          height += beatImpact;
        }

        // Apply center falloff with smooth curve
        const centerFalloff = devSettings?.centerFalloff || 0.25;
        const falloffCurve = Math.pow(
          1 - normalizedDistance,
          1.5 + reactivity * 0.5
        );
        height *= 1 - normalizedDistance * centerFalloff * falloffCurve;

        // Final amplitude limit with maxAmplitude
        const amplitudeLimit = 5.0 * maxAmplitude;
        height = Math.max(-amplitudeLimit, Math.min(amplitudeLimit, height));
      }

      // Mirror effect with enhanced settings
      if (isMirrored) {
        const mirrorIntensity = 0.6 + intensity * 0.4;
        height = -height * mirrorIntensity;

        // Add subtle phase shift to mirror
        const phaseShift =
          Math.sin(time * (0.4 + complexity * 0.2)) *
          0.15 *
          normalizedDistance *
          maxAmplitude;
        height += phaseShift;

        // Blur effect with intensity control
        if (blurAmount > 0) {
          const blurIntensity =
            blurAmount * (1 + overallIntensity * 0.5) * intensity;
          const blurX = (Math.random() - 0.5) * 0.01 * blurIntensity;
          const blurZ = (Math.random() - 0.5) * 0.01 * blurIntensity;
          positions[baseIndex] += blurX;
          positions[baseIndex + 2] += blurZ;
        }
      }

      positions[baseIndex + 1] = height;
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true;

    // Update glow lines with enhanced exaggeration
    if (
      devSettings?.glowEnabled !== false &&
      glowLinesRef.current &&
      glowLinesRef.current.geometry
    ) {
      const glowPositions =
        glowLinesRef.current.geometry.attributes.position.array;

      // Glow exaggeration based on intensity and maxAmplitude
      const glowBoost = 1.1 + intensity * 0.3 + maxAmplitude * 0.2;

      for (let i = 0; i < positions.length; i++) {
        if (i % 3 === 1) {
          // Y positions only
          glowPositions[i] = positions[i] * glowBoost;
        } else {
          glowPositions[i] = positions[i];
        }
      }
      glowLinesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Enhanced glow layer */}
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
