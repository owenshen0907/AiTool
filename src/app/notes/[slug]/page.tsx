import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { getProject } from '@/lib/projects';
import MarkdownView from '../MarkdownView';

export const dynamic = 'force-dynamic';
interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return {
    title: post?.title || '手记未找到',
    description: post?.excerpt || undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const all = getAllPosts();
  const position = all.findIndex((item) => item.slug === post.slug);
  const older = all[position + 1];
  const newer = position > 0 ? all[position - 1] : null;
  const related = post.projects.map(getProject).filter(Boolean);
  const seriesPosts = post.series
    ? all.filter((item) => item.series === post.series)
    : [];
  return (
    <main className="studio-page">
      <div className="studio-container">
        <Link className="back-link" href="/notes">
          <ArrowLeft size={16} />
          回到手记
        </Link>
        <header className="article-header">
          <div className="post-meta">
            <span>手记 / NOTE</span>
            <time dateTime={post.date}>{post.date.replaceAll('-', '.')}</time>
            {post.series && (
              <Link href={`/notes?series=${encodeURIComponent(post.series)}`}>
                {post.series}
              </Link>
            )}
          </div>
          <h1>{post.title}</h1>
          {post.excerpt && <p>{post.excerpt}</p>}
        </header>
        <div className="article-layout">
          <article className="article-body">
            <MarkdownView content={post.content} />
            <nav className="article-pagination" aria-label="前后文章">
              {newer ? (
                <Link href={`/notes/${newer.slug}`}>
                  <span>
                    <ArrowLeft size={14} />
                    较新的手记
                  </span>
                  <strong>{newer.title}</strong>
                </Link>
              ) : (
                <div />
              )}
              {older && (
                <Link href={`/notes/${older.slug}`}>
                  <span>
                    较早的手记
                    <ArrowRight size={14} />
                  </span>
                  <strong>{older.title}</strong>
                </Link>
              )}
            </nav>
          </article>
          <aside className="article-aside">
            {related.length > 0 && (
              <section>
                <h2>这篇手记来自</h2>
                {related.map(
                  (project) =>
                    project && (
                      <Link key={project.id} href={`/products/${project.id}`}>
                        {project.name}
                        <ArrowUpRight size={15} />
                      </Link>
                    ),
                )}
              </section>
            )}
            {post.series && (
              <section>
                <h2>{post.series}</h2>
                {seriesPosts.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/notes/${item.slug}`}
                    aria-current={item.slug === post.slug ? 'page' : undefined}
                  >
                    {item.title}
                  </Link>
                ))}
              </section>
            )}
            {post.tags.length > 0 && (
              <section>
                <h2>沿着这些线索</h2>
                <div className="notes-tag-list">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/notes?tag=${encodeURIComponent(tag)}`}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <div className="article-margin-note">
              一个阶段的想法，
              <br />
              也可以在后来改变。
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
