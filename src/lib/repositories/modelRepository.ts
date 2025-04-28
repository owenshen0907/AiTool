// src/lib/repositories/modelRepository.ts
import { pool } from '@/lib/db/client';
import type { Model } from '@/lib/models/model';

/**
 * 获取指定供应商下的模型列表
 */
export async function getModelsBySupplier(
  supplierId: string
): Promise<Model[]> {
  const res = await pool.query<{
    id: string;
    supplier_id: string;
    name: string;
    model_type: string;
    supports_image_input: boolean;
    supports_video_input: boolean;
    supports_audio_output: boolean;
    supports_json_mode: boolean;
    supports_tool: boolean;
    supports_web_search: boolean;
    supports_deep_thinking: boolean;
  }>(
    `
SELECT id,
    supplier_id,
    name,
    model_type,
    supports_image_input,
    supports_video_input,
    supports_audio_output,
    supports_json_mode,
    supports_tool,
    supports_web_search,
    supports_deep_thinking
FROM models
WHERE supplier_id = $1
ORDER BY created_at DESC
    `,
    [supplierId]
  );

  return res.rows.map(r => ({
    id: r.id,
    supplierId: r.supplier_id,
    name: r.name,
    modelType: r.model_type as 'chat' | 'non-chat',
    supportsImageInput: r.supports_image_input,
    supportsVideoInput: r.supports_video_input,
    supportsAudioOutput: r.supports_audio_output,
    supportsJsonMode: r.supports_json_mode,
    supportsTool: r.supports_tool,
    supportsWebSearch: r.supports_web_search,
    supportsDeepThinking: r.supports_deep_thinking,
  }));
}

/**
 * 新增模型时的请求负载
 */
interface CreateModelPayload {
  supplierId: string;
  name: string;
  modelType: 'chat' | 'non-chat';
  supportsImageInput: boolean;
  supportsVideoInput: boolean;
  supportsAudioOutput: boolean;
  supportsJsonMode: boolean;
  supportsTool: boolean;
  supportsWebSearch: boolean;
  supportsDeepThinking: boolean;
}

/**
 * 创建新模型
 */
export async function createModel(
  payload: CreateModelPayload
): Promise<Model> {
  const res = await pool.query<{
    id: string;
    supplier_id: string;
    name: string;
    model_type: string;
    supports_image_input: boolean;
    supports_video_input: boolean;
    supports_audio_output: boolean;
    supports_json_mode: boolean;
    supports_tool: boolean;
    supports_web_search: boolean;
    supports_deep_thinking: boolean;
  }>(
    `
INSERT INTO models (
    supplier_id,
    name,
    model_type,
    supports_image_input,
    supports_video_input,
    supports_audio_output,
    supports_json_mode,
    supports_tool,
    supports_web_search,
    supports_deep_thinking
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
RETURNING
id,
    supplier_id,
    name,
    model_type,
    supports_image_input,
    supports_video_input,
    supports_audio_output,
    supports_json_mode,
    supports_tool,
    supports_web_search,
    supports_deep_thinking
        `,
    [
      payload.supplierId,
      payload.name,
      payload.modelType,
      payload.supportsImageInput,
      payload.supportsVideoInput,
      payload.supportsAudioOutput,
      payload.supportsJsonMode,
      payload.supportsTool,
      payload.supportsWebSearch,
      payload.supportsDeepThinking,
    ]
  );
  const r = res.rows[0];
  return {
    id: r.id,
    supplierId: r.supplier_id,
    name: r.name,
    modelType: r.model_type as 'chat' | 'non-chat',
    supportsImageInput: r.supports_image_input,
    supportsVideoInput: r.supports_video_input,
    supportsAudioOutput: r.supports_audio_output,
    supportsJsonMode: r.supports_json_mode,
    supportsTool: r.supports_tool,
    supportsWebSearch: r.supports_web_search,
    supportsDeepThinking: r.supports_deep_thinking,
  };
}

/**
 * 更新模型时的请求负载
 */
export interface UpdateModelPayload {
  name?: string;
  modelType?: 'chat' | 'non-chat';
  supportsImageInput?: boolean;
  supportsVideoInput?: boolean;
  supportsAudioOutput?: boolean;
  supportsJsonMode?: boolean;
  supportsTool?: boolean;
  supportsWebSearch?: boolean;
  supportsDeepThinking?: boolean;
}

/**
 * 更新模型
 */
export async function updateModel(
  id: string,
  updates: UpdateModelPayload
): Promise<Model> {
  const columnMap: Record<keyof UpdateModelPayload, string> = {
    name: 'name',
    modelType: 'model_type',
    supportsImageInput: 'supports_image_input',
    supportsVideoInput: 'supports_video_input',
    supportsAudioOutput: 'supports_audio_output',
    supportsJsonMode: 'supports_json_mode',
    supportsTool: 'supports_tool',
    supportsWebSearch: 'supports_web_search',
    supportsDeepThinking: 'supports_deep_thinking',
  };

  const keys = Object.keys(updates) as (keyof UpdateModelPayload)[];
  if (keys.length === 0) {
    throw new Error('No fields to update');
  }

  const setClauses = keys.map((key, idx) => `${columnMap[key]} = $${idx + 2}`);
  const values = keys.map(key => (updates as any)[key]);

  const sql = `
UPDATE models
SET ${setClauses.join(', ')}, updated_at = NOW()
WHERE id = $1
RETURNING
id,
    supplier_id,
    name,
    model_type,
    supports_image_input,
    supports_video_input,
    supports_audio_output,
    supports_json_mode,
    supports_tool,
    supports_web_search,
    supports_deep_thinking
        `;

  const res = await pool.query(sql, [id, ...values]);
  const r = res.rows[0];
  return {
    id: r.id,
    supplierId: r.supplier_id,
    name: r.name,
    modelType: r.model_type as 'chat' | 'non-chat',
    supportsImageInput: r.supports_image_input,
    supportsVideoInput: r.supports_video_input,
    supportsAudioOutput: r.supports_audio_output,
    supportsJsonMode: r.supports_json_mode,
    supportsTool: r.supports_tool,
    supportsWebSearch: r.supports_web_search,
    supportsDeepThinking: r.supports_deep_thinking,
  };
}