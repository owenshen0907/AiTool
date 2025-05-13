// app/prompt/case/content/InstructionGuide.tsx
'use client';

import React from 'react';
import {
    Edit3,
    Plus,
    Folder,
    Cpu,
    ClipboardCheck,
    ArrowRight,
    ArrowDown,
} from 'lucide-react';

export default function InstructionGuide() {
    return (
        <div className="flex justify-center p-4 w-full">
            <div
                className="w-full bg-white rounded-2xl shadow-lg flex overflow-hidden"
                style={{ height: '240px' }}
            >
                {/* Vertical Title: two columns of vertical text */}
                <div className="w-16 flex items-center justify-center bg-gray-50 rounded-l-2xl">
                    <div className="flex flex-col items-center">
                        {['测试','用例','管理','操作','指南'].map((char, idx) => (
                            <span key={idx} className="text-lg font-semibold text-gray-800 leading-tight">{char}</span>
                        ))}
                    </div>
                </div>

                {/* Content Cards */}
                <div className="flex-1 p-4 flex flex-wrap items-center justify-between gap-2">
                    {/* 1. Prompt 编辑 */}
                    <Card>
                        <Edit3 size={32} className="text-gray-800" />
                        <div className="mt-2 font-medium text-gray-900 flex items-center">
                            Prompt 编辑 <ArrowRight size={20} className="text-gray-400 animate-pulse ml-1" />
                        </div>
                        <p className="mt-1 text-xs text-gray-600 leading-snug">
                            请在页面最右侧的编辑框中撰写测试 Prompt，支持多行与模板占位，执行前务必检查。
                        </p>
                    </Card>

                    {/* 2. 设置 Case */}
                    <Card>
                        <Plus size={32} className="text-blue-600" />
                        <div className="mt-2 font-medium text-gray-900 flex flex-col items-center">
                            <span>设置 Case</span>
                            <ArrowDown size={20} className="text-gray-400 animate-pulse mt-1" />
                        </div>
                        <p className="mt-1 text-xs text-gray-600 leading-snug">
                            在下方 Case 面板中，点击“新增 Case”或批量导入，录入测试输入与预期输出。
                        </p>
                    </Card>

                    {/* 3. 配置模型 */}
                    <Card>
                        <Folder size={32} className="text-indigo-600" />
                        <div className="mt-2 font-medium text-gray-900">选择供应商 & 模型</div>
                        <p className="mt-1 text-xs text-gray-600 leading-snug">
                            从下拉列表中选择已配置的供应商及模型，若列表为空，请前往“个人信息管理”页添加。
                        </p>
                    </Card>

                    {/* 4. 并发测试 */}
                    <Card>
                        <Cpu size={32} className="text-green-600" />
                        <div className="mt-2 font-medium text-gray-900">并发测试</div>
                        <p className="mt-1 text-xs text-gray-600 leading-snug">
                            在并发输入框设置线程数后，点击“开始测试”批量并行执行所有 Case。
                        </p>
                    </Card>

                    {/* 5. 自动评估 */}
                    <Card>
                        <ClipboardCheck size={32} className="text-purple-600" />
                        <div className="mt-2 font-medium text-gray-900">自动评估</div>
                        <p className="mt-1 text-xs text-gray-600 leading-snug">
                            测试完成后，点击“自动评估”快速判定通过状态并生成原因分析。
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Reusable card wrapper
function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex-1 min-w-[120px] max-w-[200px] flex flex-col items-center text-center p-2">
            {children}
        </div>
    );
}
