import { Midi } from '../../vendor/tonejs-midi'
import { buildGroovePlan, type GroovePlan, type GrooveStyle } from './groovePlan'
import { genreProfiles } from './genreProfiles'

type Genre = keyof typeof genreProfiles
type Complexity = 'Simple' | 'Medium' | 'Spicy'

type GenerateMidiOptions = {
  chordNames: string[]
  bars: number
  tempo: number
  seed: number
  humanize: number
  genre: Genre
  grooveStyle: GrooveStyle
  complexity: Complexity
  bassKickLock: number
  enabledLanes: {
    chords: boolean
    bass: boolean
    drums: boolean
  }
}

type HarmonyInfo = {
  chordNames: string[]
}

export type MidiGenerationResult = {
  midiData: Uint8Array
  groovePlan: GroovePlan
}

const TICKS_PER_BEAT = 480
const BEATS_PER_BAR = 4
const STEPS_PER_BAR = 16
const STEP_TICKS = TICKS_PER_BEAT / 4
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

const mulberry32 = (seed: number) => {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

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

const getBassChordTones = (chordName: string) => {
  const triad = buildTriad(chordName)
  const root = triad[0] - 24
  const third = triad[1] - 24
  const fifth = triad[2] - 24
  return { root, third, fifth }
}

const getStepTicks = (
  barIndex: number,
  stepIndex: number,
  plan: GroovePlan,
  random: () => number,
  humanizeAmount = 1,
) => {
  const swingOffset = stepIndex % 2 === 1 ? STEP_TICKS * plan.swingAmount : 0
  const humanizeTicks = ((random() * 2 - 1) * plan.humanizeMs * humanizeAmount * TICKS_PER_BEAT) / (60_000 / plan.bpm)
  const ticks = barIndex * BAR_TICKS + stepIndex * STEP_TICKS + swingOffset + humanizeTicks
  return Math.max(0, Math.round(ticks))
}


const getScaleSemitonesForChord = (chordName: string) => {
  const isMinor = /(^|[^a-z])m(?!aj)/i.test(chordName)
  return isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]
}

const normalizeToBassRegister = (midi: number, allowOctaveJump: boolean, random: () => number) => {
  let note = midi
  while (note > 48) note -= 12
  while (note < 36) note += 12

  if (allowOctaveJump && random() < 0.22) {
    note = clamp(note + (random() < 0.5 ? -12 : 12), 36, 48)
  }

  return clamp(note, 36, 48)
}

const chordsLane = (chordTrack: ReturnType<Midi['addTrack']>, plan: GroovePlan, harmony: HarmonyInfo, random: () => number) => {
  for (let barIndex = 0; barIndex < plan.bars; barIndex += 1) {
    const chordName = harmony.chordNames[barIndex % harmony.chordNames.length]
    const triad = buildTriad(chordName)

    if (plan.chord16) {
      for (let step = 0; step < STEPS_PER_BAR; step += 1) {
        if (plan.chord16[step] !== 1) continue
        const chordStart = getStepTicks(barIndex, step, plan, random, 0.35)

        for (const note of triad) {
          chordTrack.addNote({
            midi: note,
            ticks: chordStart,
            durationTicks: Math.round(STEP_TICKS * 1.5),
            velocity: 0.6,
          })
        }
      }
      continue
    }

    for (const note of triad) {
      chordTrack.addNote({
        midi: note,
        ticks: getStepTicks(barIndex, 0, plan, random, 0.35),
        durationTicks: BAR_TICKS,
        velocity: 0.65,
      })
    }
  }
}

