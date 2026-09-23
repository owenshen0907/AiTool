'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { projects } from '@/lib/projects';

export default function ProjectDesk() {
  const [selected, setSelected] = useState(0);
  const project = projects[selected];
  return (
    <div className="project-desk">
      <div className="desk-top">
        <span>正在打开的文件</span>
        <span>{project.number} / 04</span>
      </div>
      <div className="desk-display" aria-live="polite">
        <span className="desk-index">{project.number}</span>
        <span className="desk-status">{project.status}</span>
        <strong>{project.name}</strong>
        <p>{project.question}</p>
        <Link
          href={`/products/${project.id}`}
          className="desk-open"
          aria-label={`了解${project.name}`}
        >
          打开这一页 <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="desk-select" role="group" aria-label="切换正在打开的项目">
        {projects.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            <span>{item.number}</span> {['工作台', '听懂', '日语', '猫'][index]}
          </button>
        ))}
      </div>
    </div>
  );
}
