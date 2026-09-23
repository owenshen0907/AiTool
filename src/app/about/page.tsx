import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export const metadata = {
  title: '关于',
  description: '认识 Owen：做工具，学语言，记录尝试。',
};

export default function AboutPage() {
  return (
    <main className="studio-page">
      <div className="studio-container">
        <header className="page-intro about-intro">
          <span className="studio-eyebrow">03 / 关于我</span>
          <h1>
            Owen Shen<span className="orange-dot">.</span>
          </h1>
          <p>一个会把日常问题带进代码里的人。</p>
        </header>
        <div className="about-layout">
          <div className="about-card">
            <span className="about-card-index">PERSONAL FILE / 03</span>
            <div className="about-monogram">
              O<span>.</span>
            </div>
            <span>Owen Shen</span>
            <p>
              做工具，学语言，
              <br />
              也记下一些绕过的路。
            </p>
            <div className="about-card-foot">
              做过的事，留在项目里；怎么想的，留在笔记里。
            </div>
          </div>
          <article className="about-copy">
            <h2>先把问题弄清楚，再动手。</h2>
            <p>
              我在做一些和工作、语言学习有关的工具，也在尝试让 AI
              参与更具体的日常：怎样把事情组织起来，怎样听懂一段对话，怎样记住一个以后还会用到的表达。
            </p>
            <p>
              这些尝试有不同的形状。个人工作台关心一件事怎样从想法走到完成；听懂关注对话里的理解与回应；语言学习工具则留给那些需要一点点积累的事情。
            </p>
            <h2>过程也留着。</h2>
            <p>
              我也想留下一些过程：为什么这样选，什么地方没有想清楚，哪一次尝试让我改了主意。一个早期实验、一篇笔记，或者一个暂时没有答案的问题，都可以在这里有个位置。
            </p>
            <div className="about-quote">
              有些问题，需要做着做着才知道该怎么问。
            </div>
            <h2>其他地方</h2>
            <div className="social-links">
              <a
                href="https://github.com/owenshen0907"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub <ArrowUpRight size={18} />
              </a>
              <a
                href="https://x.com/OWENSHEN0907"
                target="_blank"
                rel="noopener noreferrer"
              >
                X / 日常想法 <ArrowUpRight size={18} />
              </a>
              <a
                href="https://www.youtube.com/@owenshen0907"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube <ArrowUpRight size={18} />
              </a>
            </div>
            <Link href="/products" className="text-link">
              先从一个项目认识我 <ArrowUpRight size={17} />
            </Link>
          </article>
        </div>
      </div>
    </main>
  );
}
