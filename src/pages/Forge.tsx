import { useState } from 'react'
import { generateMidi } from '../features/forge/midiEngine'
import { generateProgression } from '../features/forge/progressionEngine'

const GENRES = ['Afro', 'LoFi', 'RnBPop', 'Trap'] as const
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const SCALES = ['Major', 'Minor', 'Dorian'] as const
const BARS = [2, 4, 8] as const
const COMPLEXITIES = ['Simple', 'Medium', 'Spicy'] as const

const GENRE_LABELS: Record<(typeof GENRES)[number], string> = {
  Afro: 'Afro',
  LoFi: 'Lo-Fi',
  RnBPop: 'R&B/Pop',
  Trap: 'Trap',
}

export default function Forge() {
  const [genre, setGenre] = useState<(typeof GENRES)[number]>('Afro')
  const [key, setKey] = useState<(typeof KEYS)[number]>('C')
  const [scale, setScale] = useState<(typeof SCALES)[number]>('Minor')
  const [bars, setBars] = useState<(typeof BARS)[number]>(4)
  const [complexity, setComplexity] = useState<(typeof COMPLEXITIES)[number]>('Medium')
  const [humanize, setHumanize] = useState(45)
  const [seed, setSeed] = useState(4242)
  const [generated, setGenerated] = useState<{ romanNumerals: string[]; chordNames: string[] } | null>(null)
  const [midiData, setMidiData] = useState<Uint8Array | null>(null)

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1_000_000))
  }

  const handleGenerate = () => {
    const result = generateProgression({
      genre,
      key,
      scale,
      bars,
      complexity,
      seed,
    })

    setGenerated(result)
    setMidiData(
      generateMidi({
        chordNames: result.chordNames,
        bars,
        tempo: 120,
      }),
    )
  }

  const handleDownloadMidi = () => {
    if (!midiData) return

    const blob = new Blob([midiData], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'omniforge.mid'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="forge-layout">
      <aside className="forge-panel card">
        <h2>Forge Controls</h2>
        <p>Shape your progression ritual before summoning notes.</p>

        <div className="forge-controls">
          <label className="forge-field">
            <span>Genre</span>
            <select value={genre} onChange={(event) => setGenre(event.target.value as (typeof GENRES)[number])}>
              {GENRES.map((option) => (
                <option key={option} value={option}>
                  {GENRE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="forge-field">
            <span>Key</span>
            <select value={key} onChange={(event) => setKey(event.target.value as (typeof KEYS)[number])}>
              {KEYS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="forge-field">
            <span>Scale</span>
            <select value={scale} onChange={(event) => setScale(event.target.value as (typeof SCALES)[number])}>
              {SCALES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="forge-field">
            <span>Bars</span>
            <select value={bars} onChange={(event) => setBars(Number(event.target.value) as (typeof BARS)[number])}>
              {BARS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="forge-field">
            <span>Complexity</span>
            <select
              value={complexity}
              onChange={(event) => setComplexity(event.target.value as (typeof COMPLEXITIES)[number])}
            >
              {COMPLEXITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="forge-field">
            <span>Humanize: {humanize}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={humanize}
              onChange={(event) => setHumanize(Number(event.target.value))}
            />
          </label>

          <div className="forge-field">
            <span>Seed</span>
            <div className="forge-seed-row">
              <input
                type="number"
                value={seed}
                onChange={(event) => setSeed(Number(event.target.value) || 0)}
              />
              <button type="button" onClick={randomizeSeed}>
                Randomize
              </button>
            </div>
          </div>

          <button type="button" className="forge-generate-button" onClick={handleGenerate}>
            Generate
          </button>
          <button type="button" onClick={handleDownloadMidi} disabled={!midiData}>
            Download MIDI
          </button>
        </div>
      </aside>

      <div className="forge-preview card">
        <h2>Generated Progression</h2>
        <div className="forge-output card">
          {generated ? (
            <>
              <p>
                <strong>Roman Numerals:</strong> {generated.romanNumerals.join(' • ')}
              </p>
              <p>
                <strong>Chord Names:</strong> {generated.chordNames.join(' • ')}
              </p>
            </>
          ) : (
            <p>No progression generated yet. Choose settings and press Generate to begin.</p>
          )}
        </div>
      </div>
    </section>
  )
}