const bassLane = (
  bassTrack: ReturnType<Midi['addTrack']>,
  plan: GroovePlan,
  harmony: HarmonyInfo,
  complexity: Complexity,
  bassKickLock: number,
  seed: number,
  random: () => number,
) => {
  const allowOctaveJump = complexity === 'Spicy'
  const lockAmount = clamp(bassKickLock, 0, 1)
  const keepAfroPulseTemplate = plan.grooveStyle === 'AfroPulse' && lockAmount < 0.4

  for (let barIndex = 0; barIndex < plan.bars; barIndex += 1) {
    const chordName = harmony.chordNames[barIndex % harmony.chordNames.length]
    const tones = getBassChordTones(chordName)
    const chordTonePool = [tones.root, tones.fifth, tones.third]
    const scaleSemitones = getScaleSemitonesForChord(chordName)
    const rootPitchClass = ((tones.root % 12) + 12) % 12

    const anchorTonePool = [tones.root, tones.fifth]
    const anchorIndex = (seed + barIndex) % anchorTonePool.length
    const anchorMidi = normalizeToBassRegister(anchorTonePool[anchorIndex], allowOctaveJump, random)
    bassTrack.addNote({
      midi: anchorMidi,
      ticks: getStepTicks(barIndex, 0, plan, random, 1),
      durationTicks: Math.round(STEP_TICKS * (random() < 0.6 ? 0.75 : 1.1)),
      velocity: 0.8,
    })

    let pendingResolution = 0

    for (let step = 1; step < STEPS_PER_BAR; step += 1) {
      const syncopatedProbability = plan.bass16[step] === 1 ? 0.82 : 0.18

      let probability = syncopatedProbability
      if (!keepAfroPulseTemplate) {
        if (plan.kick16[step] === 1) {
          const baseProbability = 0.15
          probability = baseProbability + (1 - baseProbability) * lockAmount
        } else {
          const baseProbability = syncopatedProbability
          const reducedProbability = 0
          probability = baseProbability + (reducedProbability - baseProbability) * lockAmount
        }
      }

      probability = clamp(probability, 0, 1)
      if (random() > probability) {
        if (pendingResolution > 0) pendingResolution -= 1
        continue
      }

      const shouldResolve = pendingResolution > 0
      const useChordTone = shouldResolve || random() < 0.6

      let midi: number
      if (useChordTone) {
        midi = chordTonePool[Math.floor(random() * chordTonePool.length)]
        pendingResolution = 0
      } else {
        const scaleSemitone = scaleSemitones[Math.floor(random() * scaleSemitones.length)]
        midi = 36 + ((rootPitchClass + scaleSemitone) % 12)
        pendingResolution = random() < 0.5 ? 1 : 2
      }

      bassTrack.addNote({
        midi: normalizeToBassRegister(midi, allowOctaveJump, random),
        ticks: getStepTicks(barIndex, step, plan, random, 1),
        durationTicks: Math.round(STEP_TICKS * (step % 4 === 0 ? 1.4 : 0.95)),
        velocity: clamp(0.68 + random() * 0.15, 0.55, 0.95),
      })
    }
  }
}

const drumsLane = (drumTrack: ReturnType<Midi['addTrack']>, plan: GroovePlan, random: () => number) => {
  const laneConfigs = [
    { steps: plan.drumTemplate.kick16, midi: 36, baseVelocity: 0.88, duration: STEP_TICKS },
    { steps: plan.drumTemplate.snare16, midi: 38, baseVelocity: 0.82, duration: STEP_TICKS },
    { steps: plan.drumTemplate.hat16, midi: 42, baseVelocity: 0.64, duration: Math.round(STEP_TICKS * 0.7) },
  ]

  for (let barIndex = 0; barIndex < plan.bars; barIndex += 1) {
    for (let step = 0; step < STEPS_PER_BAR; step += 1) {
      for (const config of laneConfigs) {
        if (config.steps[step] !== 1) continue

        const accent = plan.accentMap16[step] ?? 1
        drumTrack.addNote({
          midi: config.midi,
          ticks: getStepTicks(barIndex, step, plan, random),
          durationTicks: config.duration,
          velocity: clamp(config.baseVelocity * accent + (random() - 0.5) * 0.08, 0.2, 1),
          channel: 9,
        })
      }
    }
  }
}

export function generateMidi({
  chordNames,
  bars,
  tempo,
  seed,
  humanize,
  genre,
  grooveStyle,
  complexity,
  bassKickLock,
  enabledLanes,
}: GenerateMidiOptions): MidiGenerationResult {
  const midi = new Midi()
  midi.header.setTempo(tempo)

  const groovePlan = buildGroovePlan({
    genre,
    bpm: tempo,
    bars,
    seed,
    humanize,
    grooveStyle,
  })

  const random = mulberry32(seed + 999)
  const harmony = { chordNames }

  if (enabledLanes.chords) {
    const chordTrack = midi.addTrack()
    chordTrack.name = 'Chords'
    chordsLane(chordTrack, groovePlan, harmony, random)
  }

  if (enabledLanes.bass) {
    const bassTrack = midi.addTrack()
    bassTrack.name = 'Bass'
    bassLane(bassTrack, groovePlan, harmony, complexity, bassKickLock, seed, random)
  }

  if (enabledLanes.drums) {
    const drumTrack = midi.addTrack()
    drumTrack.name = 'Drums'
    drumsLane(drumTrack, groovePlan, random)
  }

  return {
    midiData: midi.toArray(),
    groovePlan,
  }
}
