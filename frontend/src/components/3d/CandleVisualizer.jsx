import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function SpinningCandle({ isGreen }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta * 0.5
  })

  const color = isGreen ? '#00f5a0' : '#ff2d55'
  
  return (
    <group ref={meshRef}>
      {/* Wick */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 4, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Body */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 2, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} opacity={0.9} transparent />
      </mesh>
    </group>
  )
}

export default function CandleVisualizer({ isGreen = true }) {
  return (
    <div className="w-full h-full min-h-[200px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <SpinningCandle isGreen={isGreen} />
        <OrbitControls enableZoom={false} autoRotate={false} />
      </Canvas>
    </div>
  )
}
