'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'

import type { Project } from '@/app/projects/data'
import { projects } from '@/app/projects/data'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

const arrowSymbol = '->'

export default function ProjectsGrid() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const selectedProject: Project | undefined = selectedId
    ? projects.find((project) => project.id === selectedId)
    : undefined
  const dialogRef = useFocusTrap<HTMLDivElement>(Boolean(selectedProject))

  const updateSelectedId = useCallback(
    (nextId: string | null) => {
      const commitSelection = () => {
        setSelectedId(nextId)
      }

      if (prefersReducedMotion || typeof document === 'undefined') {
        commitSelection()
        return
      }

      const startViewTransition = (document as Document & {
        startViewTransition?: (callback: () => void) => void
      }).startViewTransition

      if (typeof startViewTransition === 'function') {
        startViewTransition(() => {
          commitSelection()
        })
        return
      }

      commitSelection()
    },
    [prefersReducedMotion, setSelectedId],
  )

  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : {
            type: 'spring' as const,
            bounce: 0.2,
            duration: 0.4,
          },
    [prefersReducedMotion],
  )

  useEffect(() => {
    if (!selectedProject) {
      return
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        updateSelectedId(null)
      }
    }

    window.addEventListener('keydown', handleKeydown)

    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [selectedProject, updateSelectedId])

  useEffect(() => {
    if (selectedProject) {
      document.body.classList.add('modal-open')
      return () => {
        document.body.classList.remove('modal-open')
      }
    }

    document.body.classList.remove('modal-open')

    return undefined
  }, [selectedProject])

  return (
    <section id="projects" className="relative min-h-screen px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-12 text-center text-4xl font-bold text-terminal-accent">Projects</h2>

        <LayoutGroup id="projects-grid">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <motion.button
                key={project.id}
                type="button"
                layoutId={`card-${project.id}`}
                onClick={() => updateSelectedId(project.id)}
                className={cn(
                  'project-card group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-accent focus-visible:ring-offset-2 focus-visible:ring-offset-terminal-bg',
                )}
                aria-label={`View ${project.title} details`}
                aria-expanded={selectedId === project.id}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: 1.02,
                      }
                }
                whileTap={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: 0.98,
                      }
                }
                transition={transition}
              >
                <motion.h3
                  layoutId={`title-${project.id}`}
                  className="text-2xl font-semibold text-terminal-accent"
                  transition={transition}
                >
                  {project.title}
                </motion.h3>

                <motion.p
                  layoutId={`desc-${project.id}`}
                  className="mt-3 text-terminal-muted"
                  transition={transition}
                >
                  {project.description}
                </motion.p>

                <motion.div layoutId={`stack-${project.id}`} className="mt-6 flex flex-wrap gap-2" transition={transition}>
                  {project.techStack.map((tech) => (
                    <span key={tech} className="tech-badge">
                      {tech}
                    </span>
                  ))}
                </motion.div>

                <span className="mt-8 inline-flex items-center gap-2 text-sm text-terminal-accent">
                  View details
                  <motion.span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    {arrowSymbol}
                  </motion.span>
                </span>
              </motion.button>
            ))}
          </div>
        </LayoutGroup>
      </div>

      <AnimatePresence>
        {selectedProject ? (
          <>
            <motion.div
              key="backdrop"
              className="expanded-card-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: prefersReducedMotion ? 1 : 0.88 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
              onClick={() => updateSelectedId(null)}
            />

            <motion.div
              key={selectedProject.id}
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedProject.title} details`}
              layoutId={`card-${selectedProject.id}`}
              className={cn(
                'expanded-card left-1/2 top-1/2 flex max-h-[90vh] w-[min(92vw,68rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-6 p-8 text-left text-terminal-fg focus:outline-none focus-visible:outline-none',
                'sm:p-10',
              )}
              tabIndex={-1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              <div className="flex items-start justify-between gap-4">
                <motion.h2
                  layoutId={`title-${selectedProject.id}`}
                  className="text-3xl font-bold text-terminal-accent"
                  transition={transition}
                >
                  {selectedProject.title}
                </motion.h2>

                <button
                  type="button"
                  onClick={() => updateSelectedId(null)}
                  className="terminal-button shrink-0 px-4 py-2"
                  aria-label="Close"
                >
                  Close
                </button>
              </div>

              <motion.p
                layoutId={`desc-${selectedProject.id}`}
                className="text-terminal-muted"
                transition={transition}
              >
                {selectedProject.description}
              </motion.p>

              <p className="text-base leading-relaxed text-terminal-fg">{selectedProject.longDescription}</p>

              <motion.div layoutId={`stack-${selectedProject.id}`} className="flex flex-wrap gap-2" transition={transition}>
                {selectedProject.techStack.map((tech) => (
                  <span key={tech} className="tech-badge">
                    {tech}
                  </span>
                ))}
              </motion.div>

              <motion.a
                href={selectedProject.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="terminal-button inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-base md:w-auto"
                transition={transition}
                whileHover={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: 1.02,
                      }
                }
                whileTap={
                  prefersReducedMotion
                    ? undefined
                    : {
                        scale: 0.98,
                      }
                }
              >
                Visit Project
                <span aria-hidden>{arrowSymbol}</span>
              </motion.a>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
