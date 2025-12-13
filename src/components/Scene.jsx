// Scene.js
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Suspense } from "react";
import WaveformGrid from "./WaveformGrid";
import PostProcessing from "./PostProcessing";
import * as THREE from "three";

export default function Scene({
  waveform,
  isPlaying,
  waveSettings,
  devSettings,
}) {
  const mainSettings = {
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
  };

  const mirroredSettings = {
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
  };

  const cameraSettings = {
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
  };

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

        {/* Main waveform grid - Inside Canvas */}
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

        {/* Mirrored waveform grid - Inside Canvas */}
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
