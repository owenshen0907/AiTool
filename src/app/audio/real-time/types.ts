// File: src/app/audio/real-time/types.ts

export interface AudioPlayer {
    wavesurfer: any;
    isPlaying: boolean;
    isLoading: boolean;
    hasError: boolean;
}

export interface ItemType {
    id: string;
    role: 'user' | 'assistant';
    formatted: {
        transcript?: string;
        audio?: any;       // 原始 PCM/二进制
        file?: { url: string }; // 解码后得到的可播放文件对象
    };
    status?: string;
    // …如果还有其他字段，也可以在这里补充
}