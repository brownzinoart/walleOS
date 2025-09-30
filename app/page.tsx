import ProjectsGrid from '@/components/ProjectsGrid'
import Hero from '@/components/Hero'
import WebGLBackground from '@/components/WebGLBackground'

export default function Home() {
  return (
    <>
      <WebGLBackground />
      <Hero />
      <ProjectsGrid />
    </>
  )
}
