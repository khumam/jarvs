"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbState } from "@/hooks/useOrbChat";

interface OrbProps {
  state: OrbState;
}

export function Orb({ state }: OrbProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowInnerRef = useRef<THREE.Mesh>(null);
  const glowOuterRef = useRef<THREE.Mesh>(null);
  const shell1Ref = useRef<THREE.Mesh>(null);
  const shell2Ref = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const outerParticlesRef = useRef<THREE.Points>(null);

  // Inner dense particle ring
  const innerCount = 500;
  const innerPositions = useMemo(() => {
    const positions = new Float32Array(innerCount * 3);
    for (let i = 0; i < innerCount; i++) {
      const angle = (i / innerCount) * Math.PI * 2;
      const radius = 1.8 + (Math.random() - 0.5) * 0.3;
      const y = (Math.random() - 0.5) * 0.15;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);

  // Outer sparse particle field
  const outerCount = 300;
  const outerPositions = useMemo(() => {
    const positions = new Float32Array(outerCount * 3);
    for (let i = 0; i < outerCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 1.0;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  const stateColors: Record<OrbState, { core: string; glow: string }> = {
    idle: { core: "#00f0ff", glow: "#00f0ff" },
    listening: { core: "#ff00aa", glow: "#ff00aa" },
    thinking: { core: "#ffaa00", glow: "#ffaa00" },
    speaking: { core: "#00f0ff", glow: "#00f0ff" },
  };

  const colors = stateColors[state];

  // State-driven animation parameters
  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isActive = isThinking || isSpeaking || isListening;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // ── Shell rotation speeds ──
    const shellSpeed = isThinking ? 0.6 : isListening ? 0.4 : 0.12;
    const shell2Speed = isThinking ? 0.5 : isListening ? 0.35 : 0.08;
    const particleOrbSpeed = isThinking ? 0.004 : isListening ? 0.004 : 0.001;

    // ── Core: breathing for speaking, fast pulse for thinking ──
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;

      if (isSpeaking) {
        // Breathing: slow deep inhale/exhale
        const breath = Math.sin(t * 1.2) * 0.5 + 0.5; // 0..1
        const scale = 0.95 + breath * 0.12;
        coreRef.current.scale.setScalar(scale);
        mat.emissiveIntensity = 0.8 + breath * 0.6;
      } else if (isThinking) {
        // Fast agitated pulse
        const pulse = Math.sin(t * 4) * 0.08;
        coreRef.current.scale.setScalar(1 + pulse);
        mat.emissiveIntensity = 1.2 + Math.sin(t * 8) * 0.3;
      } else if (isListening) {
        const pulse = Math.sin(t * 3) * 0.06;
        coreRef.current.scale.setScalar(1 + pulse);
        mat.emissiveIntensity = 1.5 + Math.sin(t * 6) * 0.2;
      } else {
        // Idle: gentle slow pulse
        const pulse = Math.sin(t * 0.8) * 0.03;
        coreRef.current.scale.setScalar(1 + pulse);
        mat.emissiveIntensity = 0.7 + Math.sin(t * 1.5) * 0.1;
      }
    }

    // ── Glow layers react to state ──
    if (glowInnerRef.current) {
      const mat = glowInnerRef.current.material as THREE.MeshBasicMaterial;
      if (isSpeaking) {
        const breath = Math.sin(t * 1.2) * 0.5 + 0.5;
        mat.opacity = 0.04 + breath * 0.12;
      } else if (isThinking) {
        mat.opacity = 0.06 + Math.sin(t * 4) * 0.04;
      } else {
        mat.opacity = 0.08;
      }
    }

    if (glowOuterRef.current) {
      const mat = glowOuterRef.current.material as THREE.MeshBasicMaterial;
      if (isSpeaking) {
        const breath = Math.sin(t * 1.2) * 0.5 + 0.5;
        const scale = 1.2 + breath * 0.15;
        glowOuterRef.current.scale.setScalar(scale);
        mat.opacity = 0.02 + breath * 0.06;
      } else if (isThinking) {
        mat.opacity = 0.03 + Math.sin(t * 4) * 0.02;
      } else {
        glowOuterRef.current.scale.setScalar(1);
        mat.opacity = 0.04;
      }
    }

    // ── Shells: spin faster when thinking ──
    if (shell1Ref.current) {
      shell1Ref.current.rotation.x = t * shellSpeed;
      shell1Ref.current.rotation.y = t * shellSpeed * 1.5;
      shell1Ref.current.rotation.z = t * shellSpeed * 0.5;
      const mat = shell1Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isActive ? 0.25 : 0.12;
    }

    if (shell2Ref.current) {
      shell2Ref.current.rotation.x = -t * shell2Speed;
      shell2Ref.current.rotation.y = -t * shell2Speed * 1.7;
      shell2Ref.current.rotation.z = t * shell2Speed * 0.8;
      const mat = shell2Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isActive ? 0.15 : 0.06;
    }

    // ── Rings: voice echo ripples when speaking ──
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.sin(t * 0.5) * 0.3 + Math.PI * 0.5;
      ring1Ref.current.rotation.y = t * 0.3;

      if (isSpeaking) {
        // Echo pulse: rings expand outward rhythmically
        const echo = Math.sin(t * 1.2) * 0.5 + 0.5;
        ring1Ref.current.scale.setScalar(1 + echo * 0.15);
        const mat = ring1Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.3 + echo * 0.4;
      } else if (isThinking) {
        ring1Ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
        const mat = ring1Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.5;
      } else {
        ring1Ref.current.scale.setScalar(1 + Math.sin(t * 1) * 0.05);
        const mat = ring1Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.4;
      }
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.cos(t * 0.4) * 0.3 + Math.PI * 0.35;
      ring2Ref.current.rotation.z = t * 0.25;

      if (isSpeaking) {
        // Offset echo: slightly delayed
        const echo = Math.sin(t * 1.2 + 1) * 0.5 + 0.5;
        ring2Ref.current.scale.setScalar(1 + echo * 0.12);
        const mat = ring2Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.15 + echo * 0.3;
      } else if (isThinking) {
        ring2Ref.current.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
        const mat = ring2Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.35;
      } else {
        ring2Ref.current.scale.setScalar(1 + Math.cos(t * 1) * 0.05);
        const mat = ring2Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.25;
      }
    }

    // ── Third echo ring (only visible during speaking) ──
    if (ring3Ref.current) {
      if (isSpeaking) {
        const echo = Math.sin(t * 1.2 + 2) * 0.5 + 0.5;
        ring3Ref.current.scale.setScalar(1 + echo * 0.1);
        ring3Ref.current.rotation.x = Math.sin(t * 0.3) * 0.2 + Math.PI * 0.65;
        ring3Ref.current.rotation.z = -t * 0.2;
        const mat = ring3Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.1 + echo * 0.2;
      } else {
        ring3Ref.current.scale.setScalar(1);
        const mat = ring3Ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.05;
      }
    }

    // ── Inner particles: orbit speed tied to state ──
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * (isThinking ? 0.3 : isListening ? 0.25 : 0.08);
      const positions = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < innerCount; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        if (isSpeaking) {
          // Breathing: particles drift in/out
          const breath = Math.sin(t * 1.2) * 0.5 + 0.5;
          const drift = breath * 0.0003;
          const dist = Math.sqrt(x * x + z * z);
          const push = dist > 1.9 ? -drift : drift;
          const dx = x / dist * push;
          const dz = z / dist * push;
          positions.setX(i, x + dx);
          positions.setZ(i, z + dz);
        }

        const cos = Math.cos(particleOrbSpeed);
        const sin = Math.sin(particleOrbSpeed);
        positions.setX(i, positions.getX(i) * cos - positions.getZ(i) * sin);
        positions.setZ(i, positions.getX(i) * sin + positions.getZ(i) * cos);
      }
      positions.needsUpdate = true;
    }

    // ── Outer particles ──
    if (outerParticlesRef.current) {
      const outerSpeed = isThinking ? 0.08 : 0.02;
      outerParticlesRef.current.rotation.y = t * outerSpeed;
      outerParticlesRef.current.rotation.x = t * outerSpeed * 0.5;
    }
  });

  return (
    <group>
      {/* Point light for glow */}
      <pointLight
        color={colors.glow}
        intensity={isThinking ? 6 : isSpeaking ? 4 : isListening ? 5 : 3}
        distance={10}
      />

      {/* Core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={colors.core}
          emissive={colors.core}
          emissiveIntensity={0.8}
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Inner glow layer */}
      <mesh ref={glowInnerRef}>
        <sphereGeometry args={[1.08, 32, 32]} />
        <meshBasicMaterial
          color={colors.core}
          transparent
          opacity={0.08}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Fresnel glow shell */}
      <mesh ref={glowOuterRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color={colors.core}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Wireframe icosahedron */}
      <mesh ref={shell1Ref}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshBasicMaterial
          color={colors.core}
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Wireframe octahedron (counter-rotating) */}
      <mesh ref={shell2Ref}>
        <octahedronGeometry args={[2.0, 0]} />
        <meshBasicMaterial
          color={colors.core}
          wireframe
          transparent
          opacity={0.06}
        />
      </mesh>

      {/* Energy ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.5, 0.01, 16, 100]} />
        <meshBasicMaterial
          color={colors.core}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Energy ring 2 */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.7, 0.008, 16, 100]} />
        <meshBasicMaterial
          color={colors.core}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Energy ring 3 — echo ring */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[2.0, 0.006, 16, 100]} />
        <meshBasicMaterial
          color={colors.core}
          transparent
          opacity={0.05}
        />
      </mesh>

      {/* Inner particle ring */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[innerPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={colors.core}
          size={0.015}
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Outer sparse particles */}
      <points ref={outerParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[outerPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={colors.core}
          size={0.03}
          transparent
          opacity={0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
