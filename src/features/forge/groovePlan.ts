import { genreProfiles } from './genreProfiles'

export type GrooveStyle = 'Straight' | 'Swing' | 'AfroPulse' | 'TrapHats' | 'LofiLazy'

type Genre = keyof typeof genreProfiles

type BuildGroovePlanOptions = {
  genre: Genre
  bpm: number
  bars: number
  seed: number
  humanize: number
  grooveStyle: GrooveStyle
}

export type GroovePlan = {
  grooveStyle: GrooveStyle
  bpm: number
  bars: number
  swingAmount: number
  humanizeMs: number
  accentMap16: number[]
  drumTemplate: {
    kick16: number[]
    snare16: number[]
    hat16: number[]
  }
  kick16: number[]
  bass16: number[]
  chord16?: number[]
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

const varyBinaryPattern = (pattern: number[], random: () => number, probability = 0.2) =>
  pattern.map((step) => {
    if (step === 1 && random() < probability * 0.35) return 0
    if (step === 0 && random() < probability) return 1
    return step
  })

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const buildAfroPulseBassTemplate = (random: () => number) => {
  const preferredSteps = [3, 6, 7, 10, 11, 14, 15]
  const weightedPattern = Array.from({ length: 16 }, () => 0)
  const kickSteps = new Set([0, 4, 8, 12])

  weightedPattern[0] = 1

  for (let step = 1; step < weightedPattern.length; step += 1) {
    const preferred = preferredSteps.includes(step)
    const baseProbability = preferred ? 0.72 : 0.18
    const collisionPenalty = kickSteps.has(step) ? 0.14 : 1
    if (random() < baseProbability * collisionPenalty) {
      weightedPattern[step] = 1
    }
  }

  return weightedPattern
}

export function buildGroovePlan({ genre, bpm, bars, seed, humanize, grooveStyle }: BuildGroovePlanOptions): GroovePlan {
  const random = mulberry32(seed)

  const styleTemplates: Record<GrooveStyle, Omit<GroovePlan, 'grooveStyle' | 'bpm' | 'bars' | 'humanizeMs' | 'kick16'>> = {
    Straight: {
      swingAmount: 0,
      accentMap16: [1.15, 0.92, 0.98, 0.9, 1.08, 0.94, 0.96, 0.9, 1.1, 0.92, 0.97, 0.9, 1.12, 0.95, 0.96, 0.91],
      drumTemplate: {
        kick16: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        snare16: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat16: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
      bass16: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    },
    Swing: {
      swingAmount: 0.24,
      accentMap16: [1.2, 0.88, 1, 0.86, 1.06, 0.9, 1.02, 0.86, 1.14, 0.88, 1.01, 0.84, 1.08, 0.9, 1, 0.86],
      drumTemplate: {
        kick16: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
        snare16: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat16: [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0],
      },
      bass16: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
      chord16: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    },
    AfroPulse: {
      swingAmount: 0.12,
      accentMap16: [1.24, 0.92, 0.96, 1.06, 1.24, 0.92, 0.96, 1.06, 1.24, 0.92, 0.96, 1.06, 1.24, 0.92, 0.96, 1.06],
      drumTemplate: {
        kick16: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        snare16: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat16: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      },
      bass16: [1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
      chord16: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    },
    TrapHats: {
      swingAmount: 0.05,
      accentMap16: [1.12, 0.96, 1.05, 0.95, 1.1, 0.96, 1.04, 0.94, 1.13, 0.96, 1.05, 0.95, 1.12, 0.97, 1.05, 0.95],
      drumTemplate: {
        kick16: [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
        snare16: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat16: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      },
      bass16: [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0],
      chord16: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    },
    LofiLazy: {
      swingAmount: 0.18,
      accentMap16: [1.05, 0.9, 0.95, 0.88, 1.03, 0.9, 0.96, 0.88, 1.04, 0.9, 0.95, 0.88, 1.02, 0.9, 0.95, 0.89],
      drumTemplate: {
        kick16: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
        snare16: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        hat16: [1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1],
      },
      bass16: [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
      chord16: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    },
  }

  const template = styleTemplates[grooveStyle]
  const humanizeMs = clamp((humanize / 100) * 25, 0, 25)
  const genreBoost = genre === 'Trap' ? 0.16 : genre === 'Afro' ? 0.12 : 0.08

  const afroPulseStyle = grooveStyle === 'AfroPulse'

  const drumTemplate = {
    kick16: afroPulseStyle ? template.drumTemplate.kick16 : varyBinaryPattern(template.drumTemplate.kick16, random, 0.1),
    snare16: afroPulseStyle
      ? template.drumTemplate.snare16
      : varyBinaryPattern(template.drumTemplate.snare16, random, 0.06),
    hat16: afroPulseStyle
      ? template.drumTemplate.hat16
      : varyBinaryPattern(template.drumTemplate.hat16, random, grooveStyle === 'TrapHats' ? 0.26 : 0.16),
  }

  return {
    grooveStyle,
    bpm,
    bars,
    humanizeMs,
    swingAmount: clamp(template.swingAmount + genreBoost * 0.15, 0, 0.33),
    accentMap16: afroPulseStyle
      ? template.accentMap16
      : template.accentMap16.map((value) => clamp(value + (random() - 0.5) * 0.08, 0.7, 1.3)),
    drumTemplate,
    kick16: drumTemplate.kick16,
    bass16: afroPulseStyle ? buildAfroPulseBassTemplate(random) : varyBinaryPattern(template.bass16, random, 0.12),
    chord16: template.chord16 ? varyBinaryPattern(template.chord16, random, 0.05) : undefined,
  }
}
