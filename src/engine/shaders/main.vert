#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
    // Standard full-screen quad mapping.
    // -1 to 1 space translated to 0 to 1 UVs.
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}
