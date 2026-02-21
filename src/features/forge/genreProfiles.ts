export type GenreProfile = {
  description: string
  progressionTemplates: string[][]
}

export const genreProfiles: Record<'Afro' | 'LoFi' | 'RnBPop' | 'Trap', GenreProfile> = {
  Afro: {
    description: 'Rhythmic and uplifting cycles with major-minor interplay.',
    progressionTemplates: [
      ['I', 'V', 'vi', 'IV'],
      ['ii', 'V', 'I', 'vi'],
      ['vi', 'IV', 'I', 'V'],
      ['I', 'IV', 'ii', 'V'],
    ],
  },
  LoFi: {
    description: 'Warm, nostalgic loops with soft jazz-inspired movement.',
    progressionTemplates: [
      ['ii7', 'V7', 'Imaj7', 'vi7'],
      ['Imaj7', 'III7', 'vi7', 'ii7'],
      ['i7', 'iv7', 'VIImaj7', 'IIImaj7'],
      ['vi7', 'ii7', 'V7', 'Imaj7'],
    ],
  },
  RnBPop: {
    description: 'Emotional, hook-friendly progressions balancing tension and release.',
    progressionTemplates: [
      ['I', 'vi', 'IV', 'V'],
      ['vi', 'IV', 'I', 'V'],
      ['Imaj7', 'V', 'vi7', 'IVmaj7'],
      ['ii7', 'V7', 'Imaj7', 'IVmaj7'],
    ],
  },
  Trap: {
    description: 'Dark, repetitive motifs with minor-key gravity.',
    progressionTemplates: [
      ['i', 'VI', 'III', 'VII'],
      ['i', 'iv', 'v', 'i'],
      ['i', 'VII', 'VI', 'VII'],
      ['i', 'III', 'VII', 'VI'],
    ],
  },
}
