export interface MenuItem {
    title: string;
    href?: string;
    children?: MenuItem[];
}

export const menuData: MenuItem[] = [
    { title: '工作台', href: '/workspace' },
    {
        title: 'Create',
        children: [
            { title: 'Prompt 管理', href: '/prompt/manage' },
            { title: 'Prompt 调试', href: '/prompt/case' },
            { title: '图片生成', href: '/agent/image/generate' },
            { title: '配音生成', href: '/agent/video/dubbing' },
            { title: '网页生成', href: '/agent/web/generate' },
            { title: 'TTS 合成', href: '/audio/tts' },
        ],
    },
    {
        title: 'Learn',
        children: [
            { title: '日语笔记', href: '/docs/japanese' },
            { title: 'Demo', href: '/docs/demo' },
        ],
    },
    {
        title: 'Library',
        children: [
            { title: '系统规划', href: '/roadmap' },
            { title: '内部需求', href: '/requirements' },
            { title: '首页定制', href: '/workspace/home-builder' },
            { title: '文件管理', href: '/stepfun/file' },
        ],
    },
];
