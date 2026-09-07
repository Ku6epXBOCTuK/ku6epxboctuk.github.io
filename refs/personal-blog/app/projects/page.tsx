import { projects } from '@/lib/blog-data'
import { BlogLayout } from '@/components/blog/blog-layout'
import { ProjectCard, SectionIntro } from '@/components/blog/cards'

export default function ProjectsPage() {
  return <BlogLayout><main className="listing-page"><SectionIntro eyebrow="open source corner" title="Проекты" description="Небольшие инструменты, которые превращают рабочий процесс в чуть более приятное место." /><div className="content-grid projects-grid">{projects.map(project => <ProjectCard key={project.slug} project={project} />)}</div></main></BlogLayout>
}
