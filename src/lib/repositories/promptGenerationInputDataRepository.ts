// src/lib/repositories/promptGenerationInputDataRepository.ts
import { pool } from '@/lib/db/client';
import { PromptGenerationInputData } from '@/lib/models/prompt/prompt';

/**
 * 查询某个 prompt 下所有生成时用到的输入数据，按 part_index 升序
 */
export async function getInputDataByPrompt(
    promptId: string
): Promise<PromptGenerationInputData[]> {
    const { rows } = await pool.query<PromptGenerationInputData>(
        `SELECT *
       FROM prompt_generation_input_data
      WHERE prompt_id = $1
      ORDER BY part_index ASC`,
        [promptId]
    );
    return rows;
}

/**
 * 插入单条生成输入数据
 */
export async function insertInputData(
    data: Omit<PromptGenerationInputData, 'id' | 'created_at'>
): Promise<PromptGenerationInputData> {
    const { prompt_id, part_index, part_type, content } = data;
    const { rows } = await pool.query<PromptGenerationInputData>(
        `INSERT INTO prompt_generation_input_data(
       prompt_id, part_index, part_type, content
     ) VALUES ($1, $2, $3, $4)
     RETURNING *`,
        [prompt_id, part_index, part_type, content]
    );
    return rows[0];
}

/**
 * 更新单条生成输入数据的内容或顺序等字段
 */
export async function updateInputData(
    id: string,
    changes: Partial<Omit<PromptGenerationInputData, 'id' | 'prompt_id' | 'created_at'>>
): Promise<void> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(changes)) {
        sets.push(`${key} = $${idx}`);
        values.push(val);
        idx++;
    }
    if (sets.length === 0) return;
    values.push(id);
    await pool.query(
        `UPDATE prompt_generation_input_data
        SET ${sets.join(', ')}
      WHERE id = $${idx}`,
        values
    );
}

/**
 * 删除某个 prompt 下所有生成输入数据
 */
export async function deleteInputDataByPrompt(
    promptId: string
): Promise<void> {
    await pool.query(
        `DELETE FROM prompt_generation_input_data WHERE prompt_id = $1`,
        [promptId]
    );
}

/**
 * 删除单条生成输入数据
 */
export async function deleteInputData(
    id: string
): Promise<void> {
    await pool.query(
        `DELETE FROM prompt_generation_input_data WHERE id = $1`,
        [id]
    );
}
