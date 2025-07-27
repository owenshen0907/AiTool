// File: src/app/agent/image/generate/promptConfigs.ts

import type { PromptDefinition } from './types';

/**
 * 全局固定的输出格式，统一管理不同 agent 下同类型 prompt 的 OUTPUT_FORMAT
 */
export const globalOutputFormats: Record<'intent_prompt' | 'image_prompt', string> = {
    intent_prompt: JSON.stringify({
        intents: [
            {
                id: 'string',
                title: 'string',
                description: 'string',
                category: 'string',
                subcategory: 'string',
                confidence: 0
            }
        ]
    }),
    image_prompt: JSON.stringify({
        images: [
            {
                title: 'string',
                description: 'string',
                prompt: 'string',
                text: 'string'
            }
        ],
        design_notes: ['string'],
        suggested_image_count: 0
    })
};

/**
 * 各 agent 对应的 PromptDefinition 配置
 * 仅包含角色、任务、流程、说明等文本片段，不含 output_format
 */
export const promptConfigs: PromptDefinition[] = [
    {
        id: 'dailyJournal',
        title: '日语知识分享',
        purpose: '两阶段：1) 抽取日语学习意图 2) 基于选定意图生成插画提示。',
        prompts: {
            intent_prompt: {
                role: '你是日语学习内容意图抽取器。',
                task: '从用户输入（可含中日文文本及手动上传图片）中抽取最多 5 条意图，每条意图归为以下类别，并以结构化 JSON 输出，仅输出 JSON：。',
                steps: [
                    '读取并预处理输入文本与图片',
                    '为每段文本或图片分析对应意图类别',
                    'grammar：抽取相关变形规则、关联语法点与示例句',
                    'expression：提取口语/书面表达差异及文化背景示例',
                    'reading_comprehension：提炼段落主旨及背景要点',
                    'vocabulary：收集近义/反义/多义词及用法示例',
                    '合并重复意图，按 confidence 排序，保留前 5 条',
                    '输出 intents 数组'
                ],
                description: `意图类别及示例：
- grammar：语法点和变形。例如使役动词“書かせる”的构成，例句“先生は学生に作文を書かせました”。
- expression：常用表达及文化差异。例如“お疲れさまです”在口语与书面语境下的使用区别。
- reading_comprehension：段落理解。例如围绕“日本茶道”主题的阐述与背景介绍。
- vocabulary：词汇对比。例如“見る/観る/診る”的含义与用法示例。
- other：其他未归类意图。`,
                notes: [
                    '严格合法 JSON',
                    'intents 数量 ≤ 5',
                    '字段：id, title, description, category, subcategory, confidence,level（如有）',
                    'confidence 范围 0~1',
                ]
            },
            image_prompt: {
                role: '你是日语学习插画提示设计师。',
                task: '基于选定意图，规划 1~3 张教学插画提示并输出结构化 JSON。',
                steps: [
                    '判断所需图片数量',
                    '规划各图主题与层次（定义/例句/结构 或 对比/流程/词汇卡）',
                    '标注画面要素及编号'
                ],
                description: '视觉风格：扁平插画、明亮色、清晰文字留白；左上角圆形编号①②③；关键结构用色块标注。',
                notes: [
                    '严格 JSON 输出',
                    'images 数量 1~3',
                    '字段含义详见 globalOutputFormats.image_prompt'
                ]
            }
        }
    }
    // 后续可添加更多 agent 的 PromptDefinition
];