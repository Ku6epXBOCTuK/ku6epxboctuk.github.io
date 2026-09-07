import { reports } from '@/lib/blog-data'
import { BlogLayout } from '@/components/blog/blog-layout'
import { ReportCard, SectionIntro } from '@/components/blog/cards'

export default function ReportsPage() {
  return <BlogLayout><main className="listing-page"><SectionIntro eyebrow="weekly logs" title="Недельные отчёты" description="Автоматический срез того, что двигалось вперёд за последние семь дней." /><div className="reports-list">{reports.map(report => <ReportCard key={report.slug} report={report} />)}</div></main></BlogLayout>
}
