'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Color, ShaderMaterial } from 'three'

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    float noise = hash(uv * 3.0 + uTime * 0.1);
    float gradient = smoothstep(0.0, 1.0, uv.y + noise * 0.05);
    vec3 color = mix(uColor1, uColor2, gradient);
    gl_FragColor = vec4(color, 0.15);
  }
`

type OklchColor = {
  l: number
  c: number
  h: number
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function oklchToThreeColor({ l, c, h }: OklchColor) {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)

  const lVal = l + 0.3963377774 * a + 0.2158037573 * b
  const mVal = l - 0.1055613458 * a - 0.0638541728 * b
  const sVal = l - 0.0894841775 * a - 1.291485548 * b

  const l3 = lVal * lVal * lVal
  const m3 = mVal * mVal * mVal
  const s3 = sVal * sVal * sVal

  const r = clamp01(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3)
  const g = clamp01(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3)
  const bVal = clamp01(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3)

  return new Color(r, g, bVal)
}

const accentColor = oklchToThreeColor({ l: 0.75, c: 0.15, h: 160 })
const mutedColor = oklchToThreeColor({ l: 0.45, c: 0.03, h: 240 })

function Scene() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor1: { value: accentColor.clone() },
          uColor2: { value: mutedColor.clone() },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    []
  )

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime()
  })

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  return (
    <mesh scale={[3, 3, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <primitive object={material} />
    </mesh>
  )
}

export default function WebGLBackground() {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return null
  }

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: false }}
      camera={{ position: [0, 0, 1], fov: 30 }}
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
