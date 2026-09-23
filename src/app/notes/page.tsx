import Link from 'next/link';
import { ArrowUpRight, X } from 'lucide-react';
import { getAllPosts, getAllSeries, getAllTags } from '@/lib/posts';
import {
  QUICK_VIEWS,
  postMatchesView,
  type QuickView,
} from '@/lib/posts/types';
import { NotesEmpty, PostRow } from '../components/studio/StudioElements';
import MarkdownView from './MarkdownView';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: '手记',
  description: '写在过程中的实验、判断、学习和日常观察。',
};
interface Props {
  searchParams?: Promise<{ view?: string; tag?: string; series?: string }>;
}

export default async function NotesPage({ searchParams }: Props) {
  const query = (await searchParams) ?? {};
  const view = QUICK_VIEWS.some((item) => item.id === query.view)
    ? (query.view as QuickView)
    : 'all';
  const tag = typeof query.tag === 'string' ? query.tag : '';
  const series =
    typeof query.series === 'string' ? query.series : '';
  const all = getAllPosts();
  const posts = all.filter(
    (post) =>
      postMatchesView(post, view) &&
      (!tag || post.tags.includes(tag)) &&
      (!series || post.series === series),
  );
  const seriesList = getAllSeries(all);
  const selectedSeries = seriesList.find((item) => item.series === series);
  const href = (changes: { view?: string; tag?: string; series?: string }) => {
    const next = { view, tag, series, ...changes };
    const params = new URLSearchParams();
    if (next.view !== 'all') params.set('view', next.view);
    if (next.tag) params.set('tag', next.tag);
    if (next.series) params.set('series', next.series);
    return `/notes${params.size ? `?${params.toString()}` : ''}`;
  };
  return (
    <main className="studio-page">
      <div className="studio-container">
        <header className="page-intro notes-page-intro">
          <span className="studio-eyebrow">02 / 笔记目录</span>
          <h1>
            过程、试错，
            <br />
            <span>偶尔一篇长文。</span>
          </h1>
          <p>
            做产品和试工具时留下的记录。
            <br />
            按时间放在这里，偶尔回来看。
          </p>
          <span className="intro-aside">从标签或系列开始读。↘</span>
        </header>
        <div className="notes-layout">
          <aside className="notes-sidebar">
            <span className="studio-eyebrow">从一个方向开始</span>
            <nav className="notes-categories" aria-label="笔记分类">
              {QUICK_VIEWS.map((item) => (
                <Link
                  key={item.id}
                  href={href({ view: item.id })}
                  aria-current={item.id === view ? 'page' : undefined}
                >
                  {item.id === 'all' ? '全部手记' : item.label}
                  <span>
                    {
                      all.filter((post) => postMatchesView(post, item.id))
                        .length
                    }
                  </span>
                </Link>
              ))}
            </nav>
            {seriesList.length > 0 && (
              <div className="notes-series">
                <h2>沿着一个问题读</h2>
                {seriesList.map((item) => (
                  <Link
                    key={item.series}
                    href={href({ series: item.series })}
                    aria-current={item.series === series ? 'page' : undefined}
                  >
                    {item.series}
                    <ArrowUpRight size={14} />
                  </Link>
                ))}
              </div>
            )}
            <div className="notes-tag-list">
              {getAllTags(all)
                .slice(0, 14)
                .map((item) => (
                  <Link key={item.tag} href={href({ tag: item.tag })}>
                    #{item.tag}
                  </Link>
                ))}
            </div>
          </aside>
          <section aria-label="文章列表">
            <div className="notes-list-header">
              <span>{posts.length} 篇手记</span>
              {(view !== 'all' || tag || series) && (
                <Link href="/notes">
                  清除筛选 <X size={14} />
                </Link>
              )}
            </div>
            {(tag || series) && (
              <div className="active-note-filters">
                {tag && (
                  <Link href={href({ tag: '' })}>
                    #{tag}
                    <X size={13} />
                  </Link>
                )}
                {series && (
                  <Link href={href({ series: '' })}>
                    {series}
                    <X size={13} />
                  </Link>
                )}
              </div>
            )}
            {selectedSeries?.content && (
              <details className="series-intro">
                <summary>关于「{selectedSeries.series}」</summary>
                <MarkdownView content={selectedSeries.content} />
              </details>
            )}
            {posts.length ? (
              posts.map((post, index) => (
                <PostRow key={post.slug} post={post} index={index} />
              ))
            ) : all.length ? (
              <div className="studio-empty">
                <span>这一页，暂时留白。</span>
                <p>当前筛选下没有文章。换一个方向，或回到全部手记。</p>
                <Link className="text-link" href="/notes">
                  查看全部手记 <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : (
              <NotesEmpty />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
