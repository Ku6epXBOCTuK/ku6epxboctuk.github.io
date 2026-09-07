import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Clock3, ExternalLink, Heart, Sparkles } from 'lucide-react'
import type { Article, Post, Project, Report } from '@/lib/blog-data'

export function PostCard({ post }: { post: Post }) {
  return <article className="content-card post-card">
    {post.image && <img src={post.image} alt="" className="post-image" />}
    <div className="card-body">
      <div className="meta-row"><span>{post.date}</span><span><Heart size={13} /> {post.likes}</span></div>
      <h2><Link href={`/posts/${post.slug}`}>{post.title}</Link></h2>
      <p>{post.excerpt}</p>
      <div className="card-bottom"><div className="tag-list">{post.tags.map(tag => <span key={tag}>{tag}</span>)}</div><Link className="icon-link" href={`/posts/${post.slug}`} aria-label={`Открыть пост: ${post.title}`}><ArrowUpRight size={18} /></Link></div>
    </div>
  </article>
}

export function ArticleCard({ article }: { article: Article }) {
  return <article className="content-card article-card">
    {article.image && <img src={article.image} alt="" className="article-image" />}
    <div className="card-body"><div className="meta-row"><span>{article.date}</span><span><Clock3 size={13} /> {article.readingTime} мин</span></div><h2><Link href={`/articles/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><div className="card-bottom"><div className="tag-list">{article.tags.map(tag => <span key={tag}>{tag}</span>)}</div><Link className="text-link" href={`/articles/${article.slug}`}>читать <ArrowUpRight size={14} /></Link></div></div>
  </article>
}

export function ProjectCard({ project }: { project: Project }) {
  return <article className={`content-card project-card project-${project.color}`}>
    {project.image && <img src={project.image} alt={`${project.title} preview`} className="project-image" />}
    <div className="card-body"><div className="project-heading"><span className="project-icon">{project.icon}</span><div><span className="eyebrow">{project.status === 'active' ? 'активный проект' : 'на поддержке'}</span><h2><Link href={`/projects/${project.slug}`}>{project.title}</Link></h2></div></div><p>{project.description}</p><div className="tag-list">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="project-links">{project.links.slice(0, 2).map(link => <a href={link.url} key={link.label}>{link.label} <ExternalLink size={13} /></a>)}</div></div>
  </article>
}

export function ReportCard({ report }: { report: Report }) {
  return <article className="content-card report-card"><div className="report-date"><CalendarDays size={17} /><span>{report.dateStart} — {report.dateEnd}</span></div><div className="report-items">{report.items.map(item => <div className="report-item" key={item.project}><strong>{item.project}</strong><span>{item.changes}</span></div>)}</div><Link className="text-link" href={`/reports/${report.slug}`}>открыть отчёт <ArrowUpRight size={14} /></Link></article>
}

export function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="section-intro"><div><span className="eyebrow"><Sparkles size={13} /> {eyebrow}</span><h1>{title}</h1></div><p>{description}</p></div>
}

export function DetailShell({ eyebrow, title, meta, children }: { eyebrow: string; title: string; meta: string; children: React.ReactNode }) {
  return <main className="detail-page"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><div className="detail-meta">{meta}</div><div className="detail-content">{children}</div></main>
}

export function Markdownish({ content }: { content: string }) {
  return <div className="rich-text">{content.split('\n\n').map((paragraph, index) => paragraph.startsWith('## ') ? <h2 key={index}>{paragraph.slice(3)}</h2> : paragraph.startsWith('**') ? <p key={index}><strong>{paragraph.replaceAll('**', '')}</strong></p> : <p key={index}>{paragraph}</p>)}</div>
}
