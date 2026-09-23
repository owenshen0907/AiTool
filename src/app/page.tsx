import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { projects } from '@/lib/projects';
import { getAllPosts } from '@/lib/posts';
import ProjectDesk from './components/studio/ProjectDesk';
import ProjectArtwork from './components/studio/ProjectArtwork';
import {
  NotesEmpty,
  PostRow,
  ProjectTile,
  SectionHeading,
} from './components/studio/StudioElements';

export const dynamic = 'force-dynamic';

export default function Home() {
  const posts = getAllPosts().slice(0, 3);
  return (
    <main className="studio-page">
      <section className="studio-container home-hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span>OWEN SHEN</span>
            <span>个人网站 / 2026</span>
          </div>
          <h1>
            工作流、日语，
            <br />
            和一只
            <span className="hero-mark">还没出道的猫</span>。
          </h1>
          <p className="hero-description">
            嗨，我是 Owen。把遇到的问题做成工具，
            <br className="desktop-break" />
            把试过的办法和没想通的地方记下来。
          </p>
          <div className="hero-actions">
            <a className="studio-button" href="#on-the-desk">
              看看项目 <ArrowDown size={17} />
            </a>
            <Link href="/notes" className="text-link">
              读读笔记 <ArrowUpRight size={17} />
            </Link>
          </div>
          <p className="hero-footnote">
            <span>01 工作台</span>
            <span>02 听懂</span>
            <span>03 日语</span>
            <span>04 猫</span>
          </p>
        </div>
        <ProjectDesk />
      </section>
      <div className="studio-ribbon" aria-hidden="true">
        <span>手边的四件事</span>
        <span>↓</span>
        <span>笔记在后面</span>
      </div>
      <section id="on-the-desk" className="studio-container studio-section">
        <SectionHeading
          number="01 / PROJECTS"
          title="正在做的事"
          subtitle="有能用的，也有刚起了个头的。"
        />
        <div className="home-projects">
          <ProjectTile project={projects[0]} featured />
          <div className="home-project-pair">
            <ProjectTile project={projects[1]} />
            <ProjectTile project={projects[2]} />
          </div>
        </div>
        <div className="section-end">
          <span>四件事，各有各的进度。</span>
          <Link className="text-link" href="/products">
            查看完整索引 <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <section className="studio-container experiment-section">
        <div className="experiment-visual">
          <ProjectArtwork id="cat-host" />
        </div>
        <div className="experiment-copy">
          <span className="studio-eyebrow">04 / 还在画草图</span>
          <div className="experiment-label">探索中</div>
          <h2>
            如果一只猫，
            <br />
            开始教日语呢？
          </h2>
          <p>
            现在只有一个问题：日语讲解能不能更像聊天？
            <br />
            形象、内容和互动都还在研究。
          </p>
          <Link className="text-link" href="/products/cat-host">
            打开这张草图 <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="studio-container studio-section notes-section">
        <div className="notes-intro">
          <span className="section-number">02 / NOTES</span>
          <h2>
            做的时候，
            <br />
            <em>顺手记下。</em>
          </h2>
          <p>
            有些是踩坑记录，
            <br />
            有些是半路改了主意，
            <br />
            也有写给以后自己的备忘。
          </p>
          <Link className="text-link" href="/notes">
            全部手记 <ArrowRight size={17} />
          </Link>
        </div>
        <div>
          {posts.length ? (
            posts.map((post, index) => (
              <PostRow key={post.slug} post={post} index={index} />
            ))
          ) : (
            <NotesEmpty />
          )}
        </div>
      </section>
    </main>
  );
}
