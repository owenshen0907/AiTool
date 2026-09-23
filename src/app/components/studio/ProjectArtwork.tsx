import type { ProjectId } from '@/lib/projects';

export default function ProjectArtwork({ id }: { id: ProjectId }) {
  return (
    <div className={`project-art art-${id}`} aria-hidden="true">
      {id === 'personal-workstation' && (
        <>
          <div className="art-work-head">
            <span>一件事是怎么往前走的</span>
            <span>01—03</span>
          </div>
          <div className="art-work-flow">
            <div>
              <small>01 / 想法</small>
              <strong>先说清楚</strong>
              <i />
            </div>
            <span>→</span>
            <div>
              <small>02 / 执行</small>
              <strong>动手做</strong>
              <i />
            </div>
            <span>→</span>
            <div>
              <small>03 / 核验</small>
              <strong>再看结果</strong>
              <i />
            </div>
          </div>
          <div className="art-work-tail">
            继续迭代，不把「完成」当成一个按钮。
          </div>
        </>
      )}
      {id === 'tingdong' && (
        <>
          <div className="art-subtitle-head">
            <span>会話 / JP → ZH</span>
            <span>字幕示意</span>
          </div>
          <div className="art-subtitle-line">
            <small>相手</small>
            <strong>今日はどうでしたか。</strong>
          </div>
          <div className="art-subtitle-translation">今天怎么样？</div>
          <div className="art-subtitle-bottom">
            <span>听见</span>
            <span>理解</span>
            <span>回应</span>
          </div>
        </>
      )}
      {id === 'language-learning' && (
        <>
          <div className="art-word-head">
            <span>ことばのメモ</span>
            <span>03</span>
          </div>
          <div className="art-word-main">
            <small>まよう</small>
            <strong>迷う</strong>
            <span>犹豫 · 迷路</span>
          </div>
          <div className="art-word-bottom">查到一个词以后，把它留下来。</div>
        </>
      )}
      {id === 'cat-host' && (
        <>
          <div className="art-story-head">
            <span>猫的日语课 / 分镜草稿</span>
            <span>还在想</span>
          </div>
          <div className="art-story-frames">
            <div>
              <span>01 / 出场</span>
              <i className="story-cat">ω</i>
              <b>こんにちは</b>
            </div>
            <div>
              <span>02 / 讲一个词</span>
              <strong>言葉</strong>
              <b>ことば</b>
            </div>
            <div>
              <span>03 / 轮到你</span>
              <i className="story-question">?</i>
              <b>还没定稿</b>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
