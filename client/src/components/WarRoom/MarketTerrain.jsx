import React, { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MARKET_DATA } from '../../data/mockData'

const TERRAIN_WIDTH = 120
const TERRAIN_HEIGHT = 80
const SEGMENTS_X = 100
const SEGMENTS_Y = 60

export default function MarketTerrain({ symbol = 'NVDA', onReady }) {
  const mountRef = useRef(null)
  const sceneRef = useRef({})

  const candles = useMemo(() => MARKET_DATA[symbol]?.candles || [], [symbol])

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setClearColor(0x050A14, 1)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    // --- Scene ---
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x050A14, 200, 500)

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 1000)
    camera.position.set(0, 80, 160)
    camera.lookAt(0, 0, 0)

    // --- Build terrain from candle data ---
    const geo = new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_HEIGHT, SEGMENTS_X, SEGMENTS_Y)
    geo.rotateX(-Math.PI / 2)

    const prices = candles.slice(-Math.max(SEGMENTS_X + 1, 1)).map(c => c.close)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const range = maxP - minP || 1
    const vertices = geo.attributes.position

    // Build heights + colors
    const colors = []
    for (let i = 0; i <= SEGMENTS_Y; i++) {
      for (let j = 0; j <= SEGMENTS_X; j++) {
        const idx = i * (SEGMENTS_X + 1) + j
        const t = j / SEGMENTS_X
        const priceIdx = Math.floor(t * (prices.length - 1))
        const normalized = (prices[priceIdx] - minP) / range
        // ripple wave overlay for depth
        const wave = Math.sin(j * 0.3 + i * 0.5) * 1.5
        const elevation = normalized * 28 + wave
        vertices.setY(idx, elevation)

        // Color ramp: red (low) → gold (mid) → cyan (high)
        const r = normalized < 0.5 ? 1 : 1 - (normalized - 0.5) * 2
        const g = normalized < 0.5 ? normalized * 2 : 1 - (normalized - 0.5) * 0.5
        const b = normalized > 0.5 ? (normalized - 0.5) * 2 : 0
        colors.push(r, g, b)
      }
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    const mat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      wireframe: false,
      shininess: 40,
      transparent: true,
      opacity: 0.85,
    })
    const terrain = new THREE.Mesh(geo, mat)
    scene.add(terrain)

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00F5D4,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    const wire = new THREE.Mesh(geo.clone(), wireMat)
    wire.position.y = 0.2
    scene.add(wire)

    // --- Grid Floor ---
    const grid = new THREE.GridHelper(300, 40, 0x1A2744, 0x0D1B2A)
    grid.position.y = -2
    scene.add(grid)

    // --- Ambient + Directional Light ---
    scene.add(new THREE.AmbientLight(0x112233, 1.2))
    const dirLight = new THREE.DirectionalLight(0x00F5D4, 2.0)
    dirLight.position.set(50, 80, 40)
    scene.add(dirLight)
    const pinkLight = new THREE.PointLight(0xF72585, 1.5, 100)
    pinkLight.position.set(-40, 30, -20)
    scene.add(pinkLight)
    const purpleLight = new THREE.PointLight(0x7209B7, 1.2, 80)
    purpleLight.position.set(60, 20, 30)
    scene.add(purpleLight)

    // --- Particle Storm System (Volatility) ---
    const particleCount = 600
    const particleGeo = new THREE.BufferGeometry()
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 140
      pos[i * 3 + 1] = Math.random() * 60 + 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const particleMat = new THREE.PointsMaterial({ color: 0x00F5D4, size: 0.4, transparent: true, opacity: 0.5 })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // --- Axes Labels (CSS2D substitute) ---
    // Price spike indicators at peak/trough
    const peakIdx = prices.indexOf(maxP)
    const addSphere = (xNorm, height, color) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 12, 12),
        new THREE.MeshBasicMaterial({ color })
      )
      sphere.position.set((xNorm - 0.5) * TERRAIN_WIDTH, height + 2, 0)
      scene.add(sphere)
    }
    addSphere(peakIdx / prices.length, 28, 0x06FFA5)
    addSphere(prices.indexOf(minP) / prices.length, 3, 0xFF2D55)

    // --- Animation Loop ---
    let frame = 0
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      frame++

      // Slow camera orbit
      const angle = frame * 0.002
      camera.position.x = Math.sin(angle) * 160
      camera.position.z = Math.cos(angle) * 160
      camera.lookAt(0, 10, 0)

      // Particle drift
      const pa = particles.geometry.attributes.position
      for (let i = 0; i < particleCount; i++) {
        pa.setY(i, pa.getY(i) + 0.05)
        if (pa.getY(i) > 70) pa.setY(i, 10)
      }
      pa.needsUpdate = true

      // Ripple terrain slightly
      const pv = terrain.geometry.attributes.position
      for (let i = 0; i <= SEGMENTS_X; i++) {
        const idx = Math.floor(SEGMENTS_Y / 2) * (SEGMENTS_X + 1) + i
        const base = (i % 2 === 0 ? 1 : -1) * Math.sin(frame * 0.03 + i * 0.2) * 0.3
        pv.setY(idx, pv.getY(idx) + base * 0.02)
      }
      pv.needsUpdate = true

      renderer.render(scene, camera)
    }
    animate()
    sceneRef.current = { renderer, scene, camera, animId }
    onReady?.()

    // --- Resize ---
    const onResize = () => {
      if (!el) return
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [symbol, candles])

  return (
    <div ref={mountRef} style={styles.canvas} />
  )
}

const styles = {
  canvas: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
}
