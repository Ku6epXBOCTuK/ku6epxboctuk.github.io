import { notFound } from 'next/navigation'
import { projects } from '@/lib/blog-data'
import { BlogLayout } from '@/components/blog/blog-layout'
import { DetailShell, Markdownish } from '@/components/blog/cards'

export function generateStaticParams() { return projects.map(project => ({ slug: project.slug })) }
export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const project = projects.find(item => item.slug === slug); if (!project) notFound(); return <BlogLayout><DetailShell eyebrow="open source project" title={project.title} meta={`${project.status === 'active' ? 'активно развивается' : 'на поддержке'} · ${project.tags.join(' · ')}`}><p className="detail-lead">{project.description}</p>{project.image && <img className="detail-image" src={project.image} alt={`${project.title} preview`} />}<Markdownish content={project.content} /><div className="detail-actions">{project.links.map(link => <a className="button-primary" href={link.url} key={link.label}>{link.label}</a>)}</div></DetailShell></BlogLayout> }
