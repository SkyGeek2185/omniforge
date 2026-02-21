import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'

function HomePage() {
  return (
    <section className="card">
      <h1>Dark Mythic Control Deck</h1>
      <p>
        Shape intelligence into artifacts with precision workflows and a calm,
        electric glow.
      </p>
    </section>
  )
}

function ForgePage() {
  return (
    <section className="card">
      <h2>Forge</h2>
      <p>Initiate your next pipeline, deploy blueprints, or tune system skills.</p>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
        <button type="button">Start Forge</button>
        <button type="button" className="button">
          View Templates
        </button>
      </div>
    </section>
  )
}

function AboutPage() {
  return (
    <section className="card">
      <h2>About</h2>
      <p>
        OMNIFORGE blends modern operator UX with a mythic visual language for
        high-signal technical work.
      </p>
    </section>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/forge" element={<ForgePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
