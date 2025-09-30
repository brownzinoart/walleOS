# Latest Package Versions (September 2025)

This document tracks the latest stable versions of all dependencies used in WalleOS, verified as of September 30, 2025.

## Core Dependencies

### UI & Styling

**clsx** `^2.1.1` (April 2024)
- Lightweight className utility (200 bytes)
- TypeScript support with bigint in ClassValue
- Optional `/lite` submodule (140 bytes, strings-only)
- 📚 Docs: https://github.com/lukeed/clsx
- 📦 npm: https://www.npmjs.com/package/clsx

**tailwind-merge** `^3.3.1` (June 2025)
- Merges Tailwind CSS classes without conflicts
- **v3.x supports Tailwind v4.0-4.1** (breaking change from v2)
- v2.6.0 is for Tailwind v3 (not compatible with this project)
- 📚 Docs: https://github.com/dcastil/tailwind-merge
- 📦 npm: https://www.npmjs.com/package/tailwind-merge

### 3D Graphics (WebGL)

**@react-three/fiber** `^9.0.0`
- Official React 19 compatibility release
- Pairs with @react-three/drei v10.x
- 📚 Docs: https://docs.pmnd.rs/react-three-fiber
- 📚 Migration Guide: https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide
- 📦 npm: https://www.npmjs.com/package/@react-three/fiber

**@react-three/drei** `^10.7.6` (September 2025)
- Latest stable in v10 line
- Full React 19 compatibility
- Requires @react-three/fiber v9.x
- 📚 Docs: https://docs.pmnd.rs/drei
- 📦 npm: https://www.npmjs.com/package/@react-three/drei

**three** `^0.159.0`
- Core Three.js library
- 📚 Docs: https://threejs.org/docs/
- 📦 npm: https://www.npmjs.com/package/three

### Animation

**motion** `^11.11.17`
- Modern animation library (successor to Framer Motion)
- 📚 Docs: https://motion.dev
- 📦 npm: https://www.npmjs.com/package/motion

**gsap** `^3.12.5`
- Professional-grade animation library
- 📚 Docs: https://gsap.com/docs/v3/
- 📦 npm: https://www.npmjs.com/package/gsap

**@gsap/react** `^2.1.1`
- Official React bindings for GSAP
- Includes useGSAP hook
- 📚 Docs: https://gsap.com/resources/React/
- 📦 npm: https://www.npmjs.com/package/@gsap/react

**lenis** `^1.1.11`
- Smooth scroll library
- 📚 Docs: https://github.com/darkroomengineering/lenis
- 📦 npm: https://www.npmjs.com/package/lenis

### Framework

**next** `^15.1.0`
- React framework with App Router
- 📚 Docs: https://nextjs.org/docs
- 📦 npm: https://www.npmjs.com/package/next

**react** `^19.0.0`
- React library
- 📚 Docs: https://react.dev
- 📦 npm: https://www.npmjs.com/package/react

**react-dom** `^19.0.0`
- React DOM renderer
- 📚 Docs: https://react.dev/reference/react-dom
- 📦 npm: https://www.npmjs.com/package/react-dom

## Dev Dependencies

**tailwindcss** `^4.0.0`
- Utility-first CSS framework
- 📚 Docs: https://tailwindcss.com/docs
- 📦 npm: https://www.npmjs.com/package/tailwindcss

**@tailwindcss/postcss** `^4.0.0`
- PostCSS plugin for Tailwind v4
- 📚 Docs: https://tailwindcss.com/docs/installation/using-postcss
- 📦 npm: https://www.npmjs.com/package/@tailwindcss/postcss

**typescript** `^5.5.4`
- TypeScript compiler
- 📚 Docs: https://www.typescriptlang.org/docs/
- 📦 npm: https://www.npmjs.com/package/typescript

## Compatibility Matrix

| Stack Component | Version | Compatible With |
|----------------|---------|----------------|
| React | 19.0.0 | Next.js 15, R3F v9 |
| Next.js | 15.1.0 | React 19, Tailwind v4 |
| Tailwind CSS | 4.0.0 | tailwind-merge v3.x |
| @react-three/fiber | 9.0.0 | React 19, Drei v10 |
| @react-three/drei | 10.7.6 | R3F v9, React 19 |
| tailwind-merge | 3.3.1 | Tailwind v4.0-4.1 |
| clsx | 2.1.1 | All versions |

## Version History

### September 2025 Update
- ✅ Updated @react-three/drei from v9.91.0 to v10.7.6 (React 19 compatibility)
- ✅ Added clsx v2.1.1 (missing dependency)
- ✅ Added tailwind-merge v3.3.1 (Tailwind v4 support)

### Breaking Changes to Note

1. **@react-three/drei v9 → v10**
   - Requires @react-three/fiber v9 (not v8)
   - React 19 support

2. **tailwind-merge v2 → v3**
   - Tailwind v4 support (breaking change)
   - v2.x only supports Tailwind v3

## Installation

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify versions
npm list clsx tailwind-merge @react-three/drei @react-three/fiber
```

## Troubleshooting

### Peer Dependency Warnings

If you see peer dependency warnings, ensure:
- React and React-DOM are both v19.x
- @react-three/fiber is v9.x (not v8.x)
- @react-three/drei is v10.x (not v9.x)
- tailwind-merge is v3.x (not v2.x) for Tailwind v4

### Force Clean Install

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Legacy Peer Deps (Last Resort)

```bash
npm install --legacy-peer-deps
```

**Note:** Using `--legacy-peer-deps` bypasses peer dependency checks. The proper fix is to use compatible versions as listed above.

## Resources

- [React 19 Release Notes](https://react.dev/blog/2024/04/25/react-19)
- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/v4-beta)
- [R3F v9 Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)

---

**Last Updated:** September 30, 2025
**Verified By:** Web search of official npm registry and documentation
