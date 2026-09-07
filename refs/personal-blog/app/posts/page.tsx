import { posts } from '@/lib/blog-data'
import { BlogLayout } from '@/components/blog/blog-layout'
import { PostCard, SectionIntro } from '@/components/blog/cards'

export default function PostsPage() {
  return <BlogLayout><main className="listing-page"><SectionIntro eyebrow="короткие мысли" title="Лента" description="Наблюдения, находки и маленькие победы из ежедневной разработки." /><div className="content-grid posts-grid">{posts.map(post => <PostCard key={post.slug} post={post} />)}</div></main></BlogLayout>
}
