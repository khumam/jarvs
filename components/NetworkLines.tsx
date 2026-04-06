"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbState } from "@/hooks/useOrbChat";

interface NetworkLinesProps {
  state: OrbState;
}

export function NetworkLines({ state }: NetworkLinesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const nodeCount = 40;
  const connectionDistance = 2.5;

  const { positions, linePositions } = useMemo(() => {
    const nodes: THREE.Vector3[] = [];
    const pos = new Float32Array(nodeCount * 3);

    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3.0 + Math.random() * 1.5;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      nodes.push(new THREE.Vector3(x, y, z));
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }

    const lines: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (nodes[i].distanceTo(nodes[j]) < connectionDistance) {
          lines.push(
            nodes[i].x, nodes[i].y, nodes[i].z,
            nodes[j].x, nodes[j].y, nodes[j].z
          );
        }
      }
    }

    return {
      positions: pos,
      linePositions: new Float32Array(lines),
    };
  }, []);

  const stateColors: Record<OrbState, string> = {
    idle: "#00f0ff",
    listening: "#ff00aa",
    thinking: "#ffaa00",
    speaking: "#00f0ff",
  };

  const isThinking = state === "thinking";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isActive = isThinking || isSpeaking || isListening;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Rotation speed: much faster when thinking
    const rotSpeed = isThinking ? 0.12 : isListening ? 0.08 : isSpeaking ? 0.04 : 0.02;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * rotSpeed;
      groupRef.current.rotation.x = t * rotSpeed * 0.3;
    }

    // Line opacity: echo pulse when speaking
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;

      if (isSpeaking) {
        // Voice echo: waves of brightness
        const echo = Math.sin(t * 1.2) * 0.5 + 0.5;
        mat.opacity = 0.2 + echo * 0.4;
      } else if (isThinking) {
        mat.opacity = 0.35 + Math.sin(t * 6) * 0.1;
      } else if (isListening) {
        mat.opacity = 0.5 + Math.sin(t * 4) * 0.1;
      } else {
        mat.opacity = 0.3 + Math.sin(t * 3) * 0.05;
      }
    }

    // Points: pulse size when active
    if (pointsRef.current) {
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      const baseSize = isActive ? 0.06 : 0.04;

      if (isSpeaking) {
        const echo = Math.sin(t * 1.2) * 0.5 + 0.5;
        mat.size = baseSize + echo * 0.03;
        mat.opacity = 0.5 + echo * 0.3;
      } else if (isThinking) {
        mat.size = baseSize + Math.sin(t * 6) * 0.01;
        mat.opacity = 0.7;
      } else {
        mat.size = baseSize;
        mat.opacity = 0.6;
      }
    }
  });

  const color = stateColors[state];

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.04}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Connection lines */}
      <lineSegments ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
