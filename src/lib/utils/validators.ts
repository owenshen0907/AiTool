// src/lib/utils/validators.ts
import { z } from 'zod';

export const createPromptSchema = z.object({
    parent_id: z.string().uuid().optional(),
    type: z.enum(['dir', 'prompt']),
    title: z.string().min(1),
    content: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    attributes: z
        .array(
            z.object({
                name: z.string(),
                value: z.boolean(),
                suggestion: z.string().optional(),
                locked: z.boolean(),
            })
        )
        .optional(),
    comments: z.array(z.string()).optional(),
    is_public: z.boolean().optional(),
});

// 更新时必须带 id，其他字段可选
export const updatePromptSchema = z
    .object({ id: z.string().uuid() })
    .merge(createPromptSchema.partial());