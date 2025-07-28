// File: src/lib/openai/imageEdits.ts
import type { AgentSceneConfig } from 'src/hooks/useAgentScenes';

export interface EditImageOptions {
    /** 编辑描述（必填） */
    prompt: string;
    /** OpenAI/StepFun 场景配置（必填，含 apiUrl / apiKey） */
    scene: AgentSceneConfig;
    /**
     * 需要编辑的图片（必填）
     * - 支持：File / Blob / dataURL / 纯 base64 / http(s) URL / 相对路径（会自动 fetch → Blob）
     */
    image: File | Blob | string;

    /** 模型名（StepFun 当前仅支持：step-1x-edit） */
    model?: string; // 默认 'step-1x-edit'

    /** 随机种子，不传或传 0 则使用系统随机 */
    seed?: number;
    /** 生成步数 [1,100]，默认 28 */
    steps?: number;
    /** guidance scale [1,10]，默认 6 */
    cfg_scale?: number;
    /**
     * 输出尺寸
     * - '512x512' | '768x768' | '1024x1024'
     * - 当输入非 1:1 时，按原图宽高比缩放，长边等于 size 指定值
     */
    size?: string;
    /** 返回格式（默认 url） */
    response_format?: 'b64_json' | 'url';

    /** 透传用户 ID（可选，与 OpenAI 规范一致） */
    user?: string;
}

/**
 * 调用 StepFun 图像编辑接口（与 OpenAI 规范一致）：
 * POST {apiUrl}/images/edits
 *
 * 必填字段：
 * - model: 'step-1x-edit'
 * - image: File（仅支持 1 张）
 * - prompt: string
 *
 * 可选字段：
 * - seed, steps, cfg_scale, size, response_format
 *
 * 返回：
 * - 当 response_format = 'b64_json'：返回 base64 字符串数组（不带 data: 前缀）
 * - 当 response_format = 'url'：返回 url 字符串数组
 */
export async function editImage(opts: EditImageOptions): Promise<string[]> {
    const {
        prompt,
        scene,
        image,
        model = 'step-1x-edit',
        seed,
        steps,
        cfg_scale,
        size,
        response_format = 'url',
        user,
    } = opts;

    if (!scene?.supplier?.apiUrl || !scene?.supplier?.apiKey) {
        throw new Error('缺少 scene.supplier.apiUrl 或 scene.supplier.apiKey。');
    }
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('prompt 不能为空。');
    }
    if (!image) {
        throw new Error('image 不能为空。');
    }

    const url = `${scene.supplier.apiUrl}/images/edits`;
    const { blob, filename } = await normalizeImageInput(image);

    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('image', blob, filename);

    if (typeof seed === 'number') form.append('seed', String(seed));
    if (typeof steps === 'number') form.append('steps', String(steps));
    if (typeof cfg_scale === 'number') form.append('cfg_scale', String(cfg_scale));
    if (typeof size === 'string' && size) form.append('size', size);
    if (response_format) form.append('response_format', response_format);
    if (user) form.append('user', user);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            // ⚠️ 不要显式设置 Content-Type，浏览器会自动带上 multipart 边界
            Authorization: `Bearer ${scene.supplier.apiKey}`,
        },
        body: form,
    });

    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();
    let data: any = raw;
    if (contentType.includes('application/json')) {
        try {
            data = raw ? JSON.parse(raw) : null;
        } catch {
            // 保留 raw，供错误分支抛给上层
        }
    }

    if (!res.ok) {
        const msg =
            (data && typeof data === 'object' && (data.error?.message || data.error)) ||
            (typeof data === 'string' ? data : '') ||
            `编辑图片失败（${res.status}）`;
        throw new Error(msg);
    }

    // 按 OpenAI 规范：data: [{url}] 或 [{b64_json}]
    const arr: Array<{ url?: string; b64_json?: string }> = Array.isArray(data?.data) ? data.data : [];
    if (!Array.isArray(arr) || arr.length === 0) {
        return [];
    }

    if (response_format === 'b64_json') {
        return arr.map((it) => it.b64_json || '').filter(Boolean);
    } else {
        return arr.map((it) => it.url || '').filter(Boolean);
    }
}

/* ========================== 内部工具 ========================== */

/** 判断是否 dataURL */
function isDataUrl(s: string) {
    return /^data:([a-z-]+\/[a-z0-9.+-]+)?;base64,/i.test(s);
}
/** 判断是否可能是纯 base64（无 data: 头），做一个保守判断 */
function isBareBase64(s: string) {
    if (!s || typeof s !== 'string') return false;
    if (s.startsWith('data:')) return false;
    if (/^https?:\/\//i.test(s)) return false;
    if (s.startsWith('/')) return false;
    const t = s.replace(/\s+/g, '');
    // 经验阈值：小于 128 字符的一般不是有效图片
    if (t.length < 128) return false;
    return /^[A-Za-z0-9+/=_-]+$/.test(t);
}

function dataUrlToBlob(dataUrl: string): Blob {
    const [head, base64] = dataUrl.split(',');
    const mime = head.match(/^data:([^;]+);base64/i)?.[1] || 'image/png';
    const bin = atob(base64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

function base64ToBlob(b64: string, mime = 'image/png'): Blob {
    const bin = atob(b64.replace(/\s+/g, ''));
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

async function fetchAsBlob(url: string): Promise<{ blob: Blob; filename: string }> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`获取图片失败：${res.status}`);
    const blob = await res.blob();
    // 尝试从 URL 提取文件名
    const name = url.split('/').pop() || 'image';
    const ext =
        (blob.type && blob.type.split('/')[1]) ||
        (name.includes('.') ? name.split('.').pop() : 'png');
    const filename = name.includes('.') ? name : `${name}.${ext}`;
    return { blob, filename };
}

/**
 * 归一化图片输入为 Blob + 文件名
 * - File：直接使用
 * - Blob：使用默认文件名 image.png（或按 mimetype 推断）
 * - dataURL：转为 Blob
 * - 纯 base64：按 image/png 解码
 * - http(s)/相对 URL：fetch → Blob
 */
async function normalizeImageInput(
    image: File | Blob | string
): Promise<{ blob: Blob; filename: string }> {
    // File
    if (typeof File !== 'undefined' && image instanceof File) {
        return { blob: image, filename: image.name || 'image.png' };
    }
    // Blob
    if (typeof Blob !== 'undefined' && image instanceof Blob) {
        const ext = image.type ? image.type.split('/')[1] : 'png';
        return { blob: image, filename: `image.${ext}` };
    }
    // string
    if (typeof image === 'string') {
        const s = image.trim();
        if (isDataUrl(s)) {
            const blob = dataUrlToBlob(s);
            const mime = (blob.type || 'image/png').split('/')[1];
            return { blob, filename: `image.${mime}` };
        }
        if (isBareBase64(s)) {
            const blob = base64ToBlob(s, 'image/png');
            return { blob, filename: 'image.png' };
        }
        // URL（绝对或相对）
        return fetchAsBlob(s);
    }

    throw new Error('不支持的 image 类型。');
}