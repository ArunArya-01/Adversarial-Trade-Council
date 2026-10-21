import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Learn from './pages/Learn'
import Practice from './pages/Practice'
import News from './pages/News'
import LabDashboard from './modules/lab/pages/LabDashboard'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/academy/learn" replace />} />
          <Route path="academy">
            <Route index element={<Navigate to="learn" replace />} />
            <Route path="learn" element={<Learn />} />
            <Route path="practice" element={<Practice />} />
            <Route path="news" element={<News />} />
          </Route>
          <Route path="lab" element={<LabDashboard />} />
          <Route path="learn" element={<Navigate to="/academy/learn" replace />} />
          <Route path="practice" element={<Navigate to="/academy/practice" replace />} />
          <Route path="news" element={<Navigate to="/academy/news" replace />} />
          <Route path="*" element={<Navigate to="/academy/learn" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
