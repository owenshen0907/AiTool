export interface MenuItem {
    title: string;
    href?: string;
    children?: MenuItem[];
}

export const menuData: MenuItem[] = [
    { title: '首页', href: '/' },
    { title: '工作台', href: '/workspace' },
    { title: '首页定制', href: '/workspace/home-builder' },
    {
        title: 'AITool 工具箱',
        children: [
            {
                title: 'Prompt管理',
                children: [
                    { title: 'Prompt 管理', href: '/prompt/manage' },
                    { title: 'Prompt 调试', href: '/prompt/case' },
                ],
            },
            {
                title: '语音处理',
                children: [
                    { title: 'TTS 合成', href: '/audio/tts' },
                ],
            },
            {
                title: '阶跃小工具',
                children: [
                    { title: '文件管理', href: '/stepfun/file' },
                ],
            },
        ],
    },
    {
        title: '智能 Agent',
        children: [
            {
                title: '视频 Agent',
                children: [
                    { title: '配音生成', href: '/agent/video/dubbing' },
                ],
            },
            {
                title: '图片 Agent',
                children: [
                    { title: '图片生成', href: '/agent/image/generate' },
                ],
            },
            {
                title: '网页 Agent',
                children: [
                    { title: '网页生成', href: '/agent/web/generate' },
                ],
            },
        ],
    },
    {
        title: '智能文档',
        children: [
            { title: '日语笔记', href: '/docs/japanese' },
            { title: 'demo', href: '/docs/demo' },
        ],
    },
    {
        title: '资料',
        children: [
            { title: '系统规划', href: '/roadmap' },
        ],
    },
];
