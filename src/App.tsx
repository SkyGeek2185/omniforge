import { NavLink, Route, Routes } from 'react-router-dom';

function Home() {
  return (
    <section>
      <h1>Home</h1>
      <p>Welcome to OmniForge.</p>
    </section>
  );
}

function Forge() {
  return (
    <section>
      <h1>Forge</h1>
      <p>Use this generator route to build new artifacts.</p>
    </section>
  );
}

function About() {
  return (
    <section>
      <h1>About</h1>
      <p>OmniForge is a starter React + Vite + TypeScript app.</p>
    </section>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/forge">Forge</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}
