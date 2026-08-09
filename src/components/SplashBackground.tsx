import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `
#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float u_time;
uniform vec2 u_resolution;

// Simplex noise / FBM
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
    float f = 0.0;
    float w = 0.5;
    for (int i = 0; i < 5; i++) {
        f += w * snoise(p);
        p *= 2.0;
        w *= 0.5;
    }
    return f;
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    // Writhing fluid motion
    float t = u_time * 0.2;
    
    // Domain warping
    vec2 q = vec2(fbm(uv + vec2(0.0, t)), fbm(uv + vec2(1.0, -t)));
    vec2 r = vec2(fbm(uv + 1.0 * q + vec2(1.7, 9.2) + 0.15*t),
                  fbm(uv + 1.0 * q + vec2(8.3, 2.8) - 0.126*t));
                  
    float f = fbm(uv + r);
    
    // Calculate gradients to create sharpened volumetric edges/highlights
    float eps = 0.01;
    float fx = fbm(uv + r + vec2(eps, 0.0));
    float fy = fbm(uv + r + vec2(0.0, eps));
    float edge = length(vec2(fx - f, fy - f)) / eps;
    
    // Colors: Black / Gunmetal / Dark Red
    vec3 colBase = vec3(0.05, 0.05, 0.06); // gunmetal
    vec3 colDeep = vec3(0.0, 0.0, 0.0);    // black
    vec3 colHighlight = vec3(0.6, 0.05, 0.1); // dark red highlight
    
    // Mix based on fbm height
    vec3 color = mix(colDeep, colBase, clamp((f*f)*4.0, 0.0, 1.0));
    
    // Add sharpened volumetric edges
    float edgeIntensity = smoothstep(0.4, 1.2, edge);
    color = mix(color, colHighlight, edgeIntensity * 0.8);
    
    // Add a very slight silver/gunmetal rim light on the hardest edges
    float rim = smoothstep(1.0, 2.0, edge);
    color += vec3(0.8, 0.8, 0.8) * rim * 0.5;

    // Vignette
    float vignette = 1.0 - smoothstep(0.5, 1.5, length(vUv - 0.5));
    color *= vignette;

    outColor = vec4(color, 1.0);
}
`

export function SplashBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2')
    if (!gl) return

    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, VERTEX_SHADER))
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const pos = new Float32Array([
      -1, -1,  1, -1, -1, 1,
      -1,  1,  1, -1,  1, 1
    ])
    
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW)
    
    const loc = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')

    let frameId = 0
    const start = Date.now()

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth * dpr
      const h = window.innerHeight * dpr
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      
      gl.uniform1f(uTime, (Date.now() - start) / 1000)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      frameId = requestAnimationFrame(render)
    }
    
    render()

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full object-cover z-0" 
      style={{ pointerEvents: 'none' }}
    />
  )
}
