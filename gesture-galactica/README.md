# Gesture Galactica

**Gesture Galactica** is a next-generation browser-based space shooter that demonstrates the potential of the modern web stack in 2025. It combines real-time AI computer vision with hardware-accelerated 3D graphics and procedural audio, all running locally in the browser without plugins or backend latency.

## 🎮 How to Play

- **Navigation:** Hold your **Open Palm** in front of the camera. Move your hand left or right to steer the ship.
- **Combat:** Clench your hand into a **Fist** to fire lasers.
- **Goal:** Survive as long as possible, destroy enemies, and maintain hull integrity.

## 🛠️ Technology Stack

The project is built on a "Tech-Proof 2025" architecture, prioritizing standard web APIs and client-side processing for privacy and performance.

### 1. AI & Computer Vision (`@mediapipe/tasks-vision`)

- **Hand Tracking:** Utilizes Google's MediaPipe Gesture Recognizer. Unlike older tensor libraries that required heavy WebGL backend setups, this uses optimized Wasm (WebAssembly) and GPU delegation for sub-millisecond inference.
- **Privacy-First:** The video feed is processed entirely in memory. No image data is ever sent to a server.

### 2. 3D Graphics Engine (`three.js`)

- **WebGL 2.0 Renderer:** Renders thousands of particles, dynamic lighting, and geometric enemies at 60+ FPS.
- **Procedural Assets:** To keep the bundle size microscopic, the game does not load external 3D models (`.gltf` or `.obj`). Every ship, enemy, and bullet is generated mathematically using Three.js Primitives (`ConeGeometry`, `IcosahedronGeometry`, `TetrahedronGeometry`).
- **Particle System:** A custom, performant particle system handles explosions by recycling geometry buffers rather than creating new DOM elements.

### 3. Audio Synthesis (Web Audio API)

- **Asset-Free Sound:** The game contains no `.mp3` or `.wav` files.
- **Procedural Generation:**
  - **Lasers:** Generated using an oscillator with a rapid frequency exponential decay sweep (880Hz → 0Hz).
  - **Music:** A generative ambient drone created by manipulating stereo audio buffers with sine wave mathematics, ensuring the music loops perfectly and never requires a network request.
  - **Spatial Audio:** Sounds are attached to the 3D camera listener, preparing the engine for potential VR/AR upgrades.

### 4. Application Logic (`React 19`)

- **State Management:** Handles the high-level game loop (Init -> Loading -> Playing -> Game Over).
- **Hybrid Loop:** While React manages the UI (HUD, Menus), the 3D game loop runs outside the React render cycle (using `requestAnimationFrame`) to prevent React's reconciliation process from causing frame drops.
- **Ref-Based Communication:** Mutable refs bridge the gap between React's declarative state and Three.js's imperative animation loop.

## 🧠 Design Philosophy

### The "Zero-Asset" Approach

By generating audio and visuals via code:

1.  **Instant Load Times:** No waiting for assets to download.
2.  **Infinite Resolution:** Vector-based geometry looks sharp on 4K screens.
3.  ** malleability:** Enemy colors, shapes, and sounds can be tweaked via variables (`constants.ts`) rather than re-exporting files from Blender or Ableton.

### Separation of Concerns

- **`SpaceShooter.tsx`**: The "Engine". Handles physics, collision detection, WebGL rendering, and audio. It is isolated from the UI to ensure performance.
- **`HUD.tsx`**: The "Interface". Pure React component. Updates at a lower frequency (5-10 times/sec) than the game loop (60 times/sec) to save resources.
- **`App.tsx`**: The "Manager". Controls the flow of the application and handles camera permissions.

## 🚀 Future Roadmap

- **WebXR Support:** The current Three.js setup is ready for VR headsets.
- **Multi-Hand Tracking:** Adding support for dual-wielding or shield mechanics using a second hand.
- **Post-Processing:** Adding Bloom and Motion Blur effects for enhanced visuals.

---

_Powered by React, Three.js, and MediaPipe._
