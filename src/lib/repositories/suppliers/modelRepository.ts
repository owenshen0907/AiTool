// File: src/lib/repositories/suppliers/modelRepository.ts
import { pool } from '@/lib/db/client';
import type { Model } from '@/lib/models/model';

/** 获取指定供应商、指定类型的所有模型 */
export async function getModelsBySupplier(supplierId: string): Promise<Model[]> {
  const res = await pool.query<{
    id: string;
    supplier_id: string;
    name: string;
    model_type: string;
    supports_audio_input: boolean;
    supports_image_input: boolean;
    supports_video_input: boolean;
    supports_audio_output: boolean;
    supports_image_output: boolean;
    supports_video_output: boolean;
    supports_json_mode: boolean;
    supports_tool: boolean;
    supports_web_search: boolean;
    supports_deep_thinking: boolean;
    supports_websocket: boolean;
    is_default: boolean;
  }>(
      `SELECT
         id, supplier_id, name, model_type,
         supports_audio_input,
         supports_image_input,
         supports_video_input,
         supports_audio_output,
         supports_image_output,
         supports_video_output,
         supports_json_mode,
         supports_tool,
         supports_web_search,
         supports_deep_thinking,
         supports_websocket,
         is_default
       FROM models
       WHERE supplier_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [supplierId]
  );

  return res.rows.map(r => ({
    id: r.id,
    supplierId: r.supplier_id,
    name: r.name,
    modelType: r.model_type as 'chat' | 'audio' | 'image' | 'video' | 'other',
    supportsAudioInput: r.supports_audio_input,
    supportsImageInput: r.supports_image_input,
    supportsVideoInput: r.supports_video_input,
    supportsAudioOutput: r.supports_audio_output,
    supportsImageOutput: r.supports_image_output,
    supportsVideoOutput: r.supports_video_output,
    supportsJsonMode: r.supports_json_mode,
    supportsTool: r.supports_tool,
    supportsWebSearch: r.supports_web_search,
    supportsDeepThinking: r.supports_deep_thinking,
    supportsWebsocket: r.supports_websocket,
    isDefault: r.is_default,
  }));
}

/** 清除指定供应商、指定类型下的默认标记 */
export async function clearDefaultModelForSupplierAndType(
    supplierId: string,
    modelType: string
) {
  await pool.query(
      `UPDATE models
       SET is_default = FALSE
       WHERE supplier_id = $1
         AND model_type = $2`,
      [supplierId, modelType]
  );
}

/** 根据 modelId 找供应商及类型再清除该类型默认 */
export async function clearDefaultModelForSupplierByModel(
    modelId: string
) {
  const { rows } = await pool.query<{ supplier_id: string; model_type: string }>(
      `SELECT supplier_id, model_type FROM models WHERE id = $1`,
      [modelId]
  );
  if (rows.length) {
    await clearDefaultModelForSupplierAndType(
        rows[0].supplier_id,
        rows[0].model_type
    );
  }
}

export interface CreateModelPayload {
  supplierId: string;
  name: string;
  modelType: 'chat' | 'audio' | 'image' | 'video' | 'other';
  supportsAudioInput: boolean;
  supportsImageInput: boolean;
  supportsVideoInput: boolean;
  supportsAudioOutput: boolean;
  supportsImageOutput: boolean;
  supportsVideoOutput: boolean;
  supportsJsonMode: boolean;
  supportsTool: boolean;
  supportsWebSearch: boolean;
  supportsDeepThinking: boolean;
  supportsWebsocket: boolean;
  isDefault: boolean;
}

export async function createModel(
    payload: CreateModelPayload
): Promise<Model> {
  // 若设为默认，仅清空当前类型的其他默认
  if (payload.isDefault) {
    await clearDefaultModelForSupplierAndType(
        payload.supplierId,
        payload.modelType
    );
  }

  const res = await pool.query<{
    id: string;
    supplier_id: string;
    name: string;
    model_type: string;
    supports_audio_input: boolean;
    supports_image_input: boolean;
    supports_video_input: boolean;
    supports_audio_output: boolean;
    supports_image_output: boolean;
    supports_video_output: boolean;
    supports_json_mode: boolean;
    supports_tool: boolean;
    supports_web_search: boolean;
    supports_deep_thinking: boolean;
    supports_websocket: boolean;
    is_default: boolean;
  }>(
      `INSERT INTO models (
        supplier_id, name, model_type,
        supports_audio_input, supports_image_input, supports_video_input,
        supports_audio_output, supports_image_output, supports_video_output,
        supports_json_mode, supports_tool, supports_web_search, supports_deep_thinking,
        supports_websocket, is_default
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
      [
        payload.supplierId,
        payload.name,
        payload.modelType,
        payload.supportsAudioInput,
        payload.supportsImageInput,
        payload.supportsVideoInput,
        payload.supportsAudioOutput,
        payload.supportsImageOutput,
        payload.supportsVideoOutput,
        payload.supportsJsonMode,
        payload.supportsTool,
        payload.supportsWebSearch,
        payload.supportsDeepThinking,
        payload.supportsWebsocket,
        payload.isDefault,
      ]
  );
  const r = res.rows[0];
  return {
    id: r.id,
    supplierId: r.supplier_id,
    name: r.name,
    modelType: r.model_type as 'chat' | 'audio' | 'image' | 'video' | 'other',
    supportsAudioInput: r.supports_audio_input,
    supportsImageInput: r.supports_image_input,
    supportsVideoInput: r.supports_video_input,
    supportsAudioOutput: r.supports_audio_output,
    supportsImageOutput: r.supports_image_output,
    supportsVideoOutput: r.supports_video_output,
    supportsJsonMode: r.supports_json_mode,
    supportsTool: r.supports_tool,
    supportsWebSearch: r.supports_web_search,
    supportsDeepThinking: r.supports_deep_thinking,
    supportsWebsocket: r.supports_websocket,
    isDefault: r.is_default,
  };
}

export interface UpdateModelPayload {
  name?: string;
  modelType?: 'chat' | 'audio' | 'image' | 'video' | 'other';
  supportsAudioInput?: boolean;
  supportsImageInput?: boolean;
  supportsVideoInput?: boolean;
  supportsAudioOutput?: boolean;
  supportsImageOutput?: boolean;
  supportsVideoOutput?: boolean;
  supportsJsonMode?: boolean;
  supportsTool?: boolean;
  supportsWebSearch?: boolean;
  supportsDeepThinking?: boolean;
  supportsWebsocket?: boolean;
  isDefault?: boolean;
}

export async function updateModel(
    id: string,
    updates: UpdateModelPayload
): Promise<Model> {
  const columnMap: Record<keyof UpdateModelPayload, string> = {
    name: 'name',
    modelType: 'model_type',
    supportsAudioInput: 'supports_audio_input',
    supportsImageInput: 'supports_image_input',
    supportsVideoInput: 'supports_video_input',
    supportsAudioOutput: 'supports_audio_output',
    supportsImageOutput: 'supports_image_output',
    supportsVideoOutput: 'supports_video_output',
    supportsJsonMode: 'supports_json_mode',
    supportsTool: 'supports_tool',
    supportsWebSearch: 'supports_web_search',
    supportsDeepThinking: 'supports_deep_thinking',
    supportsWebsocket: 'supports_websocket',
    isDefault: 'is_default',
  };

  const keys = Object.keys(updates) as (keyof UpdateModelPayload)[];
  if (keys.length === 0) throw new Error('No fields to update');

  // 若更新 isDefault，为 true，则仅清当前类型默认
  if (updates.isDefault) {
    const { rows } = await pool.query<{ supplier_id: string; model_type: string }>(
        `SELECT supplier_id, model_type FROM models WHERE id = $1`,
        [id]
    );
    if (rows.length) {
      await clearDefaultModelForSupplierAndType(
          rows[0].supplier_id,
          rows[0].model_type
      );
    }
  }

  const setClauses = keys.map((key, i) => `${columnMap[key]} = $${i + 2}`);
  const values = keys.map(key => (updates as any)[key]);

  const sql = `
    UPDATE models
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = $1
      RETURNING *
  `;

  const res = await pool.query(sql, [id, ...values]);
  const r = res.rows[0];
  return {
    id: r.id,
    supplierId: r.supplier_id,
    name: r.name,
    modelType: r.model_type as 'chat' | 'audio' | 'image' | 'video' | 'other',
    supportsAudioInput: r.supports_audio_input,
    supportsImageInput: r.supports_image_input,
    supportsVideoInput: r.supports_video_input,
    supportsAudioOutput: r.supports_audio_output,
    supportsImageOutput: r.supports_image_output,
    supportsVideoOutput: r.supports_video_output,
    supportsJsonMode: r.supports_json_mode,
    supportsTool: r.supports_tool,
    supportsWebSearch: r.supports_web_search,
    supportsDeepThinking: r.supports_deep_thinking,
    supportsWebsocket: r.supports_websocket,
    isDefault: r.is_default,
  };
}
