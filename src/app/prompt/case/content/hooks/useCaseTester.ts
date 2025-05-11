// File: app/prompt/case/content/hooks/useCaseTester.ts
'use client';

import { useState, useCallback } from 'react';
import type { CaseRow } from '../CaseTable';
import type { Supplier } from '@/lib/models/model';

/**
 * Hook that handles single and batch LLM testing logic
 */
export function useCaseTester(
    suppliers: Supplier[],
    supplierId: string,
    testModel: string,
    prompt: string,
    concurrency: number
) {
    const [testing, setTesting] = useState(false);

    const executeSingle = useCallback(async (
        row: CaseRow,
        onUpdate: (r: CaseRow) => void
    ) => {
        if (!supplierId || !testModel) return;
        const sup = suppliers.find(s => s.id === supplierId);
        if (!sup) return;
        setTesting(true);
        let accum = '';

        try {
            const res = await fetch(`${sup.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sup.apiKey}`,
                },
                body: JSON.stringify({
                    model: testModel,
                    stream: true,
                    messages: [
                        { role: 'system', content: prompt },
                        { role: 'user', content: row.caseText },
                    ],
                }),
            });
            if (!res.body) throw new Error('No response stream');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunk = decoder.decode(value, { stream: true });
                chunk.split('\n').forEach(line => {
                    if (!line.startsWith('data: ')) return;
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr === '[DONE]') return;
                    try {
                        const pkg = JSON.parse(jsonStr);
                        const delta = pkg.choices[0].delta.content;
                        if (delta) {
                            accum += delta;
                            onUpdate({ ...row, testResult: accum });
                        }
                    } catch {}
                });
            }

            // final pass/fail
            onUpdate({
                ...row,
                testResult: accum,
                passed:    accum.trim() === row.groundTruth.trim(),
            });
        } catch (e) {
            console.error(e);
        } finally {
            setTesting(false);
        }
    }, [suppliers, supplierId, testModel, prompt]);

    const executeBatch = useCallback(async (
        rows: CaseRow[],
        onUpdate: (r: CaseRow) => void
    ) => {
        const toTest = rows.filter(r => r.selected);
        if (!toTest.length) return;

        setTesting(true);
        // 简单的 Promise 池实现
        const pool: Promise<void>[] = [];
        for (const row of toTest) {
            const p = executeSingle(row, onUpdate);
            pool.push(p);

            if (pool.length >= concurrency) {
                // 等最先完成的那个
                await Promise.race(pool);
                // 把已完成的从池里剔除
                for (let i = pool.length - 1; i >= 0; i--) {
                    if (pool[i].catch(() => {}).then(() => true)) {
                        pool.splice(i, 1);
                    }
                }
            }
        }
        // 等待剩下的全部跑完
        await Promise.all(pool);
        setTesting(false);
    }, [executeSingle, concurrency]);

    return { testing, executeSingle, executeBatch };
}
