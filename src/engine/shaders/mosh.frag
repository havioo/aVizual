#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D u_video;
uniform sampler2D u_prevFrame;

uniform float u_time;
uniform float u_bass;
uniform float u_highs;
uniform vec2 u_resolution;
uniform float u_moshDecay;
uniform float u_moshThreshold;
uniform int u_enableMosh;
uniform float u_moshScatter;
uniform float u_edgeGlow;
uniform float u_chromaShift;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    vec4 currentFrame = texture(u_video, vUv);
    
    if (u_enableMosh == 0) {
        outColor = currentFrame;
        return;
    }

    // Simulate true Datamoshing by quantizing into "macroblocks" (like MPEG P-frames)
    float blockSize = max(8.0 - (u_bass * 4.0), 4.0); // Finer pixelation
    vec2 blocks = u_resolution / blockSize;
    vec2 macroUv = floor(vUv * blocks) / blocks;
    
    vec4 macroFrame = texture(u_video, macroUv);
    float macroLum = dot(macroFrame.rgb, vec3(0.299, 0.587, 0.114));
    
    vec2 moshOffset = vec2(0.0);
    
    // We use the color channels of the macroblock to simulate a P-frame motion vector.
    // This creates the iconic blocky, tearing, dragging aesthetic of true datamoshing.
    if (macroLum > u_moshThreshold) {
        vec2 motionVec = (macroFrame.rg - 0.5) * 2.0;
        moshOffset = motionVec * (u_bass * 0.04);
    }
    
    // Apply scatter
    if (u_moshScatter > 0.0) {
        vec2 noiseVec = vec2(random(macroUv + u_time), random(macroUv - u_time)) - 0.5;
        moshOffset -= noiseVec * u_moshScatter * u_bass * 0.05;
    }

    vec2 sampledUv = vUv - moshOffset;
    sampledUv = clamp(sampledUv, 0.0, 1.0);
    
    // Look up the smeared pixels from the PREVIOUS frame
    vec4 prevFrame = texture(u_prevFrame, sampledUv);
    
    // Mix current frame and smeared frame based on audio spikes (I-Frame injection)
    float mixFactor = mix(0.1, u_moshDecay, smoothstep(0.8, 1.0, 1.0 - u_highs));
    vec4 moshedColor = mix(currentFrame, prevFrame, mixFactor);
    
    // Chromatic Aberration
    if (u_chromaShift > 0.0) {
        float shift = u_chromaShift * u_bass * 0.02;
        float r = texture(u_prevFrame, sampledUv + vec2(shift, 0.0)).r;
        float b = texture(u_prevFrame, sampledUv - vec2(shift, 0.0)).b;
        moshedColor.r = mix(moshedColor.r, r, mixFactor);
        moshedColor.b = mix(moshedColor.b, b, mixFactor);
    }
    
    // Edge Glow
    if (u_edgeGlow > 0.0) {
        vec2 texel = 1.0 / u_resolution;
        vec4 cx = texture(u_prevFrame, sampledUv + vec2(texel.x, 0.0)) - texture(u_prevFrame, sampledUv - vec2(texel.x, 0.0));
        vec4 cy = texture(u_prevFrame, sampledUv + vec2(0.0, texel.y)) - texture(u_prevFrame, sampledUv - vec2(0.0, texel.y));
        float edge = length(cx) + length(cy);
        moshedColor.rgb += vec3(edge) * u_edgeGlow * u_highs * 3.0;
    }

    outColor = moshedColor;
}
