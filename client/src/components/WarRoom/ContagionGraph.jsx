import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { CORRELATION_GRAPH } from '../../data/mockData'

export default function ContagionGraph({ activeNode = 'NVDA', onNodeClick }) {
  const mountRef = useRef(null)
  const sceneRef = useRef({})
  const [hoveredNode, setHoveredNode] = useState(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setClearColor(0x050A14, 1)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050A14, 0.004)

    const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 1000)
    camera.position.set(0, 60, 220)
    camera.lookAt(0, 0, 0)

    // --- Build node meshes ---
    const nodeMeshes = {}
    const nodePositions = {}
    const { nodes, edges } = CORRELATION_GRAPH

    nodes.forEach(node => {
      const isDown = node.change < -1
      const isNeutral = Math.abs(node.change) <= 1
      const color = isDown ? 0xFF2D55 : (isNeutral ? 0xFFD60A : 0x06FFA5)

      // Glow sphere
      const glowGeo = new THREE.SphereGeometry(node.size * 8, 24, 24)
      const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08 })
      const glow = new THREE.Mesh(glowGeo, glowMat)

      // Core sphere
      const coreGeo = new THREE.SphereGeometry(node.size * 5, 24, 24)
      const coreMat = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: isDown ? 0.6 : 0.3,
        shininess: 80,
        transparent: true,
        opacity: 0.9,
      })
      const core = new THREE.Mesh(coreGeo, coreMat)

      const group = new THREE.Group()
      group.add(glow)
      group.add(core)
      group.position.set(node.x, node.y, node.z)
      group.userData = { id: node.id, node }
      scene.add(group)
      nodeMeshes[node.id] = group
      nodePositions[node.id] = new THREE.Vector3(node.x, node.y, node.z)
    })

    // --- Build edge lines ---
    const edgeLines = []
    edges.forEach(edge => {
      const pA = nodePositions[edge.source]
      const pB = nodePositions[edge.target]
      if (!pA || !pB) return

      const points = [pA.clone(), pB.clone()]
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const isHot = edge.weight > 0.8
      const mat = new THREE.LineBasicMaterial({
        color: isHot ? 0xF72585 : 0x00F5D4,
        transparent: true,
        opacity: edge.weight * 0.5,
      })
      const line = new THREE.Line(geo, mat)
      scene.add(line)
      edgeLines.push({ line, mat, edge })
    })

    // --- Lights ---
    scene.add(new THREE.AmbientLight(0x223344, 2))
    const pt1 = new THREE.PointLight(0x00F5D4, 2, 200)
    pt1.position.set(0, 100, 0)
    scene.add(pt1)
    const pt2 = new THREE.PointLight(0xF72585, 1.5, 200)
    pt2.position.set(-100, -50, 50)
    scene.add(pt2)

    // --- Grid ---
    const grid = new THREE.GridHelper(400, 30, 0x0D1B2A, 0x0D1B2A)
    grid.position.y = -80
    scene.add(grid)

    // --- Raycaster for hover ---
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let hoveredId = null
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / el.clientWidth) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / el.clientHeight) * 2 + 1
    }
    el.addEventListener('mousemove', onMouseMove)

    // --- Animation ---
    let frame = 0, animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      frame++

      // Slow orbit
      const angle = frame * 0.003
      camera.position.x = Math.sin(angle) * 220
      camera.position.z = Math.cos(angle) * 220
      camera.lookAt(0, 0, 0)

      // Node pulse & float
      nodes.forEach(node => {
        const g = nodeMeshes[node.id]
        if (!g) return
        const s = 1 + Math.sin(frame * 0.04 + node.x) * 0.08
        g.scale.setScalar(s)
        g.position.y = node.y + Math.sin(frame * 0.02 + node.z * 0.05) * 2
      })

      // Edge pulse for hot edges
      edgeLines.forEach(({ mat, edge }) => {
        const pulse = Math.sin(frame * 0.05) * 0.2 + 0.6
        mat.opacity = edge.weight * pulse * 0.7
      })

      // Raycaster
      raycaster.setFromCamera(mouse, camera)
      const meshes = Object.values(nodeMeshes).map(g => g.children[1])
      const intersects = raycaster.intersectObjects(meshes)
      if (intersects.length > 0) {
        const hit = intersects[0].object.parent
        if (hoveredId !== hit.userData.id) {
          hoveredId = hit.userData.id
          setHoveredNode(hit.userData.node)
          el.style.cursor = 'pointer'
        }
      } else {
        hoveredId = null
        setHoveredNode(null)
        el.style.cursor = 'default'
      }

      renderer.render(scene, camera)
    }
    animate()

    const onClick = () => {
      if (hoveredId) onNodeClick?.(hoveredId)
    }
    el.addEventListener('click', onClick)

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('click', onClick)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} style={styles.canvas} />
      {hoveredNode && (
        <div style={styles.tooltip}>
          <div style={styles.tooltipSymbol}>{hoveredNode.id}</div>
          <div style={styles.tooltipSector}>{hoveredNode.sector}</div>
          <div style={{ color: hoveredNode.change < 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
            {hoveredNode.change > 0 ? '+' : ''}{hoveredNode.change}%
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
            ${hoveredNode.price.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  canvas: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tooltip: {
    position: 'absolute',
    top: 20,
    right: 20,
    background: 'rgba(13,27,42,0.95)',
    border: '1px solid rgba(0,245,212,0.25)',
    borderRadius: 10,
    padding: '12px 16px',
    backdropFilter: 'blur(12px)',
    pointerEvents: 'none',
  },
  tooltipSymbol: {
    fontFamily: 'Space Grotesk, sans-serif',
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#E2E8F0',
  },
  tooltipSector: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.65rem',
    color: '#7A94B0',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
}
