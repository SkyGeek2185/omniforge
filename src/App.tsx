import { Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

function HomePage() {
  return <h2>Home</h2>
}

function AboutPage() {
  return <h2>About</h2>
}

export default function App() {
  return (
    <>
      <header>
        <h1>Vite + React + TypeScript</h1>
        <nav>
          <Link to="/">Home</Link> | <Link to="/about">About</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
