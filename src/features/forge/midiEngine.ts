import { Midi } from '@tonejs/midi'

type GenerateMidiOptions = {
  chordNames: string[]
  bars: number
  tempo: number
}

const TICKS_PER_BEAT = 480
const BEATS_PER_BAR = 4
const BAR_TICKS = TICKS_PER_BEAT * BEATS_PER_BAR

const ROOT_SEMITONES: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
}

const buildTriad = (chordName: string) => {
  const match = chordName.match(/^([A-G](?:#|b)?)(.*)$/)
  if (!match) return [60, 64, 67]

  const [, root, suffix] = match
  const rootSemitone = ROOT_SEMITONES[root]
  if (rootSemitone === undefined) return [60, 64, 67]

  const normalizedSuffix = suffix.toLowerCase()
  const intervals = normalizedSuffix.startsWith('dim')
    ? [0, 3, 6]
    : normalizedSuffix.startsWith('aug')
      ? [0, 4, 8]
      : normalizedSuffix.startsWith('m')
        ? [0, 3, 7]
        : [0, 4, 7]

  const rootMidi = 60 + rootSemitone
  return intervals.map((interval) => rootMidi + interval)
}

const getBassRoot = (chordName: string) => {
  const match = chordName.match(/^([A-G](?:#|b)?)/)
  if (!match) return 36

  const rootSemitone = ROOT_SEMITONES[match[1]]
  if (rootSemitone === undefined) return 36

  return 36 + rootSemitone
}

export function generateMidi({ chordNames, bars, tempo }: GenerateMidiOptions) {
  const midi = new Midi()
  midi.header.setTempo(tempo)

  const chordTrack = midi.addTrack()
  chordTrack.name = 'Chords'

  const bassTrack = midi.addTrack()
  bassTrack.name = 'Bass'

  for (let barIndex = 0; barIndex < bars; barIndex += 1) {
    const chordName = chordNames[barIndex % chordNames.length]
    const barStart = barIndex * BAR_TICKS

    for (const midiNote of buildTriad(chordName)) {
      chordTrack.addNote({
        midi: midiNote,
        ticks: barStart,
        durationTicks: BAR_TICKS,
        velocity: 0.7,
      })
    }

    bassTrack.addNote({
      midi: getBassRoot(chordName),
      ticks: barStart,
      durationTicks: BAR_TICKS,
      velocity: 0.8,
    })
  }

  return midi.toArray()
}
