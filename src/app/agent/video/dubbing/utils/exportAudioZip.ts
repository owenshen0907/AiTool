/**
 * 把选中的音频 blob & 字幕一起压缩成 zip 并自动下载
 * ---------------------------------------------------------------
 * cases            原始 DubCase 数组（要保证 audioUrl 不为空）
 * indices          选中的行在 cases 中的索引（升序）
 * voiceTones       全量音色列表：用来把 voiceId → 人类可读 name
 * supplierId       当行 voiceId 为空时，用 supplierId 找默认音色
 */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { DubCase } from '../DubbingHeader';
import type { VoiceTone } from '@/lib/models/model';

/* -------- 辅助：格式化时间到 SRT 00:00:00,000 -------- */
function fmt(t: number) {
    const ms   = Math.floor((t % 1) * 1000).toString().padStart(3, '0');
    const sec  = Math.floor(t) % 60;
    const min  = Math.floor(t / 60) % 60;
    const hour = Math.floor(t / 3600);
    return `${hour.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')},${ms}`;
}

/* -------- 主函数 -------- */
export async function exportAudioZip(
    cases: DubCase[],
    indices: number[],
    voiceTones: VoiceTone[],
    supplierId: string
) {
    if (indices.length === 0) { alert('请先选择要导出的行'); return; }

    const zip   = new JSZip();
    const audio = zip.folder('audio')!;
    let  srtStr = '';
    let  offset = 0;

    // For each selected index
    for (let order = 0; order < indices.length; order++) {
        const i = indices[order];
        const c = cases[i];
        if (!c.audioUrl) continue;

        /* ① 下载 blob */
        const resp = await fetch(c.audioUrl);
        const blob = await resp.blob();

        /* ② 获取时长 (decode only header for duration) */
        const arrayBuf = await blob.arrayBuffer();
        const ctx      = new AudioContext({ sampleRate: 16000 }); // sampleRate 无关
        const buf      = await ctx.decodeAudioData(arrayBuf.slice(0));
        const dur      = buf.duration;           // 秒

        /* ③ 文件名：序号_音色名_文本前5.ext */
        const idxStr   = (order + 1).toString().padStart(3, '0');
        const vtName   = (() => {
            const vid = c.voiceId || voiceTones.find(v=>v.supplierId===supplierId)?.toneId;
            return voiceTones.find(v => v.toneId === vid)?.name || 'unknown';
        })();
        const first5   = (c.text || '').slice(0, 5).replace(/[\\/:*?"<>|]/g, '');
        const ext      = blob.type.split('/')[1] || 'wav';
        const fileName = `${idxStr}_${vtName}_${first5||'blank'}.${ext}`;

        audio.file(fileName, blob);

        /* ④ SRT 片段 */
        srtStr += `${order+1}\n${fmt(offset)} --> ${fmt(offset+dur)}\n${c.text || ''}\n\n`;
        offset += dur;
    }

    /* ⑤ 插入字幕文件 */
    zip.file('subtitles.srt', srtStr);

    /* ⑥ 生成并下载 */
    const content = await zip.generateAsync({ type:'blob' });
    const stamp   = new Date().toISOString().replace(/[-T:]/g,'').slice(0,15);
    const filename= `Owen的AiTool配音生成器_${stamp}.zip`;
    saveAs(content, filename);
}