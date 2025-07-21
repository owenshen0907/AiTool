// src/lib/repositories/agentConfigRepository.ts
import { pool } from '@/lib/db/client';
import { AgentSceneUpsert, AgentSceneConfigDBRow } from '@/lib/models/agentConfig';

/**
 * 查询单个 agent 的所有已配置场景
 */
export async function getAgentConfigByAgentId(userId: string, agentId: string): Promise<AgentSceneConfigDBRow[]> {
    const client = await pool.connect();
    try {
        const sql = `
      SELECT
        c.id,
        c.user_id      AS "userId",
        c.agent_id     AS "agentId",
        c.scene_key    AS "sceneKey",
        c.supplier_id  AS "supplierId",
        c.model_id     AS "modelId",
        c.extras       AS "extras",
        c.created_at   AS "createdAt",
        c.updated_at   AS "updatedAt",
        s.name         AS "supplierName",
        s.abbreviation AS "supplierAbbr",
        s.api_url      AS "supplierApiUrl",
        s.api_key      AS "supplierApiKey",
        s.wssurl       AS "supplierWssUrl",
        m.name         AS "modelName",
        m.model_type   AS "modelType",
        m.supports_audio_input    AS "supportsAudioInput",
        m.supports_image_input    AS "supportsImageInput",
        m.supports_video_input    AS "supportsVideoInput",
        m.supports_audio_output   AS "supportsAudioOutput",
        m.supports_image_output   AS "supportsImageOutput",
        m.supports_video_output   AS "supportsVideoOutput",
        m.supports_json_mode      AS "supportsJsonMode",
        m.supports_tool           AS "supportsTool",
        m.supports_web_search     AS "supportsWebSearch",
        m.supports_deep_thinking  AS "supportsDeepThinking",
        m.supports_websocket      AS "supportsWebsocket",
        m.is_default              AS "modelIsDefault"
      FROM agent_scene_config c
      JOIN ai_suppliers s ON c.supplier_id = s.id
      JOIN models m       ON c.model_id = m.id
      WHERE c.user_id = $1
        AND c.agent_id = $2
      ORDER BY c.scene_key;
    `;
        const { rows } = await client.query(sql, [userId, agentId]);
        return rows;
    } finally {
        client.release();
    }
}

/**
 * 批量 upsert 某个 agent 的场景
 */
export async function upsertAgentScenes(userId: string, agentId: string, scenes: AgentSceneUpsert[]) {
    if (!scenes.length) return;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const upsertSQL = `
            INSERT INTO agent_scene_config
                (user_id, agent_id, scene_key, supplier_id, model_id, extras)
            VALUES
                ($1,$2,$3,$4,$5,COALESCE($6,'{}'::jsonb))
                ON CONFLICT (user_id, agent_id, scene_key)
      DO UPDATE SET
                supplier_id = EXCLUDED.supplier_id,
                             model_id    = EXCLUDED.model_id,
                             extras      = EXCLUDED.extras,
                             updated_at  = NOW()
        `;

        for (const s of scenes) {
            await client.query(upsertSQL, [
                userId,
                agentId,
                s.sceneKey,
                s.supplierId,
                s.modelId,
                s.extras ?? {}
            ]);
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

/**
 * 删除该 agent 下未包含在 keepSceneKeys 列表中的场景
 */
export async function pruneAgentScenesForAgent(userId: string, agentId: string, keepSceneKeys: string[]) {
    const client = await pool.connect();
    try {
        const sql = `
            DELETE FROM agent_scene_config
            WHERE user_id = $1
              AND agent_id = $2
              AND scene_key <> ALL($3::text[])
        `;
        const { rowCount } = await client.query(sql, [userId, agentId, keepSceneKeys]);
        return rowCount || 0;
    } finally {
        client.release();
    }
}

/**
 * 可选：校验用户是否拥有相关 supplier 和 model（防止传入别人的 ID）
 * 如果你有“公共” supplier/model，则需要允许共享逻辑自行调整。
 */
export async function validateOwnership(
    userId: string,
    items: { supplierId: string; modelId: string }[]
) {
    if (!items.length) return;
    const client = await pool.connect();
    try {
        // 校验 supplier 归属
        const supplierIds = [...new Set(items.map(i => i.supplierId))];
        const supplierSql = `
      SELECT id FROM ai_suppliers
      WHERE id = ANY($1::uuid[])
        AND user_id = $2
    `;
        const { rows: supRows } = await client.query(supplierSql, [supplierIds, userId]);
        const okSupIds = new Set(supRows.map(r => r.id));
        for (const sid of supplierIds) {
            if (!okSupIds.has(sid)) {
                throw new Error(`Supplier not owned by user: ${sid}`);
            }
        }

        // 校验 model 归属（通过其 supplier_id 是否属于该用户）
        const modelIds = [...new Set(items.map(i => i.modelId))];
        const modelSql = `
      SELECT m.id
      FROM models m
      JOIN ai_suppliers s ON m.supplier_id = s.id
      WHERE m.id = ANY($1::uuid[])
        AND s.user_id = $2
    `;
        const { rows: modelRows } = await client.query(modelSql, [modelIds, userId]);
        const okModelIds = new Set(modelRows.map(r => r.id));
        for (const mid of modelIds) {
            if (!okModelIds.has(mid)) {
                throw new Error(`Model not owned by user: ${mid}`);
            }
        }
    } finally {
        client.release();
    }
}