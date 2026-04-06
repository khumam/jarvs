"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Orb } from "./Orb";
import { NetworkLines } from "./NetworkLines";
import type { OrbState } from "@/hooks/useOrbChat";

interface OrbSceneProps {
  state: OrbState;
}

export function OrbScene({ state }: OrbSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.08} />
      <ambientLight intensity={0.05} color="#ff00aa" />
      <directionalLight position={[5, 5, 5]} intensity={0.25} color="#00f0ff" />
      <directionalLight position={[-5, -3, -5]} intensity={0.12} color="#ff00aa" />

      <Orb state={state} />
      <NetworkLines state={state} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={12}
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={0.3}
      />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
