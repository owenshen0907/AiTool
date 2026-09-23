import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { PersonalProject } from '@/lib/projects';
import type { PostMeta } from '@/lib/posts/types';
import ProjectArtwork from './ProjectArtwork';

export function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="section-number">{number}</span>
        <h2>{title}</h2>
      </div>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function ProjectTile({
  project,
  featured = false,
}: {
  project: PersonalProject;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/products/${project.id}`}
      id={
        project.id === 'language-learning'
          ? 'japanese-learning-app'
          : project.id
      }
      className={`project-tile ${featured ? 'tile-featured' : ''}`}
    >
      <div className="tile-art">
        <ProjectArtwork id={project.id} />
        <span className="tile-arrow">
          <ArrowUpRight size={23} />
        </span>
      </div>
      <div className="tile-content">
        <div className="tile-meta">
          <span>
            {project.number.padStart(3, '0')} / {project.categoryLabel}
          </span>
          <span
            className={`status-dot ${project.category === 'experiment' ? 'is-experiment' : ''}`}
          >
            {project.status}
          </span>
        </div>
        <h3>{project.name}</h3>
        <p>{project.summary}</p>
        <div className="tile-tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function PostRow({ post, index }: { post: PostMeta; index: number }) {
  return (
    <Link href={`/notes/${post.slug}`} className="post-row">
      <span className="post-index">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <div className="post-meta">
          <time dateTime={post.date}>{post.date.replaceAll('-', '.')}</time>
          <span>{post.series || post.tags[0] || '手记'}</span>
        </div>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
      </div>
      <ArrowUpRight size={20} />
    </Link>
  );
}

export function NotesEmpty() {
  return (
    <div className="studio-empty">
      <span>留一点空白。</span>
      <p>这里还没有公开的手记。先看看正在做的项目，笔记会随着实践慢慢补上。</p>
      <Link className="text-link" href="/products">
        去看看项目 <ArrowRight size={16} />
      </Link>
    </div>
  );
}
