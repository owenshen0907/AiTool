export const PROJECT_IDS = [
  'personal-workstation',
  'tingdong',
  'language-learning',
  'cat-host',
] as const;
export type ProjectId = (typeof PROJECT_IDS)[number];
export type ProjectCategory = 'work' | 'language' | 'experiment';

export interface PersonalProject {
  id: ProjectId;
  number: string;
  name: string;
  english: string;
  category: ProjectCategory;
  categoryLabel: string;
  status: string;
  question: string;
  summary: string;
  motivation: string;
  steps: { title: string; text: string }[];
  openQuestion: string;
  tags: string[];
  external?: { label: string; url: string };
}

export const projects: PersonalProject[] = [
  {
    id: 'personal-workstation',
    number: '01',
    name: '个人工作台',
    english: 'Personal Workstation',
    category: 'work',
    categoryLabel: '个人工作系统',
    status: '持续迭代',
    question: '把任务交出去以后，然后呢？',
    summary: '把散落的想法、资料和 Agent 执行，接回一条有来有回的工作线。',
    motivation:
      '我想做的不是另一个聊天窗口。一个想法从出现，到有计划、被执行、得到验证，中间还有很多需要被照顾的事情。个人工作台，是我为这段过程做的一次尝试。',
    steps: [
      {
        title: '把事情组织起来',
        text: '已有本地工作事实与桌面工作区基础，围绕目标、计划和任务保留上下文。',
      },
      {
        title: '把执行交给熟悉的工具',
        text: '已有本机 Codex / Claude Code 受控执行基础；工作台关注范围、确认、取消与验收。',
      },
      {
        title: '让资料留得下来',
        text: '正在梳理资料、长期记忆和任务状态的分工，以及资料整理和复用的机制。',
      },
    ],
    openQuestion:
      '一件事做完以后，哪些应该成为下一次的经验，哪些只需要留在这次记录里？',
    tags: ['本地优先', 'Agent 协作', '工作流程'],
  },
  {
    id: 'tingdong',
    number: '02',
    name: '听懂',
    english: 'Words, within reach.',
    category: 'language',
    categoryLabel: '语言工具 · macOS',
    status: '持续迭代',
    question: '听明白，也接得上话。',
    summary: '一个陪在日语对话旁边的小工具：转写、翻译，再给回应一点帮助。',
    motivation:
      '语言里的困难不总是发生在课本上。有时是正在进行的一段对话：听见了声音，却还来不及理解，也不知道怎样把下一句话说出来。听懂关注的就是这个瞬间。',
    steps: [
      {
        title: '声音变成看得见的文字',
        text: '已有系统声音与麦克风采集、日中转写和日语到中文翻译的桌面实现。',
      },
      {
        title: '给回应一点帮助',
        text: '字幕、对话中的回复辅助，以及录音历史和导出，围绕实际对话场景组织。',
      },
      {
        title: '从能运行到好用',
        text: '已有打包与发布记录，继续打磨字幕、录音和使用体验；这里暂不提供公开下载。',
      },
    ],
    openQuestion: '实时字幕怎样既跟得上说话，又不让不断变化的文字打断理解？',
    tags: ['语音', '实时字幕', '日语'],
  },
  {
    id: 'language-learning',
    number: '03',
    name: '把日语学进日常',
    english: 'A little, every day.',
    category: 'language',
    categoryLabel: '语言学习',
    status: '分端推进',
    question: '查过的词，后来用上了吗？',
    summary: '从查阅和拍照积累，到开口练习。让学习发生在一个个具体的动作里。',
    motivation:
      '查到一个词只是开始。我更关心它之后去了哪里：能不能留下，能不能再遇见，能不能在真正需要的时候说出口。这个项目从日语开始，把这些动作逐步连接起来。',
    steps: [
      {
        title: 'Web · 查一查',
        text: '欧文日语工坊已有词汇、语法和例句浏览，是目前可以直接打开的入口。',
      },
      {
        title: 'iPhone · 留下来',
        text: '已有拍照查解与本地卡片基础，保存、确认和复习的完整流程仍在推进。',
      },
      {
        title: 'Mac · 试着说',
        text: '口语应用目前仍是模拟 demo。真实录音、纠错与跨端同步尚未完成。',
      },
    ],
    openQuestion:
      '知识查阅、私人卡片和口语练习，应该共享什么，又应该各自保留什么？',
    tags: ['词汇与语法', '个人卡片', '学习实验'],
    external: { label: '打开日语工坊', url: 'https://nihonngo.owenshen.top' },
  },
  {
    id: 'cat-host',
    number: '04',
    name: '如果一只猫来教日语',
    english: 'An experiment, still.',
    category: 'experiment',
    categoryLabel: '内容实验',
    status: '探索中',
    question: '内容能不能长出自己的声音？',
    summary: '关于猫形象、日语内容和互动讲解的一次早期探索。先把问题留在这里。',
    motivation:
      '我在想：已经整理过的学习内容，能不能换一种更轻松的相遇方式？一个卡通形象，一些讲得清楚的知识点，再加上一点回应观众的能力。',
    steps: [
      {
        title: '形象',
        text: '方向是原创的卡通或猫形象，不使用真人，也不借用已有角色 IP。',
      },
      {
        title: '内容',
        text: '研究预制教学内容与互动讲解怎样分工，先关心知识是否准确、节奏是否自然。',
      },
      {
        title: '边界',
        text: '目前处于调研阶段，没有已上线的直播产品。互动安全和人工介入是待验证的问题。',
      },
    ],
    openQuestion: '先做一段内容，还是先做一次有人看着的互动实验？',
    tags: ['原创形象', '日语内容', '早期研究'],
  },
];

export function isProjectId(value: unknown): value is ProjectId {
  return typeof value === 'string' && PROJECT_IDS.includes(value as ProjectId);
}

export function getProject(id: string) {
  return projects.find((project) => project.id === id);
}
