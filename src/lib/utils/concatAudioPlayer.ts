/**
 * concatAudioPlayer.ts
 * ------------------------------------------------------------
 * 把多段同源音频 (mp3 / wav / …) 按先后顺序合成为一段 WAV
 * 并返回  { blobUrl, cumDurations }
 *
 * - blobUrl       用于 <audio controls src={blobUrl}/>
 * - cumDurations  累积秒数组；根据 currentTime 实时定位当前正在播放第几段
 * ------------------------------------------------------------
 */

export interface MergedAudio {
    blobUrl: string;      // 浏览器本地 URL
    cumDurations: number[];// 累积时长 (每段开始时刻，单位：秒)
}

/* -------- 工具：拼接 AudioBuffer -------- */
async function concatAudioBuffers(buffers: AudioBuffer[]): Promise<AudioBuffer> {
    const len  = buffers.reduce((sum, b) => sum + b.length, 0);
    const rate = buffers[0].sampleRate;
    const ch   = buffers[0].numberOfChannels;

    const offCtx = new OfflineAudioContext(ch, len, rate);
    let offset = 0;
    buffers.forEach(buf => {
        const src = offCtx.createBufferSource();
        src.buffer = buf;
        src.connect(offCtx.destination);
        src.start(offset / rate);   // start(when) 单位秒
        offset += buf.length;
    });
    return offCtx.startRendering();
}

/* -------- 工具：AudioBuffer -> WAV (Uint8Array) -------- */
function audioBufferToWav(ab: AudioBuffer): Uint8Array {
    const chs = ab.numberOfChannels;
    const rate= ab.sampleRate;
    const bytesPerSample = 2;           // 16-bit PCM
    const dataLen = ab.length * chs * bytesPerSample;

    const buf  = new ArrayBuffer(44 + dataLen);
    const view = new DataView(buf);

    /* 写入字符串 */
    const ws = (off: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
    };
    let pos = 0;
    ws(pos, 'RIFF');          pos += 4;
    view.setUint32(pos, 36 + dataLen, true); pos += 4;
    ws(pos, 'WAVE');          pos += 4;
    ws(pos, 'fmt ');          pos += 4;
    view.setUint32(pos, 16, true);           pos += 4;        // PCM header size
    view.setUint16(pos, 1, true);            pos += 2;        // PCM format
    view.setUint16(pos, chs, true);          pos += 2;
    view.setUint32(pos, rate, true);         pos += 4;
    view.setUint32(pos, rate * chs * 2, true); pos += 4;
    view.setUint16(pos, chs * 2, true);      pos += 2;
    view.setUint16(pos, 16, true);           pos += 2;        // bits per sample
    ws(pos, 'data');          pos += 4;
    view.setUint32(pos, dataLen, true);      pos += 4;

    /* PCM 数据 */
    const channels = Array.from({ length: chs }, (_, i) => ab.getChannelData(i));
    for (let i = 0; i < ab.length; i++) {
        for (let ch = 0; ch < chs; ch++) {
            const sample = Math.max(-1, Math.min(1, channels[ch][i]));
            view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            pos += 2;
        }
    }
    return new Uint8Array(buf);
}

/* -------- 主函数：urls -> 合并后资源 -------- */
export async function createMergedAudio(urls: string[]): Promise<MergedAudio> {
    if (urls.length === 0) throw new Error('Empty url list');

    // 1. fetch -> ArrayBuffer
    const arrBufs = await Promise.all(urls.map(u => fetch(u).then(r => r.arrayBuffer())));

    // 2. decode -> AudioBuffer
    const ctx  = new AudioContext();
    const bufs = await Promise.all(arrBufs.map(b => ctx.decodeAudioData(b.slice(0))));

    // 3. 计算累积时长
    const cumDurations: number[] = [];
    let sum = 0;
    bufs.forEach(b => { cumDurations.push(sum); sum += b.duration; });

    // 4. concat + 导出 WAV
    const merged  = await concatAudioBuffers(bufs);
    const wavData = audioBufferToWav(merged);
    const blobUrl = URL.createObjectURL(new Blob([wavData], { type: 'audio/wav' }));

    return { blobUrl, cumDurations };
}

/* -------- 回收 -------- */
export function revokeMergedAudio(url?: string) {
    if (url) URL.revokeObjectURL(url);
}