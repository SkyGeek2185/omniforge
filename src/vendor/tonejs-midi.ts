type NoteOptions = {
  midi: number
  ticks: number
  durationTicks: number
  velocity?: number
  channel?: number
}

type MidiEvent = {
  ticks: number
  type: 'noteOn' | 'noteOff'
  note: number
  velocity: number
  channel: number
}

const HEADER_CHUNK = [0x4d, 0x54, 0x68, 0x64]
const TRACK_CHUNK = [0x4d, 0x54, 0x72, 0x6b]
const TICKS_PER_BEAT = 480

const toVariableLength = (value: number) => {
  let buffer = value & 0x7f
  const bytes: number[] = []

  while ((value >>= 7) > 0) {
    buffer <<= 8
    buffer |= (value & 0x7f) | 0x80
  }

  while (true) {
    bytes.push(buffer & 0xff)
    if (buffer & 0x80) {
      buffer >>= 8
    } else {
      break
    }
  }

  return bytes
}

const toUint32 = (value: number) => [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]

const clampMidi = (value: number) => Math.max(0, Math.min(127, Math.round(value)))
const clampVelocity = (value: number) => Math.max(0, Math.min(127, Math.round(value * 127)))
const clampChannel = (value: number) => Math.max(0, Math.min(15, Math.round(value)))

class MidiTrack {
  name = ''
  private events: MidiEvent[] = []

  private toTrackNameData() {
    if (!this.name) return []

    const nameBytes = Array.from(new TextEncoder().encode(this.name))
    return [0x00, 0xff, 0x03, ...toVariableLength(nameBytes.length), ...nameBytes]
  }

  addNote({ midi, ticks, durationTicks, velocity = 0.8, channel = 0 }: NoteOptions) {
    this.events.push({
      ticks,
      type: 'noteOn',
      note: clampMidi(midi),
      velocity: clampVelocity(velocity),
      channel: clampChannel(channel),
    })

    this.events.push({
      ticks: ticks + durationTicks,
      type: 'noteOff',
      note: clampMidi(midi),
      velocity: 0,
      channel: clampChannel(channel),
    })
  }

  toTrackData() {
    const sorted = [...this.events].sort((a, b) => {
      if (a.ticks !== b.ticks) return a.ticks - b.ticks
      if (a.type === b.type) return 0
      return a.type === 'noteOff' ? -1 : 1
    })

    const data: number[] = this.toTrackNameData()
    let previousTick = 0

    for (const event of sorted) {
      const delta = event.ticks - previousTick
      data.push(...toVariableLength(delta))
      data.push((event.type === 'noteOn' ? 0x90 : 0x80) + event.channel, event.note, event.velocity)
      previousTick = event.ticks
    }

    data.push(0x00, 0xff, 0x2f, 0x00)
    return data
  }
}

class MidiHeader {
  private tempo = 120

  setTempo(bpm: number) {
    this.tempo = Math.max(1, bpm)
  }

  toTempoTrackData() {
    const microsecondsPerQuarter = Math.round(60_000_000 / this.tempo)
    return [
      0x00,
      0xff,
      0x51,
      0x03,
      (microsecondsPerQuarter >>> 16) & 0xff,
      (microsecondsPerQuarter >>> 8) & 0xff,
      microsecondsPerQuarter & 0xff,
      0x00,
      0xff,
      0x2f,
      0x00,
    ]
  }
}

export class Midi {
  header = new MidiHeader()
  private tracks: MidiTrack[] = []

  addTrack() {
    const track = new MidiTrack()
    this.tracks.push(track)
    return track
  }

  toArray() {
    const trackData = [this.header.toTempoTrackData(), ...this.tracks.map((track) => track.toTrackData())]

    const bytes: number[] = [
      ...HEADER_CHUNK,
      ...toUint32(6),
      0x00,
      0x01,
      0x00,
      trackData.length,
      (TICKS_PER_BEAT >>> 8) & 0xff,
      TICKS_PER_BEAT & 0xff,
    ]

    for (const data of trackData) {
      bytes.push(...TRACK_CHUNK, ...toUint32(data.length), ...data)
    }

    return new Uint8Array(bytes)
  }
}
