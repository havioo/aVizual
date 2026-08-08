export class AudioAnalyzer {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaElementAudioSourceNode | null = null
  private dataArray: Uint8Array | null = null
  private gainNode: GainNode | null = null

  // Why not just use React state? Because audio data needs to be polled at 60fps
  // inside the requestAnimationFrame loop. Pushing this through React's tree
  // would murder the garbage collector.

  public init(videoElement: HTMLVideoElement) {
    if (this.ctx) return // Already initialized

    // Handle vendor prefixes for Safari
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    this.ctx = new AudioContextClass()

    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 512
    this.analyser.smoothingTimeConstant = 0.8

    // We must route the video element's audio through the Web Audio API graph
    this.source = this.ctx.createMediaElementSource(videoElement)
    this.gainNode = this.ctx.createGain()

    // Route: Media -> Analyser -> Gain -> Destination (Speakers)
    this.source.connect(this.analyser)
    this.analyser.connect(this.gainNode)
    this.gainNode.connect(this.ctx.destination)

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
  }

  public getFftData(): Uint8Array {
    if (!this.analyser || !this.dataArray) {
      // Fallback empty array if context isn't ready
      return new Uint8Array(256)
    }
    this.analyser.getByteFrequencyData(this.dataArray as any)
    return this.dataArray
  }

  public getAverageBass(): number {
    const data = this.getFftData()
    // A pragmatic approach: average the first 10 bins (low frequencies)
    let sum = 0
    for (let i = 0; i < 10; i++) {
      sum += data[i]
    }
    return sum / 10.0 / 255.0 // Normalized 0.0 - 1.0
  }

  public getHighs(): number {
    const data = this.getFftData()
    // Average bins 200-240 for high frequencies
    let sum = 0
    for (let i = 200; i < 240; i++) {
      sum += data[i]
    }
    return sum / 40.0 / 255.0
  }

  public resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setVolume(val: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = val
    }
  }

  public destroy() {
    if (this.source) this.source.disconnect()
    if (this.analyser) this.analyser.disconnect()
    if (this.gainNode) this.gainNode.disconnect()
    if (this.ctx) this.ctx.close()
  }
}

export const audioAnalyzer = new AudioAnalyzer()
