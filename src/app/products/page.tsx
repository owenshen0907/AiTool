import ProjectGallery from '../components/studio/ProjectGallery';

export const metadata = {
  title: '项目与实验',
  description: '个人工作台、听懂、日语学习，以及还在生长的内容实验。',
};

export default function ProjectsPage() {
  return (
    <main className="studio-page">
      <div className="studio-container">
        <header className="page-intro">
          <span className="studio-eyebrow">01 / 项目索引</span>
          <h1>
            手边的事，
            <br />
            一件一件来。
          </h1>
          <p>
            从自己遇到的问题出发。
            <br />
            这里记录现在做到哪一步。
          </p>
          <span className="intro-aside">
            点开项目，会看到做过什么、还卡在哪里。↘
          </span>
        </header>
        <ProjectGallery />
        <div className="project-index-note">
          <span>注 /</span>
          <p>
            这里的图形是概念示意，不是产品截图。每个项目的实际进展、已实现能力和未完成部分，都写在详情里。
          </p>
        </div>
      </div>
    </main>
  );
}
