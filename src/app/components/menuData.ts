export interface MenuItem {
    title: string;
    href?: string;
    children?: MenuItem[];
}

export const menuData: MenuItem[] = [
    { title: '工作台', href: '/workspace' },
    {
        title: '创作',
        children: [
            { title: '提示词工作台', href: '/prompt/manage' },
            { title: '提示词调试', href: '/prompt/case' },
            { title: '图片生成', href: '/agent/image/generate' },
            { title: '配音生成', href: '/agent/video/dubbing' },
            { title: '网页生成', href: '/agent/web/generate' },
            { title: 'TTS 合成', href: '/audio/tts' },
        ],
    },
    {
        title: '学习',
        children: [
            { title: '日语笔记', href: '/docs/japanese' },
            { title: '演示文档', href: '/docs/demo' },
        ],
    },
    {
        title: '资料库',
        children: [
            { title: '系统规划', href: '/roadmap' },
            { title: '内部需求', href: '/requirements' },
            { title: '首页定制', href: '/workspace/home-builder' },
            { title: '文件工具', href: '/stepfun/file' },
        ],
    },
];
