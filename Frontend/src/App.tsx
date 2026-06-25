import { Routes, Route } from 'react-router-dom'
import QueuePage from './pages/QueuePage'
import PatientDetailPage from './pages/PatientDetailPage'
import PreviewPage from './pages/PreviewPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<QueuePage />} />
      <Route path="/patient/:id" element={<PatientDetailPage />} />
      <Route path="/preview" element={<PreviewPage />} />
    </Routes>
  )
}
