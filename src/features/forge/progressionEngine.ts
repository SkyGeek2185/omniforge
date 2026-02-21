import { genreProfiles } from './genreProfiles'

type Genre = keyof typeof genreProfiles

type Scale = 'Major' | 'Minor' | 'Dorian'
type Complexity = 'Simple' | 'Medium' | 'Spicy'

type GenerateProgressionOptions = {
  genre: Genre
  key: string
  scale: Scale
  bars: number
  complexity: Complexity
  seed: number
}

const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const SCALE_INTERVALS: Record<Scale, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
}

const ROMAN_DEGREE_MAP: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
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

const wrapIndex = (value: number, length: number) => ((value % length) + length) % length

const expandToBars = (template: string[], bars: number) =>
  Array.from({ length: bars }, (_, index) => template[index % template.length])

const applyComplexity = (romanNumeral: string, complexity: Complexity, random: () => number) => {
  if (complexity === 'Simple') {
    return romanNumeral.replace(/(maj)?\d+/gi, '')
  }

  if (complexity === 'Spicy' && !/[0-9]/.test(romanNumeral)) {
    if (random() > 0.66) return `${romanNumeral}9`
    if (random() > 0.33) return `${romanNumeral}7`
  }

  return romanNumeral
}

const romanToChordName = (romanNumeral: string, key: string, scale: Scale) => {
  const match = romanNumeral.match(/^([b#]*)([ivIV]+)([°+]?)(.*)$/)
  if (!match) return romanNumeral

  const [, accidentalPart, romanPart, qualityPart, extensionPart] = match
  const degree = ROMAN_DEGREE_MAP[romanPart.toLowerCase()]
  if (!degree) return romanNumeral

  const accidentalOffset = accidentalPart.split('').reduce((offset, accidental) => {
    if (accidental === '#') return offset + 1
    if (accidental === 'b') return offset - 1
    return offset
  }, 0)

  const keyIndex = CHROMATIC_NOTES.indexOf(key)
  if (keyIndex === -1) return romanNumeral

  const scaleSemitones = SCALE_INTERVALS[scale]
  const semitoneFromKey = scaleSemitones[degree - 1] + accidentalOffset
  const root = CHROMATIC_NOTES[wrapIndex(keyIndex + semitoneFromKey, CHROMATIC_NOTES.length)]

  const normalizedExtension = extensionPart.replace(/^maj/i, 'Maj')
  const quality =
    qualityPart === '°'
      ? 'dim'
      : qualityPart === '+'
        ? 'aug'
        : romanPart === romanPart.toLowerCase()
          ? 'm'
          : ''

  return `${root}${quality}${normalizedExtension}`
}

export function generateProgression({ genre, key, scale, bars, complexity, seed }: GenerateProgressionOptions) {
  const random = mulberry32(seed)
  const profile = genreProfiles[genre]
  const template = profile.progressionTemplates[Math.floor(random() * profile.progressionTemplates.length)]

  const romanNumerals = expandToBars(template, bars).map((numeral) => applyComplexity(numeral, complexity, random))
  const chordNames = romanNumerals.map((numeral) => romanToChordName(numeral, key, scale))

  return {
    romanNumerals,
    chordNames,
  }
}
