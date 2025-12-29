import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { GameStats, GameState } from '../types';
import { GAME_CONFIG, AI_CONFIG } from '../constants';

interface SpaceShooterProps {
  onStatsUpdate: (stats: GameStats) => void;
  onGameStateChange: (state: GameState) => void;
  gameState: GameState;
}

// Procedural Audio Generation Helpers
const createLaserBuffer = (context: AudioContext) => {
  const sampleRate = context.sampleRate;
  const duration = 0.15;
  const buffer = context.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Frequency sweep from 880Hz down to 0
      const frequency = 880 * Math.exp(-15 * t); 
      // Sine wave with linear decay
      data[i] = Math.sin(2 * Math.PI * frequency * t) * (1 - t/duration);
  }
  return buffer;
};

const createMusicBuffer = (context: AudioContext) => {
  const sampleRate = context.sampleRate;
  const duration = 8.0; // 8 seconds loop
  const buffer = context.createBuffer(2, sampleRate * duration, sampleRate);
  
  // Create a deep, throbbing drone
  for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < buffer.length; i++) {
           const t = i / sampleRate;
           // 55Hz (A1) base drone with slow undulation
           const base = Math.sin(2 * Math.PI * 55 * t);
           const mod = Math.sin(2 * Math.PI * 0.5 * t); // 0.5Hz modulation
           // Add some harmonics
           const harmonic = Math.sin(2 * Math.PI * 110 * t) * 0.3;
           data[i] = (base * (0.5 + 0.5 * mod) + harmonic) * 0.2; 
      }
  }
  return buffer;
};

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  age: number;
}

