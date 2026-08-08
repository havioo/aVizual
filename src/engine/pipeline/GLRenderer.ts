import { useEngineStore } from '../../store/useEngineStore'
import { audioAnalyzer } from '../audio/AudioAnalyzer'
import mainVert from '../shaders/main.vert'
import moshFrag from '../shaders/mosh.frag'
import asciiFrag from '../shaders/ascii.frag'

export class GLRenderer {
  private gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private video: HTMLVideoElement | null = null

  private moshProgram: WebGLProgram
  private asciiProgram: WebGLProgram
  
  private videoTexture: WebGLTexture
  private asciiAtlasTexture: WebGLTexture

  // Ping-pong framebuffers for datamoshing memory
  private textureA: WebGLTexture
  private fbA: WebGLFramebuffer
  private textureB: WebGLTexture
  private fbB: WebGLFramebuffer
  
  private isPing = true

  private animationFrameId = 0
  private startTime = Date.now()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true })
    if (!gl) throw new Error('WebGL2 not supported')
    this.gl = gl

    // Compile shaders
    this.moshProgram = this.createProgram(mainVert, moshFrag)
    this.asciiProgram = this.createProgram(mainVert, asciiFrag)

    // Fullscreen quad
    const vertices = new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ])
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    
    // We assume both programs use 'position' at location 0
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    // Setup Textures & Framebuffers
    this.videoTexture = this.createTexture()
    this.asciiAtlasTexture = this.createTexture()
    
    this.textureA = this.createTexture()
    this.fbA = this.createFramebuffer(this.textureA)
    
    this.textureB = this.createTexture()
    this.fbB = this.createFramebuffer(this.textureB)

    this.resize()
    window.addEventListener('resize', this.resize)
  }

  public setVideo(video: HTMLVideoElement) {
    this.video = video
  }

  public start() {
    this.startTime = Date.now()
    this.render()
  }

  public destroy() {
    cancelAnimationFrame(this.animationFrameId)
    window.removeEventListener('resize', this.resize)
    // GL cleanup...
  }

  private resize = () => {
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.parentElement?.getBoundingClientRect()
    if (!rect) return
    
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)

    // Resize ping-pong buffers
    this.resizeTexture(this.textureA)
    this.resizeTexture(this.textureB)
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader))
      throw new Error('Shader compilation failed')
    }
    return shader
  }

  private createProgram(vertSrc: string, fragSrc: string): WebGLProgram {
    const prog = this.gl.createProgram()!
    this.gl.attachShader(prog, this.createShader(this.gl.VERTEX_SHADER, vertSrc))
    this.gl.attachShader(prog, this.createShader(this.gl.FRAGMENT_SHADER, fragSrc))
    this.gl.linkProgram(prog)
    if (!this.gl.getProgramParameter(prog, this.gl.LINK_STATUS)) {
      throw new Error('Program link failed')
    }
    return prog
  }

  private createTexture(): WebGLTexture {
    const tex = this.gl.createTexture()!
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex)
    // Nearest neighbor is crucial for sharp datamosh & ascii grids
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    return tex
  }

  private resizeTexture(tex: WebGLTexture) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.canvas.width, this.canvas.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)
  }

  private createFramebuffer(tex: WebGLTexture): WebGLFramebuffer {
    const fb = this.gl.createFramebuffer()!
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, tex, 0)
    return fb
  }

  private updateVideoTexture() {
    if (!this.video || this.video.readyState < 2) return
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.videoTexture)
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.video)
  }

  private lastAsciiChars = ''
  
  private updateAsciiAtlas(chars: string) {
    if (this.lastAsciiChars === chars) return
    let safeChars = chars
    if (safeChars.length === 0) safeChars = ' '
    this.lastAsciiChars = safeChars
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const w = 32
    const h = 64
    canvas.width = safeChars.length * w
    canvas.height = h
    
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fff'
    ctx.font = '48px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    for (let i = 0; i < safeChars.length; i++) {
      ctx.fillText(safeChars[i], i * w + w/2, h/2 + 4)
    }
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.asciiAtlasTexture)
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas)
  }

  private render = () => {
    const gl = this.gl
    const time = (Date.now() - this.startTime) / 1000.0

    // 1. Pull dynamic state
    const state = useEngineStore.getState()
    const bass = audioAnalyzer.getAverageBass() * state.audioSensitivity
    const highs = audioAnalyzer.getHighs() * state.audioSensitivity

    this.updateVideoTexture()
    this.updateAsciiAtlas(state.customAscii)

    // 2. PASS 1: Datamosh (Video + Prev Frame) -> Ping Pong Buffer
    gl.useProgram(this.moshProgram)
    
    // Setup ping-pong logic
    const readTex = this.isPing ? this.textureA : this.textureB
    const writeFb = this.isPing ? this.fbB : this.fbA
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFb)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)

    // Bind Uniforms
    gl.uniform1f(gl.getUniformLocation(this.moshProgram, 'u_time'), time)
    gl.uniform1f(gl.getUniformLocation(this.moshProgram, 'u_bass'), bass)
    gl.uniform1f(gl.getUniformLocation(this.moshProgram, 'u_highs'), highs)
    gl.uniform1f(gl.getUniformLocation(this.moshProgram, 'u_moshDecay'), state.moshDecay)
    gl.uniform1f(gl.getUniformLocation(this.moshProgram, 'u_moshThreshold'), state.moshThreshold)
    gl.uniform1i(gl.getUniformLocation(this.moshProgram, 'u_enableMosh'), state.enableMosh ? 1 : 0)
    gl.uniform2f(gl.getUniformLocation(this.moshProgram, 'u_resolution'), this.canvas.width, this.canvas.height)

    // Bind Textures (0: Video, 1: PrevFrame)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture)
    gl.uniform1i(gl.getUniformLocation(this.moshProgram, 'u_video'), 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, readTex)
    gl.uniform1i(gl.getUniformLocation(this.moshProgram, 'u_prevFrame'), 1)

    // Draw Quad
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // 3. PASS 2: ASCII & Pixelate (Ping Pong Buffer) -> Screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.useProgram(this.asciiProgram)

    gl.uniform1f(gl.getUniformLocation(this.asciiProgram, 'u_time'), time)
    gl.uniform1f(gl.getUniformLocation(this.asciiProgram, 'u_bass'), bass)
    gl.uniform1f(gl.getUniformLocation(this.asciiProgram, 'u_gridSize'), state.asciiGridSize)
    gl.uniform1i(gl.getUniformLocation(this.asciiProgram, 'u_enablePixelate'), state.enablePixelate ? 1 : 0)
    gl.uniform1i(gl.getUniformLocation(this.asciiProgram, 'u_enableAscii'), state.enableAscii ? 1 : 0)
    
    // Pass custom ascii length to shader
    const safeChars = state.customAscii || ' '
    gl.uniform1f(gl.getUniformLocation(this.asciiProgram, 'u_charCount'), safeChars.length)
    gl.uniform2f(gl.getUniformLocation(this.asciiProgram, 'u_resolution'), this.canvas.width, this.canvas.height)

    // Bind Textures (0: MoshTex, 1: AsciiAtlas)
    const renderTex = this.isPing ? this.textureB : this.textureA
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, renderTex)
    gl.uniform1i(gl.getUniformLocation(this.asciiProgram, 'u_moshTexture'), 0)
    
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.asciiAtlasTexture)
    gl.uniform1i(gl.getUniformLocation(this.asciiProgram, 'u_asciiAtlas'), 1)

    // Draw Quad
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // Swap buffers for next frame
    this.isPing = !this.isPing

    // Loop
    this.animationFrameId = requestAnimationFrame(this.render)
  }
}
