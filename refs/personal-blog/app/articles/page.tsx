import { articles } from '@/lib/blog-data'
import { BlogLayout } from '@/components/blog/blog-layout'
import { ArticleCard, SectionIntro } from '@/components/blog/cards'

export default function ArticlesPage() {
  return <BlogLayout><main className="listing-page"><SectionIntro eyebrow="длинный формат" title="Статьи" description="Разборы, заметки и честные выводы после больших кусочков работы." /><div className="content-grid articles-grid">{articles.map(article => <ArticleCard key={article.slug} article={article} />)}</div></main></BlogLayout>
}