export const SpaceShooter: React.FC<SpaceShooterProps> = ({ 
  onStatsUpdate, 
  onGameStateChange, 
  gameState 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number | null>(null);
  const visionLoopRef = useRef<number | null>(null);
  
  // Game State Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerGroupRef = useRef<THREE.Group | null>(null);
  const bulletsRef = useRef<THREE.Mesh[]>([]);
  const enemiesRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const particleGeoRef = useRef<THREE.BoxGeometry | null>(null);
  const starFieldRef = useRef<THREE.Points | null>(null);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  
  // Audio Refs
  const listenerRef = useRef<THREE.AudioListener | null>(null);
  const laserSoundRef = useRef<THREE.Audio | null>(null);
  const musicRef = useRef<THREE.Audio | null>(null);

  // Logic State
  const internalState = useRef({
    handX: 0.5,
    handDetected: false,
    isShooting: false,
    score: 0,
    health: GAME_CONFIG.START_HEALTH,
    speed: GAME_CONFIG.GAME_SPEED_BASE,
    lastVideoTime: -1,
    frameCount: 0
  });

  const cleanup = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (visionLoopRef.current) cancelAnimationFrame(visionLoopRef.current);
    
    // Stop Audio
    if (musicRef.current && musicRef.current.isPlaying) musicRef.current.stop();

    // Dispose Three.js resources
    if (rendererRef.current) {
      rendererRef.current.dispose();
      const domElement = rendererRef.current.domElement;
      if (domElement && domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    }

    if (particleGeoRef.current) {
      particleGeoRef.current.dispose();
    }
    
    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }, []);

  // Initialize Game Engine
  useEffect(() => {
    if (!containerRef.current || !videoRef.current) return;

    // 1. Setup Three.js
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, GAME_CONFIG.CAMERA_Z);
    camera.lookAt(0, 0, -10);
    cameraRef.current = camera;

    // Audio Listener
    const listener = new THREE.AudioListener();
    camera.add(listener);
    listenerRef.current = listener;

    // Procedural Audio Setup
    if (listener.context.state === 'suspended') {
        listener.context.resume();
    }

    // Laser Sound
    const laserSound = new THREE.Audio(listener);
    laserSound.setBuffer(createLaserBuffer(listener.context));
    laserSound.setVolume(0.5);
    laserSoundRef.current = laserSound;

    // Background Music
    const music = new THREE.Audio(listener);
    music.setBuffer(createMusicBuffer(listener.context));
    music.setLoop(true);
    music.setVolume(0.4);
    musicRef.current = music;
    music.play();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Player
    const playerGroup = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.5, 2, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff, 
      emissive: 0x004444,
      roughness: 0.4,
      metalness: 0.8
    });
    const shipBody = new THREE.Mesh(bodyGeo, bodyMat);
    shipBody.rotation.x = -Math.PI / 2;
    playerGroup.add(shipBody);

    const glowGeo = new THREE.SphereGeometry(0.3);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const engine = new THREE.Mesh(glowGeo, glowMat);
    engine.position.z = 1;
    playerGroup.add(engine);
    
    scene.add(playerGroup);
    playerGroupRef.current = playerGroup;

    // Stars
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(GAME_CONFIG.STAR_COUNT * 3);
    for(let i=0; i<GAME_CONFIG.STAR_COUNT*3; i++) {
      starPos[i] = (Math.random() - 0.5) * 100;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8});
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);
    starFieldRef.current = starField;

    // Shared Particle Geometry
    const particleGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    particleGeoRef.current = particleGeo;

    // Helper: Create Explosion
    const createExplosion = (pos: THREE.Vector3) => {
      if (!scene || !particleGeoRef.current) return;
      
      for(let i=0; i<20; i++) {
          const color = new THREE.Color().setHSL(Math.random(), 1, 0.6); // Random bright color
          const mat = new THREE.MeshBasicMaterial({ color });
          const mesh = new THREE.Mesh(particleGeoRef.current, mat);
          mesh.position.copy(pos);
          
          // Random outward velocity
          const velocity = new THREE.Vector3(
              (Math.random() - 0.5) * 0.8,
              (Math.random() - 0.5) * 0.8,
              (Math.random() - 0.5) * 0.8
          );
          
          scene.add(mesh);
          particlesRef.current.push({ mesh, velocity, age: 0 });
      }
    };

    // Resize Handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 2. Initialize AI
    const initAI = async () => {
      onGameStateChange(GameState.LOADING);
      try {
        const vision = await FilesetResolver.forVisionTasks(AI_CONFIG.VISION_WASM_URL);
        gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: AI_CONFIG.MODEL_ASSET_PATH,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        // Start Camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
             onGameStateChange(GameState.PLAYING);
             predictWebcam();
          };
        }
      } catch (err) {
        console.error("Failed to init vision:", err);
      }
    };

    initAI();

    // 3. Loops
    const predictWebcam = () => {
      const video = videoRef.current;
      const recognizer = gestureRecognizerRef.current;
      
      if (video && recognizer && video.currentTime !== internalState.current.lastVideoTime) {
        internalState.current.lastVideoTime = video.currentTime;
        try {
          const results = recognizer.recognizeForVideo(video, Date.now());
          
          if (results.landmarks.length > 0) {
            internalState.current.handDetected = true;
            const rawX = results.landmarks[0][0].x;
            internalState.current.handX = 1 - rawX; 
            
            if (results.gestures.length > 0) {
              const category = results.gestures[0][0].categoryName;
              internalState.current.isShooting = (category === "Closed_Fist");
            }
          } else {
            internalState.current.handDetected = false;
            internalState.current.isShooting = false;
          }
        } catch (e) {
          console.warn(e);
        }
      }
      visionLoopRef.current = requestAnimationFrame(predictWebcam);
    };

    const animate = () => {
      if (internalState.current.health <= 0) {
        onGameStateChange(GameState.GAME_OVER);
        return; 
      }

      requestRef.current = requestAnimationFrame(animate);
      internalState.current.frameCount++;

      const state = internalState.current;
      const player = playerGroupRef.current;
      
      if (!player) return;

      // Player Movement
      if (state.handDetected) {
        const targetX = (state.handX - 0.5) * GAME_CONFIG.WORLD_WIDTH;
        player.position.x += (targetX - player.position.x) * GAME_CONFIG.PLAYER_SPEED_LERP;
        player.rotation.z = -(targetX - player.position.x) * GAME_CONFIG.PLAYER_TILT_FACTOR;
      } else {
        player.position.x += (0 - player.position.x) * 0.05;
        player.rotation.z *= 0.9;
      }

      // Shooting
      if (state.isShooting && state.frameCount % 10 === 0) {
        // Trigger Sound
        if (laserSoundRef.current && laserSoundRef.current.context.state === 'running') {
            if (laserSoundRef.current.isPlaying) laserSoundRef.current.stop();
            laserSoundRef.current.play();
        }

        const geo = new THREE.BoxGeometry(0.2, 0.2, 1);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(player.position);
        mesh.position.z -= 1.5;
        scene.add(mesh);
        bulletsRef.current.push(mesh);
      }

      // Bullets Update
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        b.position.z -= GAME_CONFIG.BULLET_SPEED;
        if (b.position.z < -60) {
          scene.remove(b);
          bulletsRef.current.splice(i, 1);
        }
      }

      // Particles Update
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.age += 1/60;
        p.mesh.position.add(p.velocity);
        p.mesh.rotation.x += p.velocity.y * 0.5;
        p.mesh.rotation.y += p.velocity.z * 0.5;

        if (p.age > 0.5) {
            scene.remove(p.mesh);
            (p.mesh.material as THREE.Material).dispose();
            particlesRef.current.splice(i, 1);
        }
      }

      // Enemy Spawning
      if (state.frameCount % GAME_CONFIG.ENEMY_SPAWN_RATE === 0) {
        const r = Math.random();
        let mesh;
        let type = 'BASIC';
        const startX = (Math.random() - 0.5) * GAME_CONFIG.WORLD_WIDTH;

        if (r < 0.6) {
             // BASIC: Red Tetrahedron
             const geo = new THREE.TetrahedronGeometry(0.8);
             const mat = new THREE.MeshStandardMaterial({ color: 0xff0000, flatShading: true });
             mesh = new THREE.Mesh(geo, mat);
             type = 'BASIC';
        } else if (r < 0.85) {
             // ZIGZAG: Orange Octahedron
             const geo = new THREE.OctahedronGeometry(0.7);
             const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, flatShading: true });
             mesh = new THREE.Mesh(geo, mat);
             type = 'ZIGZAG';
        } else {
             // CHASER: Purple Icosahedron
             const geo = new THREE.IcosahedronGeometry(0.7);
             const mat = new THREE.MeshStandardMaterial({ color: 0xaa00ff, flatShading: true, roughness: 0.2 });
             mesh = new THREE.Mesh(geo, mat);
             type = 'CHASER';
        }

        mesh.position.set(startX, 0, -50);
        // Store movement params in userData
        mesh.userData = { 
            type, 
            rotX: Math.random() * 0.05, 
            rotY: Math.random() * 0.05,
            initialX: startX,
            seed: Math.random() * Math.PI * 2
        };
        scene.add(mesh);
        enemiesRef.current.push(mesh);
      }

      // Enemies Update & Collision
      const playerBox = new THREE.Box3().setFromObject(player);
      const playerX = player.position.x;
      
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        
        // Base Forward Movement
        e.position.z += state.speed;

        // Specialized Movement Behaviors
        if (e.userData.type === 'ZIGZAG') {
            // Oscillate on X axis: x = startX + sin(z_progress) * amplitude
            // z moves from -50 to ~5. 
            e.position.x = e.userData.initialX + Math.sin(e.position.z * 0.2 + e.userData.seed) * 3;
        } else if (e.userData.type === 'CHASER') {
            // Slowly track player X if in front of player
            if (e.position.z < 0) {
                e.position.x += (playerX - e.position.x) * 0.025;
            }
        }

        e.rotation.x += e.userData.rotX;
        e.rotation.y += e.userData.rotY;

        const enemyBox = new THREE.Box3().setFromObject(e);
        let destroyed = false;

        // Check Bullet Collision
        for (let j = bulletsRef.current.length - 1; j >= 0; j--) {
          const b = bulletsRef.current[j];
          const bulletBox = new THREE.Box3().setFromObject(b);
          if (enemyBox.intersectsBox(bulletBox)) {
             createExplosion(e.position);
             scene.remove(e);
             enemiesRef.current.splice(i, 1);
             scene.remove(b);
             bulletsRef.current.splice(j, 1);
             state.score += 100;
             destroyed = true;
             break;
          }
        }

        if (destroyed) continue;

        // Check Player Collision
        if (enemyBox.intersectsBox(playerBox)) {
          createExplosion(e.position);
          scene.remove(e);
          enemiesRef.current.splice(i, 1);
          state.health -= 20;
          
          const mesh = player.children[0] as THREE.Mesh;
          if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
             const material = mesh.material;
             const originalEmissive = material.emissive.getHex();
             material.emissive.setHex(0xff0000);
             setTimeout(() => {
                if (mesh) material.emissive.setHex(originalEmissive);
             }, 100);
          }
          destroyed = true;
        }

        if (destroyed) continue;

        if (e.position.z > 5) {
          scene.remove(e);
          enemiesRef.current.splice(i, 1);
        }
      }

      if (starFieldRef.current) {
         const positions = starFieldRef.current.geometry.attributes.position.array as Float32Array;
         for(let i=2; i<positions.length; i+=3) {
           positions[i] += state.speed;
           if(positions[i] > 20) positions[i] = -80;
         }
         starFieldRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      if (state.frameCount % 5 === 0) {
        onStatsUpdate({
          score: state.score,
          health: state.health,
          isGameOver: false
        });
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (gameState === GameState.INIT && internalState.current.health <= 0) {
       internalState.current = {
        handX: 0.5,
        handDetected: false,
        isShooting: false,
        score: 0,
        health: GAME_CONFIG.START_HEALTH,
        speed: GAME_CONFIG.GAME_SPEED_BASE,
        lastVideoTime: -1,
        frameCount: 0
      };
      
      // Clear game objects
      enemiesRef.current.forEach(e => sceneRef.current?.remove(e));
      bulletsRef.current.forEach(b => sceneRef.current?.remove(b));
      
      // Clear particles
      particlesRef.current.forEach(p => {
          if (sceneRef.current) sceneRef.current.remove(p.mesh);
          (p.mesh.material as THREE.Material).dispose();
      });
      
      enemiesRef.current = [];
      bulletsRef.current = [];
      particlesRef.current = [];
    }
  }, [gameState]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />
      <video 
        ref={videoRef} 
        className="absolute bottom-6 left-6 w-48 h-36 object-cover z-10 opacity-60 scale-x-[-1] rounded-lg border-2 border-cyan-900/50" 
        autoPlay 
        playsInline 
        muted
      />
    </>
  );
};