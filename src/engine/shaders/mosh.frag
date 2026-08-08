#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D u_video;
uniform sampler2D u_prevFrame;

uniform float u_bass;
uniform float u_highs;
uniform float u_moshDecay;
uniform float u_moshThreshold;
uniform float u_time;
uniform vec2 u_resolution;
uniform int u_enableMosh;

void main() {
    vec4 currentFrame = texture(u_video, vUv);
    
    if (u_enableMosh == 0) {
        outColor = currentFrame;
        return;
    }
    
    // Calculate a naive motion vector by comparing luminance difference
    // A proper optical flow is too heavy for 4k real-time without a compute shader.
    // We'll use a pragmatic difference thresholding approach.
    vec4 prevFrame = texture(u_prevFrame, vUv);
    
    float lumCurr = dot(currentFrame.rgb, vec3(0.299, 0.587, 0.114));
    float lumPrev = dot(prevFrame.rgb, vec3(0.299, 0.587, 0.114));
    
    float delta = abs(lumCurr - lumPrev);
    
    // When the bass hits the threshold, we trigger the "moshing"
    // by offsetting the UV coordinates based on the delta.
    vec2 moshOffset = vec2(0.0);
    
    if (u_bass > u_moshThreshold && delta > 0.05) {
        // Bleed pixels along the gradient of the luminance
        float dx = dFdx(lumCurr);
        float dy = dFdy(lumCurr);
        moshOffset = vec2(dx, dy) * (u_bass * 0.1);
    }
    
    vec2 sampledUv = vUv - moshOffset;
    
    // Keep it clamped to prevent edge bleeding artifacts
    sampledUv = clamp(sampledUv, 0.0, 1.0);
    
    vec4 moshedPrev = texture(u_prevFrame, sampledUv);
    
    // Combine current and previous frame. 
    // High decay = image freezes/trails. Low decay = normal video.
    // If audio spikes, we force inject the new frame to prevent complete mud.
    float mixFactor = mix(0.1, u_moshDecay, smoothstep(0.8, 1.0, 1.0 - u_highs));
    
    vec4 finalColor = mix(currentFrame, moshedPrev, mixFactor);
    
    outColor = finalColor;
}
