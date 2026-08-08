# aVizual : ASCii Player

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WebGL](https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)

**aVizual** is a high-performance, real-time video and audio Digital Audio Workstation (DAW) designed for the browser. It ingests video and audio input and applies real-time GLSL video processing, including synchronized datamoshing, pixel restructuring, and dynamic ASCII rendering—all driven by live Web Audio API spectral data.

## Architecture

The engine is built on a highly optimized, dual-pass WebGL pipeline:
1. **Pass 1: Datamosh Filter**. Uses a ping-pong framebuffer to smear motion vectors across the screen based on high/low audio frequencies.
2. **Pass 2: Pixelate & ASCII Remap**. Uses a dynamic 2D canvas texture atlas to map the moshed texture's luminance directly to literal, user-defined ASCII characters in real-time.

State management is handled via **Zustand** outside of the React render loop to guarantee 60FPS WebGL performance without React thrashing.

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

## Features
- **Liquid Glass UI:** Draggable, translucent iOS-style control surfaces.
- **True ASCII Atlas:** Type any sequence of characters into the params menu, and the shader instantly regenerates its texture atlas to use your exact symbols.
- **Audio-Reactive Smearing:** Datamoshing decay thresholds react directly to bass and high frequencies.

---
*Crafted for maximum visual distortion.*
