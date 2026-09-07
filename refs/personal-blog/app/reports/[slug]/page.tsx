import { notFound } from 'next/navigation'
import { reports } from '@/lib/blog-data'
import { BlogLayout } from '@/components/blog/blog-layout'
import { DetailShell } from '@/components/blog/cards'

export function generateStaticParams() { return reports.map(report => ({ slug: report.slug })) }
export default async function ReportDetail({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const report = reports.find(item => item.slug === slug); if (!report) notFound(); return <BlogLayout><DetailShell eyebrow="weekly log" title={`Неделя: ${report.dateStart} — ${report.dateEnd}`} meta="автоматический отчёт"><div className="report-detail-list">{report.items.map(item => <div className="report-item" key={item.project}><strong>{item.project}</strong><span>{item.changes}</span></div>)}</div></DetailShell></BlogLayout> }
