import { useState } from 'react'
import { generateMidi } from '../features/forge/midiEngine'
import { generateProgression } from '../features/forge/progressionEngine'
import type { GroovePlan, GrooveStyle } from '../features/forge/groovePlan'

const GENRES = ['Afro', 'LoFi', 'RnBPop', 'Trap'] as const
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const SCALES = ['Major', 'Minor', 'Dorian'] as const
const BARS = [2, 4, 8] as const
const COMPLEXITIES = ['Simple', 'Medium', 'Spicy'] as const
const GROOVE_STYLES: GrooveStyle[] = ['Straight', 'Swing', 'AfroPulse', 'TrapHats', 'LofiLazy']

const GENRE_LABELS: Record<(typeof GENRES)[number], string> = {
  Afro: 'Afro',
  LoFi: 'Lo-Fi',
  RnBPop: 'R&B/Pop',
  Trap: 'Trap',
}

const EXPORT_TEMPO = 120

const LANE_EXPORTS = [
  { key: 'chords', label: 'Chords' },
  { key: 'bass', label: 'Bass' },
  { key: 'drums', label: 'Drums' },
] as const

export default function Forge() {
  const [genre, setGenre] = useState<(typeof GENRES)[number]>('Afro')
  const [key, setKey] = useState<(typeof KEYS)[number]>('C')
  const [scale, setScale] = useState<(typeof SCALES)[number]>('Minor')
  const [bars, setBars] = useState<(typeof BARS)[number]>(4)
  const [complexity, setComplexity] = useState<(typeof COMPLEXITIES)[number]>('Medium')
  const [humanize, setHumanize] = useState(45)
  const [bassKickLock, setBassKickLock] = useState(20)
  const [seed, setSeed] = useState(4242)
  const [grooveStyle, setGrooveStyle] = useState<GrooveStyle>('Straight')
  const [chordsEnabled, setChordsEnabled] = useState(true)
  const [bassEnabled, setBassEnabled] = useState(true)
  const [drumsEnabled, setDrumsEnabled] = useState(true)
  const [generated, setGenerated] = useState<{ romanNumerals: string[]; chordNames: string[] } | null>(null)
  const [previewPlan, setPreviewPlan] = useState<GroovePlan | null>(null)
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
    const midiResult = generateMidi({
      chordNames: result.chordNames,
      bars,
      tempo: EXPORT_TEMPO,
      seed,
      humanize,
      genre,
      grooveStyle,
      complexity,
      bassKickLock: bassKickLock / 100,
      enabledLanes: {
        chords: chordsEnabled,
        bass: bassEnabled,
        drums: drumsEnabled,
      },
    })
    setMidiData(midiResult.midiData)
    setPreviewPlan(midiResult.groovePlan)
  }

  const downloadMidiFile = (data: Uint8Array, fileName: string) => {
    const blob = new Blob([data], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadFullMidi = () => {
    if (!midiData) return

    downloadMidiFile(midiData, 'omniforge.mid')
  }

  const handleDownloadLanesSeparately = () => {
    if (!generated) return

    for (const lane of LANE_EXPORTS) {
      const enabledLanes = {
        chords: false,
        bass: false,
        drums: false,
      }
      enabledLanes[lane.key] = true

      const laneMidi = generateMidi({
        chordNames: generated.chordNames,
        bars,
        tempo: EXPORT_TEMPO,
        seed,
        humanize,
        genre,
        grooveStyle,
        complexity,
        bassKickLock: bassKickLock / 100,
        enabledLanes,
      })

      downloadMidiFile(laneMidi.midiData, `Omniforge_${lane.label}_${EXPORT_TEMPO}bpm_seed${seed}.mid`)
    }
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
            <span>Groove Style</span>
            <select value={grooveStyle} onChange={(event) => setGrooveStyle(event.target.value as GrooveStyle)}>
              {GROOVE_STYLES.map((option) => (
                <option key={option} value={option}>
                  {option}
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

          <fieldset className="forge-field forge-lane-grid">
            <legend>Lanes</legend>
            <label>
              <input type="checkbox" checked={chordsEnabled} onChange={(event) => setChordsEnabled(event.target.checked)} />
              Chords
            </label>
            <label>
              <input type="checkbox" checked={bassEnabled} onChange={(event) => setBassEnabled(event.target.checked)} />
              Bass
            </label>
            <label>
              <input type="checkbox" checked={drumsEnabled} onChange={(event) => setDrumsEnabled(event.target.checked)} />
              Drums
            </label>
          </fieldset>

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

          <label className="forge-field">
            <span title="0% = syncopated bounce, 100% = full kick unison">Bass-Kick Lock: {bassKickLock}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={bassKickLock}
              title="0% = syncopated bounce, 100% = full kick unison"
              onChange={(event) => setBassKickLock(Number(event.target.value))}
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
          <button type="button" onClick={handleDownloadFullMidi} disabled={!midiData}>
            Download Full MIDI
          </button>
          <button type="button" onClick={handleDownloadLanesSeparately} disabled={!generated}>
            Download Lanes Separately
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

        <div className="forge-output card forge-preview-panel">
          <h3>Groove Preview</h3>
          {previewPlan ? (
            <>
              <p>
                <strong>grooveStyle:</strong> {previewPlan.grooveStyle}
              </p>
              <p>
                <strong>Kick Steps:</strong>{' '}
                {previewPlan.drumTemplate.kick16
                  .map((step, index) => (step ? index + 1 : null))
                  .filter((step): step is number => step !== null)
                  .join(', ')}
              </p>
              <p>
                <strong>Snare Steps:</strong>{' '}
                {previewPlan.drumTemplate.snare16
                  .map((step, index) => (step ? index + 1 : null))
                  .filter((step): step is number => step !== null)
                  .join(', ')}
              </p>
              <p>
                <strong>Bass Active Steps / Bar:</strong> {previewPlan.bass16.filter((step) => step === 1).length}
              </p>
            </>
          ) : (
            <p>Generate to inspect the groove plan.</p>
          )}
        </div>
      </div>
    </section>
  )
}
