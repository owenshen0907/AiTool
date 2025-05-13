export interface MenuItem {
    title: string;
    href?: string;
    children?: MenuItem[];
}

export const menuData: MenuItem[] = [
    { title: '首页', href: '/' },

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
                title: '模型微调',
                children: [
                    { title: '微调管理', href: '/fine-tune/manage' },
                    { title: '数据集管理', href: '/fine-tune/datasets' },
                ],
            },
            {
                title: '语音处理',
                children: [
                    { title: 'ASR 识别', href: '/speech/asr' },
                    { title: 'TTS 合成', href: '/speech/tts' },
                    { title: '实时语音', href: '/speech/real-time' },
                ],
            },
            {
                title: '图像处理',
                children: [
                    { title: '图片生成', href: '/image/generate' },
                ],
            },
        ],
    },
    {
        title: '知识库管理',
        children: [
            { title: '知识库列表', href: '/kb/manage' },
            { title: '文件管理', href: '/kb/files' },
        ],
    },
    {
        title: '智能 Agent',
        children: [
            {
                title: '视频 Agent',
                children: [
                    { title: '视频总结', href: '/agent/video/summary' },
                    { title: '剪辑脚本生成', href: '/agent/video/script' },
                    { title: '文案撰写', href: '/agent/video/copy' },
                ],
            },
            {
                title: '图片 Agent',
                children: [
                    { title: '批量分析', href: '/agent/image/batch-analysis' },
                    { title: '批量标注', href: '/agent/image/batch-annotate' },
                ],
            },
            {
                title: '文件 Agent',
                children: [
                    { title: '文本总结', href: '/agent/file/text-summary' },
                    { title: '图片总结', href: '/agent/file/image-summary' },
                ],
            },
            {
                title: '代码 Agent',
                children: [
                    { title: '生成 README', href: '/agent/code/readme' },
                    { title: '接口文档生成', href: '/agent/code/docs' },
                ],
            },
            { title: '自定义测试', href: '/agent/other/custom-test' },
        ],
    },



    {
        title: '关于欧文',
        children: [
            { title: '工作文档', href: '/docs/work' },
            { title: '学习笔记', href: '/docs/study' },
            { title: '日语笔记', href: '/docs/japanese' },
            { title: '旅游攻略', href: '/docs/travel' },
        ],
    },

    { title: '关于 AITool', href: '/about' },
];