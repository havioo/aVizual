# aVizual : ASCii Player

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WebGL](https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)

**aVizual** is a high-performance, real-time video and audio Digital Audio Workstation (DAW) designed for the browser. It ingests video and audio input and applies real-time GLSL video processing, including synchronized datamoshing, true P-frame motion simulation, edge detection, and dynamic ASCII rendering—all driven by live Web Audio API spectral data.

## Architecture

The engine is built on a highly optimized, dual-pass WebGL pipeline leveraging custom GLSL fragment shaders:

1. **Pass 1: Datamoshing & Corruptions (`mosh.frag`)**
   - **MPEG P-Frame Simulation:** Utilizing classic digital datamosh techniques, the video is quantized into dynamic macroblocks (16x16 to 32x32 depending on bass intensity). It extracts raw color data from the video stream to simulate literal P-frame motion vectors. When the bass drops, it simulates dropping I-frames, causing pixels to endlessly drag and smear across the screen along their motion vectors.
   - **Chroma Shift & Mosh Scatter:** Audio-reactive chromatic aberration splits the RGB channels laterally, while scatter noise introduces heavy chaotic jitter to the motion vectors.
   - **Edge Glow:** A Sobel-like edge detection algorithm dynamically traces the sharp outlines of the smeared data, rendering intense edge highlights specifically on high-frequency audio spikes.

2. **Pass 2: True-Color ASCII Remap (`ascii.frag`)**
   - **Dynamic Texture Atlas:** The engine utilizes a hidden 2D canvas to dynamically draw a font atlas of the user's custom ASCII string.
   - **Luminance Mapping:** The shader maps the luminance of the moshed texture directly to a character in the atlas. It normalizes the RGB values to preserve true, vivid colors even on pure white/black boundaries.

State management is handled via **Zustand** outside of the React render loop to guarantee 60FPS WebGL performance.

## Custom ASCII Mapping

The **ASCII Remap** feature relies on a sequence of characters you type into the parameter menu. 

The engine maps the **density** of the image (from darkest to brightest) from **left to right** across your string.
- **Leftmost Characters**: Mapped to the darkest (black) areas of the video. Use sparse characters or spaces (e.g., ` `, `.`, `:`).
- **Rightmost Characters**: Mapped to the brightest (white) areas of the video. Use thick, dense characters (e.g., `#`, `@`, `W`).

**Example:**
Typing ` .:*+oa&#@` means pure black becomes empty space ` `, mid-tones become `+` or `o`, and pure bright highlights become `@`.

## Features

- **Liquid Gunmetal UI:** A deeply stylized, professional gunmetal glassmorphic aesthetic built with TailwindCSS.
- **Butter-Smooth Scrubber:** The video scrubber bypasses native DOM limitations, utilizing a perfect `requestAnimationFrame` loop synced directly to the `seeking` events of the video decoder for millisecond-accurate, stutter-free dragging.
- **Audio-Reactive Datamoshing:** Authentic macroblock tearing and vector smearing that genuinely freezes and bleeds the video frame based on the spectral analysis of the audio track.
- **Vibrant ASCII Engine:** Retains maximum color saturation during ASCII conversion, allowing for fully stylized, hyper-colorful text rendering.

## Quick Setup

Ensure you have Node.js installed.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

---
*Crafted for maximum visual distortion.*
