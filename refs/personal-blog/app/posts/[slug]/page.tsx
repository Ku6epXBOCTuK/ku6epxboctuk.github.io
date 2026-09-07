import { notFound } from 'next/navigation'
import { posts } from '@/lib/blog-data'
import { BlogLayout } from '@/components/blog/blog-layout'
import { DetailShell, Markdownish } from '@/components/blog/cards'

export function generateStaticParams() { return posts.map(post => ({ slug: post.slug })) }
export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const post = posts.find(item => item.slug === slug); if (!post) notFound(); return <BlogLayout><DetailShell eyebrow="пост / лента" title={post.title} meta={`${post.date} · ${post.likes} реакций`}><div className="detail-tags">{post.tags.map(tag => <span key={tag}>{tag}</span>)}</div>{post.image && <img className="detail-image" src={post.image} alt="" />}<Markdownish content={post.content} /></DetailShell></BlogLayout> }
