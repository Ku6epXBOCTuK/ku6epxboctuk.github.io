import { notFound } from 'next/navigation'
import { articles } from '@/lib/blog-data'
import { BlogLayout } from '@/components/blog/blog-layout'
import { DetailShell, Markdownish } from '@/components/blog/cards'

export function generateStaticParams() { return articles.map(article => ({ slug: article.slug })) }
export default async function ArticleDetail({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const article = articles.find(item => item.slug === slug); if (!article) notFound(); return <BlogLayout><DetailShell eyebrow="статья / long read" title={article.title} meta={`${article.date} · ${article.readingTime} минут чтения`}><div className="detail-tags">{article.tags.map(tag => <span key={tag}>{tag}</span>)}</div>{article.image && <img className="detail-image" src={article.image} alt="" />}<Markdownish content={article.content} /></DetailShell></BlogLayout> }
