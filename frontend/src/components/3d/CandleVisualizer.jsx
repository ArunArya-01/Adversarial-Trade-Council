import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Interactive 3D Japanese Candlestick Anatomy
 * - Thin cylinder for the wick (shadow)
 * - Thicker box for the body
 * - Orbit controls for rotation
 * - Floating labels for educational context
 */

function CandleModel({ isGreen, showLabels = false }) {
  const groupRef = useRef()

  useFrame((state, delta) => {
    if (!showLabels) {
      // Auto-rotate only when used as a decorative widget (Hub)
      groupRef.current.rotation.y += delta * 0.4
    }
  })

  const bodyColor = isGreen ? '#22C55E' : '#EF4444'
  const wickColor = isGreen ? '#16A34A' : '#DC2626'
  const emissiveIntensity = 0.6

  return (
    <group ref={groupRef}>
      {/* ── Upper Wick (Shadow) ── */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.6, 12]} />
        <meshStandardMaterial 
          color={wickColor} 
          emissive={wickColor} 
          emissiveIntensity={0.3} 
          roughness={0.3} 
          metalness={0.7} 
        />
      </mesh>

      {/* ── Body ── */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.7, 2, 0.7]} />
        <meshStandardMaterial 
          color={bodyColor} 
          emissive={bodyColor} 
          emissiveIntensity={emissiveIntensity}
          roughness={0.15}
          metalness={0.85}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* ── Lower Wick (Shadow) ── */}
      <mesh position={[0, -1.8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.6, 12]} />
        <meshStandardMaterial 
          color={wickColor} 
          emissive={wickColor} 
          emissiveIntensity={0.3} 
          roughness={0.3} 
          metalness={0.7} 
        />
      </mesh>

      {/* ── Educational Labels (only in Academy mode) ── */}
      {showLabels && (
        <>
          {/* High label */}
          <Html position={[0.8, 2.6, 0]} center>
            <div className="bg-void/90 border border-gold/30 rounded px-2 py-1 text-[10px] font-mono text-gold whitespace-nowrap backdrop-blur-sm">
              ← HIGH
            </div>
          </Html>

          {/* Open label */}
          <Html position={[1.2, 1.0, 0]} center>
            <div className="bg-void/90 border border-border rounded px-2 py-1 text-[10px] font-mono text-text-muted whitespace-nowrap backdrop-blur-sm">
              ← {isGreen ? 'OPEN' : 'CLOSE'}
            </div>
          </Html>

          {/* Close label */}
          <Html position={[1.2, -1.0, 0]} center>
            <div className="bg-void/90 border border-border rounded px-2 py-1 text-[10px] font-mono text-text-muted whitespace-nowrap backdrop-blur-sm">
              ← {isGreen ? 'CLOSE' : 'OPEN'}
            </div>
          </Html>

          {/* Low label */}
          <Html position={[0.8, -2.6, 0]} center>
            <div className="bg-void/90 border border-gold/30 rounded px-2 py-1 text-[10px] font-mono text-gold whitespace-nowrap backdrop-blur-sm">
              ← LOW
            </div>
          </Html>

          {/* Body label */}
          <Html position={[-1.0, 0, 0]} center>
            <div className="bg-gold/10 border border-gold/40 rounded px-2 py-1 text-[10px] font-mono text-gold font-bold whitespace-nowrap backdrop-blur-sm">
              BODY →
            </div>
          </Html>

          {/* Wick label */}
          <Html position={[-0.8, 2.0, 0]} center>
            <div className="bg-surface/90 border border-border rounded px-2 py-1 text-[10px] font-mono text-text-muted whitespace-nowrap backdrop-blur-sm">
              WICK →
            </div>
          </Html>
        </>
      )}
    </group>
  )
}

export default function CandleVisualizer({ isGreen = true, showLabels = false }) {
  return (
    <div className="w-full h-full min-h-[200px]">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-5, -5, 5]} intensity={0.4} color="#FFD700" />
        <CandleModel isGreen={isGreen} showLabels={showLabels} />
        <OrbitControls 
          enableZoom={showLabels} 
          autoRotate={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI * 3 / 4}
        />
      </Canvas>
    </div>
  )
}
