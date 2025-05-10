// =============================
// File: src/app/prompt/manage/PromptContent/Experience/GeneratePrompt/persistStep.ts
// =============================
import type { PromptGenerationInputData } from '@/lib/models/prompt/prompt';

export type PersistPayload = Omit<PromptGenerationInputData, 'id' | 'created_at'>;

export function buildPayload(
    step: number,
    promptId: string,
    scenario: 'TEXT' | 'IMG_TEXT' | 'VIDEO_TEXT' | 'AUDIO_TEXT',
    textContent: string,
    imagePaths: string[],
    imageDesc: string,
    videoPath: string | null,
    videoDesc: string,
    audioPath: string | null,
    audioDesc: string,
    selectedIntent: string,
    customIntent: string,
    outputFormat: string,
    schema: string,
    outputExample: string,
): PersistPayload {
    const intentCode = customIntent.trim() || selectedIntent;

    switch (step) {
        case 0:
            return {
                prompt_id: promptId,
                part_index: 0,
                part_type: 'text',
                content: { text: scenario },
            };

        case 1: {
            if (scenario === 'TEXT') {
                return {
                    prompt_id: promptId,
                    part_index: 1,
                    part_type: 'text',
                    content: { text: textContent },
                };
            }
            if (scenario === 'IMG_TEXT') {
                return {
                    prompt_id: promptId,
                    part_index: 1,
                    part_type: 'image_url',
                    content: { urls: imagePaths, detail: 'high', text: imageDesc },
                };
            }
            if (scenario === 'VIDEO_TEXT') {
                return {
                    prompt_id: promptId,
                    part_index: 1,
                    part_type: 'video_url',
                    content: { url: videoPath!, text: videoDesc },
                };
            }
            // AUDIO_TEXT
            return {
                prompt_id: promptId,
                part_index: 1,
                part_type: 'input_audio',
                content: { data: audioPath!, format: 'mp3', text: audioDesc },
            };
        }

        case 2:
            return {
                prompt_id: promptId,
                part_index: 2,
                part_type: 'text',
                content: { text: intentCode },
            };

        case 3:
            return {
                prompt_id: promptId,
                part_index: 3,
                part_type: 'text',
                content: {
                    text: outputFormat,
                    ...(outputFormat === 'JSON' ? { schema } : {}),
                },
            };

        case 4:
            return {
                prompt_id: promptId,
                part_index: 4,
                part_type: 'text',
                content: { text: outputExample },
            };

        default:
            throw new Error(`Unknown step: ${step}`);
    }
}