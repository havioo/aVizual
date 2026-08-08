#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D u_moshTexture;
uniform sampler2D u_asciiAtlas;
uniform float u_charCount;
uniform float u_gridSize;
uniform float u_bass;
uniform vec2 u_resolution;
uniform float u_time;
uniform int u_enablePixelate;
uniform int u_enableAscii;

// A pseudo-random function for noise
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    // Phase 2: Pixel Restructuring & Downsampling
    // Snap UVs to discrete grid cells based on aspect ratio
    float aspect = u_resolution.x / u_resolution.y;
    vec2 gridCount = vec2(u_gridSize * aspect, u_gridSize);
    
    vec2 gridUv;
    vec2 localUv;

    if (u_enablePixelate == 1) {
        gridUv = floor(vUv * gridCount) / gridCount;
        localUv = fract(vUv * gridCount);
    } else {
        gridUv = vUv;
        localUv = vec2(0.5); 
    }
    
    // Dynamic chromatic aberration driven by bass
    float caOffset = (u_bass * u_bass) * 0.02;
    float r = texture(u_moshTexture, gridUv + vec2(caOffset, 0.0)).r;
    float g = texture(u_moshTexture, gridUv).g;
    float b = texture(u_moshTexture, gridUv - vec2(caOffset, 0.0)).b;
    vec3 pixelColor = vec3(r, g, b);

    if (u_enableAscii == 0) {
        outColor = vec4(pixelColor, 1.0);
        return;
    }

    // Phase 3: ASCII Luminance Remapping
    float luminance = dot(pixelColor, vec3(0.299, 0.587, 0.114));
    
    // Add a bit of noise to break up solid blocks when bass hits hard
    luminance += (random(gridUv + u_time) - 0.5) * u_bass * 0.3;
    luminance = clamp(luminance, 0.0, 1.0);
    
    // Map luminance to a distinct character index [0, u_charCount - 1]
    float charIndex = floor(luminance * (u_charCount - 1.0));
    
    // Sample from the literal ASCII texture atlas.
    // The atlas contains `u_charCount` characters arranged horizontally.
    // We map localUv.x into the horizontal slice for `charIndex`.
    vec2 atlasUv;
    atlasUv.x = (charIndex + localUv.x) / u_charCount;
    atlasUv.y = localUv.y;
    
    // The atlas is white text on black background, we extract the red channel.
    float shape = texture(u_asciiAtlas, atlasUv).r;
    
    // Final composite: tint the ASCII character with the original moshed color
    outColor = vec4(pixelColor * shape * 1.5, 1.0);
}
