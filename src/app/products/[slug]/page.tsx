import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, ArrowRight } from 'lucide-react';
import { getProject, projects } from '@/lib/projects';
import { getAllPosts } from '@/lib/posts';
import ProjectArtwork from '../../components/studio/ProjectArtwork';
import {
  PostRow,
  SectionHeading,
} from '../../components/studio/StudioElements';

interface Props {
  params: Promise<{ slug: string }>;
}
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  return {
    title: project?.name || '项目未找到',
    description: project?.summary,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const posts = getAllPosts().filter((post) =>
    post.projects.includes(project.id),
  );
  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  return (
    <main className="studio-page">
      <div className="studio-container">
        <Link href="/products" className="back-link">
          <ArrowLeft size={16} />
          项目与实验
        </Link>
        <header className="project-detail-hero">
          <div>
            <div className="project-detail-meta">
              <span className="studio-eyebrow">
                PROJECT {project.number} / {project.english}
              </span>
              <span className="status-dot">{project.status}</span>
            </div>
            <h1>{project.name}</h1>
            <p className="project-question">{project.question}</p>
            <p>{project.summary}</p>
            {project.external && (
              <a
                className="studio-button"
                href={project.external.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {project.external.label}
                <ArrowUpRight size={17} />
              </a>
            )}
          </div>
          <ProjectArtwork id={project.id} />
        </header>
        <div className="project-story">
          <aside>
            <span className="section-number">缘起 / WHY</span>
            <h2>为什么做这件事。</h2>
            <div className="tile-tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </aside>
          <div>
            <p className="story-lead">{project.motivation}</p>
            <div className="project-steps">
              {project.steps.map((step, index) => (
                <section key={step.title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </section>
              ))}
            </div>
            <div className="open-question">
              <span>还没想完的问题</span>
              <p>{project.openQuestion}</p>
            </div>
          </div>
        </div>
        <section className="project-related">
          <SectionHeading number="相关手记" title="写过的过程" />
          {posts.length ? (
            posts.map((post, index) => (
              <PostRow key={post.slug} post={post} index={index} />
            ))
          ) : (
            <div className="related-empty">
              <p>这个项目的过程笔记还在整理。可以先读读其他手记。</p>
              <Link className="text-link" href="/notes">
                看看其他手记 <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>
        <Link href={`/products/${next.id}`} className="next-project">
          <span>再翻一个项目</span>
          <strong>{next.name}</strong>
          <ArrowUpRight size={28} />
        </Link>
      </div>
    </main>
  );
}
