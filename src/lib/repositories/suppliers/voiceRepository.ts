import { pool } from '@/lib/db/client';
import type { VoiceTone } from '@/lib/models/model';
import { getSupplierById } from './supplierRepository';

/**
 * 查询当前用户下所有音色
 */
export async function getVoiceTonesByUser(userId: string): Promise<VoiceTone[]> {
    const res = await pool.query<{
        id: string;
        supplier_id: string;
        tone_id: string;
        name: string;
        description: string | null;
        available_model_ids: string[];
        sample_audio_path: string;
        created_at: string;
        updated_at: string;
    }>(`
    SELECT
      vt.id,
      vt.supplier_id,
      vt.tone_id,
      vt.name,
      vt.description,
      vt.available_model_ids,
      vt.sample_audio_path,
      vt.created_at,
      vt.updated_at
    FROM voice_tones vt
    JOIN ai_suppliers s
      ON vt.supplier_id = s.id
    WHERE s.user_id = $1
    ORDER BY vt.created_at DESC
  `, [userId]);

    return res.rows.map(r => ({
        id: r.id,
        supplierId: r.supplier_id,
        toneId: r.tone_id,
        name: r.name,
        description: r.description,
        availableModelIds: r.available_model_ids,
        sampleAudioPath: r.sample_audio_path,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));
}

/**
 * 新增音色
 */
export async function createVoiceTone(
    payload: {
        supplierId: string;
        toneId: string;
        name: string;
        description?: string | null;
        availableModelIds?: string[];
        sampleAudioPath?: string;
    },
    userId: string
): Promise<VoiceTone> {
    // 验证供应商归属
    const sup = await getSupplierById(payload.supplierId);
    if (sup.userId !== userId) {
        throw new Error('Forbidden');
    }

    const {
        supplierId,
        toneId,
        name,
        description = null,
        availableModelIds = [],
        sampleAudioPath = '',
    } = payload;

    const res = await pool.query<{
        id: string;
        supplier_id: string;
        tone_id: string;
        name: string;
        description: string | null;
        available_model_ids: string[];
        sample_audio_path: string;
        created_at: string;
        updated_at: string;
    }>(`
    INSERT INTO voice_tones
      (supplier_id, tone_id, name, description, available_model_ids, sample_audio_path)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING
      id, supplier_id, tone_id, name, description, available_model_ids,
      sample_audio_path, created_at, updated_at
  `, [
        supplierId,
        toneId,
        name,
        description,
        availableModelIds,
        sampleAudioPath,
    ]);

    const r = res.rows[0];
    return {
        id: r.id,
        supplierId: r.supplier_id,
        toneId: r.tone_id,
        name: r.name,
        description: r.description,
        availableModelIds: r.available_model_ids,
        sampleAudioPath: r.sample_audio_path,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

/**
 * 更新音色
 */
export async function updateVoiceTone(
    id: string,
    payload: {
        name?: string;
        description?: string | null;
        availableModelIds?: string[];
        sampleAudioPath?: string;
    },
    userId: string
): Promise<VoiceTone | null> {
    // 先查出当前记录及其 supplier.user_id
    const existingRes = await pool.query<{
        id: string;
        supplier_id: string;
        tone_id: string;
        name: string;
        description: string | null;
        available_model_ids: string[];
        sample_audio_path: string;
        created_at: string;
        updated_at: string;
        user_id: string;
    }>(`
    SELECT
      vt.*,
      s.user_id
    FROM voice_tones vt
    JOIN ai_suppliers s ON vt.supplier_id = s.id
    WHERE vt.id = $1
  `, [id]);

    if (existingRes.rowCount === 0) return null;
    const ex = existingRes.rows[0];
    if (ex.user_id !== userId) return null;

    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (payload.name !== undefined) {
        sets.push(`name = $${idx++}`);
        values.push(payload.name);
    }
    if (payload.description !== undefined) {
        sets.push(`description = $${idx++}`);
        values.push(payload.description);
    }
    if (payload.availableModelIds !== undefined) {
        sets.push(`available_model_ids = $${idx++}`);
        values.push(payload.availableModelIds);
    }
    if (payload.sampleAudioPath !== undefined) {
        sets.push(`sample_audio_path = $${idx++}`);
        values.push(payload.sampleAudioPath);
    }
    if (sets.length === 0) {
        // 无需更新，直接返回现有
        return {
            id: ex.id,
            supplierId: ex.supplier_id,
            toneId: ex.tone_id,
            name: ex.name,
            description: ex.description,
            availableModelIds: ex.available_model_ids,
            sampleAudioPath: ex.sample_audio_path,
            createdAt: ex.created_at,
            updatedAt: ex.updated_at,
        };
    }

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const res = await pool.query<{
        id: string;
        supplier_id: string;
        tone_id: string;
        name: string;
        description: string | null;
        available_model_ids: string[];
        sample_audio_path: string;
        created_at: string;
        updated_at: string;
    }>(`
    UPDATE voice_tones
    SET ${sets.join(', ')}
    WHERE id = $${idx}
    RETURNING
      id, supplier_id, tone_id, name, description,
      available_model_ids, sample_audio_path,
      created_at, updated_at
  `, values);

    const r = res.rows[0];
    return {
        id: r.id,
        supplierId: r.supplier_id,
        toneId: r.tone_id,
        name: r.name,
        description: r.description,
        availableModelIds: r.available_model_ids,
        sampleAudioPath: r.sample_audio_path,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

/**
 * 删除音色
 */
export async function deleteVoiceTone(id: string, userId: string): Promise<boolean> {
    // 确认归属
    const ownerRes = await pool.query<{ user_id: string }>(`
    SELECT s.user_id
    FROM voice_tones vt
    JOIN ai_suppliers s ON vt.supplier_id = s.id
    WHERE vt.id = $1
  `, [id]);
    if (ownerRes.rowCount === 0 || ownerRes.rows[0].user_id !== userId) {
        return false;
    }

    await pool.query(`DELETE FROM voice_tones WHERE id = $1`, [id]);
    return true;
}