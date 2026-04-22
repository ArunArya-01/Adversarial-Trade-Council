import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Terrain() {
  const meshRef = useRef()
  
  // Create a plane geometry
  const geometry = useMemo(() => new THREE.PlaneGeometry(20, 20, 40, 40), [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const position = geometry.attributes.position
    
    for (let i = 0; i < position.count; i++) {
      const u = position.getX(i)
      const v = position.getY(i)
      
      // Wave effect
      const z = Math.sin(u * 2 + time * 2) * 0.5 + Math.cos(v * 2 + time) * 0.5
      position.setZ(i, z)
    }
    
    position.needsUpdate = true
    meshRef.current.rotation.x = -Math.PI / 2.5
    meshRef.current.position.y = -2
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial 
        color="#00D4FF" 
        wireframe={true} 
        transparent={true} 
        opacity={0.3} 
      />
    </mesh>
  )
}

export default function MarketTerrain() {
  return (
    <div className="w-full h-[300px] bg-void rounded-xl overflow-hidden border border-border">
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <ambientLight intensity={1} />
        <Terrain />
        {/* Simple particle effect (stars/data points) */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={200}
              array={new Float32Array(600).map(() => (Math.random() - 0.5) * 20)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial color="#E2E8F0" size={0.05} />
        </points>
      </Canvas>
    </div>
  )
}
