import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import TopNav from './components/TopNav'
import WarRoom from './components/WarRoom/WarRoom'
import CouncilChamber from './components/Council/CouncilChamber'
import ThoughtLog from './components/Council/ThoughtLog'
import FlightSimulator from './components/FlightSim/FlightSimulator'
import SafetyStack from './components/SafetyStack/SafetyStack'

const PAGE_TRANSITIONS = {
  initial:  { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate:  { opacity: 1, y: 0,  filter: 'blur(0px)' },
  exit:     { opacity: 0, y: -16, filter: 'blur(4px)' },
  transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
}

export default function App() {
  const [activeView, setActiveView] = useState('warroom')

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const map = { '1': 'warroom', '2': 'council', '3': 'flightsim', '4': 'safety' }
      if (map[e.key]) setActiveView(map[e.key])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div id="app-root" style={appStyle}>
      <TopNav activeView={activeView} onNavigate={setActiveView} />

      <main style={mainStyle}>
        <AnimatePresence mode="wait">
          {activeView === 'warroom' && (
            <motion.div key="warroom" {...PAGE_TRANSITIONS} style={pageStyle}>
              <WarRoom />
            </motion.div>
          )}

          {activeView === 'council' && (
            <motion.div key="council" {...PAGE_TRANSITIONS} style={{ ...pageStyle, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0 }}>
              <CouncilChamber />
              <div style={{ borderLeft: '1px solid rgba(0,245,212,0.1)', height: 'calc(100vh - 60px)' }}>
                <ThoughtLog />
              </div>
            </motion.div>
          )}

          {activeView === 'flightsim' && (
            <motion.div key="flightsim" {...PAGE_TRANSITIONS} style={pageStyle}>
              <FlightSimulator />
            </motion.div>
          )}

          {activeView === 'safety' && (
            <motion.div key="safety" {...PAGE_TRANSITIONS} style={pageStyle}>
              <SafetyStack />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Background ambient effect */}
        <div style={ambientStyle} />
      </main>
    </div>
  )
}

const appStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#050A14',
}

const mainStyle = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
}

const pageStyle = {
  position: 'absolute',
  inset: 0,
  overflow: 'hidden',
}

const ambientStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80vw',
  height: '80vh',
  background: 'radial-gradient(ellipse at center, rgba(0,245,212,0.03) 0%, rgba(114,9,183,0.02) 50%, transparent 80%)',
  pointerEvents: 'none',
  zIndex: 0,
}
