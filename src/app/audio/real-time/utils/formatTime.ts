// File: src/app/audio/real-time/utils/formatTime.ts

/**
 * 根据对话开始时间 startTime，计算并格式化当前时间戳与 startTime 的相对时间
 * 格式：MM:SS.hh
 */
export function formatTime(timestamp: string, startTime: string): string {
    const t0 = new Date(startTime).valueOf();
    const t1 = new Date(timestamp).valueOf();
    const delta = t1 - t0;
    const hs = Math.floor(delta / 10) % 100;
    const s = Math.floor(delta / 1000) % 60;
    const m = Math.floor(delta / 60000) % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(m)}:${pad(s)}.${pad(hs)}`;
}