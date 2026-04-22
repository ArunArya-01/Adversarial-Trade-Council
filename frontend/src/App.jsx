import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Hub from './pages/Hub'
import Academy from './pages/Academy'
import WarRoom from './pages/WarRoom'
import NewsDesk from './pages/NewsDesk'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/hub" replace />} />
          <Route path="hub" element={<Hub />} />
          <Route path="academy" element={<Academy />} />
          <Route path="war-room" element={<WarRoom />} />
          <Route path="news" element={<NewsDesk />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
