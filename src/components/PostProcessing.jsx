import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useThree } from "@react-three/fiber";
import { useRef } from "react";

export default function PostProcessing({ devSettings }) {
  const composerRef = useRef();

  const {
    bloomIntensity = 0.8,
    bloomThreshold = 0.2,
    bloomSmoothing = 0.5,
    vignette = 0.4,
    noise: grainAmount = 0.15,
  } = devSettings || {};

  // Don't render if all effects are disabled
  if (bloomIntensity <= 0 && vignette <= 0 && grainAmount <= 0) {
    return null;
  }

  return (
    <EffectComposer
      ref={composerRef}
      multisampling={4}
      stencilBuffer={true}
      depthBuffer={true}
      disableNormalPass={false}
    >
      {/* Bloom/Glow Effect */}
      {bloomIntensity > 0 && (
        <Bloom
          mipmapBlur
          intensity={bloomIntensity}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={bloomSmoothing}
          height={300}
        />
      )}

      {/* Vignette */}
      {vignette > 0 && (
        <Vignette
          offset={0.3}
          darkness={vignette}
          eskil={true}
          blendFunction={BlendFunction.DARKEN}
        />
      )}

      {/* Film Grain - Using SCREEN blend mode for lighter grain */}
      {grainAmount > 0 && (
        <Noise
          premultiply
          blendFunction={BlendFunction.DIFFERENCE} // Changed to SCREEN for lighter effect
          opacity={grainAmount} // Reduced multiplier for better control
        />
      )}
    </EffectComposer>
  );
}
