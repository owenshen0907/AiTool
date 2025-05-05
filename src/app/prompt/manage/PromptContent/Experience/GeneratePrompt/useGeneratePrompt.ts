// File: src/app/prompt/manage/PromptContent/Experience/GeneratePrompt/useGeneratePrompt.ts
import { useState, useEffect } from 'react'
import {
    fetchPromptInputData,
    createPromptInputData,
    updatePromptInputData,
} from '@/lib/api/prompt'
import type { PromptGenerationInputData } from '@/lib/models/prompt'

export default function useGeneratePrompt(promptId: string) {
    const [initialData, setInitialData] = useState<PromptGenerationInputData[]>([])

    useEffect(() => {
        if (!promptId) return
        fetchPromptInputData(promptId)
            .then(data => setInitialData(data))
            .catch(console.error)
    }, [promptId])

    const persist = async (payloads: Omit<PromptGenerationInputData, 'id' | 'created_at'>[]) => {
        for (const payload of payloads) {
            const exist = initialData.find(d => d.part_index === payload.part_index)
            if (exist) {
                await updatePromptInputData([{ id: exist.id, ...payload }])
            } else {
                const created = await createPromptInputData(promptId, [payload])
                setInitialData(prev => [...prev, ...created])
            }
        }
    }

    return { initialData, persist }
}