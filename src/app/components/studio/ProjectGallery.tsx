'use client';

import { useState } from 'react';
import { projects, type ProjectCategory } from '@/lib/projects';
import { ProjectTile } from './StudioElements';

const filters: { id: 'all' | ProjectCategory; name: string }[] = [
  { id: 'all', name: '全部' },
  { id: 'work', name: '个人工作' },
  { id: 'language', name: '语言工具' },
  { id: 'experiment', name: '内容实验' },
];

export default function ProjectGallery() {
  const [filter, setFilter] = useState<'all' | ProjectCategory>('all');
  const visible = projects.filter(
    (project) => filter === 'all' || project.category === filter,
  );
  return (
    <>
      <div className="gallery-controls">
        <div
          className="studio-filters"
          role="group"
          aria-label="按项目方向筛选"
        >
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === filter}
              onClick={() => setFilter(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <span className="gallery-count" aria-live="polite">
          {visible.length} 项探索
        </span>
      </div>
      <div className="project-gallery">
        {visible.map((project) => (
          <ProjectTile key={project.id} project={project} />
        ))}
      </div>
    </>
  );
}
