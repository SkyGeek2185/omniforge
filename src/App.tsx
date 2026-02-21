import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './layout/Layout'
import About from './pages/About'
import Forge from './pages/Forge'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/forge" element={<Forge />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
