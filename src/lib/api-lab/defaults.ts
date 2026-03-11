import type { ApiLabBodyFormat, ApiLabContentType, ApiLabMethod, ApiLabResponseType, JsonObject } from '@/lib/models/apiLab';

export interface ApiLabSeedEnv {
    serviceKey: string;
    serviceName: string;
    name: string;
    baseUrl: string;
    websocketUrl?: string | null;
    apiKey: string;
    extraHeaders: JsonObject;
    timeoutMs: number;
    isDefault: boolean;
}

export interface ApiLabSeedEndpoint {
    slug: string;
    serviceKey: string;
    serviceName: string;
    category: string;
    name: string;
    description: string;
    method: ApiLabMethod;
    path: string;
    authType: 'bearer' | 'x-api-key' | 'none' | 'custom';
    authHeaderName: string;
    contentType: ApiLabContentType;
    responseType: ApiLabResponseType;
    requestTemplate: JsonObject;
    queryTemplate: JsonObject;
    headerTemplate: JsonObject;
    fileFieldName?: string;
    fileAccept?: string;
    docUrl: string;
    notes: string;
    sortOrder: number;
}

export interface ApiLabSeedExample {
    endpointSlug: string;
    name: string;
    requestBody: JsonObject;
    requestQuery: JsonObject;
    requestHeaders: JsonObject;
    responseStatus: number;
    responseHeaders: JsonObject;
    responseBody: string;
    responseBodyFormat: ApiLabBodyFormat;
    isRecommended: boolean;
}

export const apiLabSeedEnvs: ApiLabSeedEnv[] = [
    {
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        name: 'production',
        baseUrl: 'https://api.stepfun.com/v1',
        websocketUrl: 'wss://api.stepfun.com/v1',
        apiKey: '',
        extraHeaders: {},
        timeoutMs: 30000,
        isDefault: true,
    },
];

export const apiLabSeedEndpoints: ApiLabSeedEndpoint[] = [
    {
        slug: 'stepfun-chat-completions',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'chat',
        name: 'Chat Completion',
        description: 'OpenAI compatible chat completion endpoint.',
        method: 'POST',
        path: '/chat/completions',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'json',
        requestTemplate: {
            model: 'step-1-8k',
            stream: false,
            temperature: 0.7,
            messages: [
                { role: 'system', content: '你是一个专业的 AI 助手。' },
                { role: 'user', content: '你好，请用 3 句话介绍你的能力。' },
            ],
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/chat/chat-completion-create',
        notes: '适合调试 OpenAI 兼容的对话接口，默认给出非流式请求模板。',
        sortOrder: 10,
    },
    {
        slug: 'stepfun-image-generation',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'images',
        name: 'Image Generation',
        description: '根据 prompt 直接生成图像。',
        method: 'POST',
        path: '/images/generations',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'json',
        requestTemplate: {
            model: 'step-1x-medium',
            prompt: '一只坐在咖啡馆窗边的橘猫，电影感打光。',
            size: '1024x1024',
            n: 1,
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/images/image',
        notes: 'HTTP JSON 接口，适合快速沉淀文生图模板。',
        sortOrder: 20,
    },
    {
        slug: 'stepfun-image-to-image',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'images',
        name: 'Image to Image',
        description: '基于参考图 URL 做图生图。',
        method: 'POST',
        path: '/images/image2image',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'json',
        requestTemplate: {
            model: 'step-1x-medium',
            prompt: '保持构图，改成赛博朋克夜景风格。',
            source_url: 'https://example.com/demo.png',
            source_weight: 0.7,
            size: '1024x1024',
            steps: 28,
            cfg_scale: 7.5,
            n: 1,
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/images/image2image',
        notes: '适合录入图生图提示词和参考图 URL。',
        sortOrder: 30,
    },
    {
        slug: 'stepfun-image-edits',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'images',
        name: 'Image Edits',
        description: '上传图片并按 prompt 做局部/整体编辑。',
        method: 'POST',
        path: '/images/edits',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'multipart/form-data',
        responseType: 'json',
        requestTemplate: {
            model: 'step-1x-edit',
            prompt: '给人物加上一副复古金边眼镜。',
            size: '1024x1024',
        },
        queryTemplate: {},
        headerTemplate: {},
        fileFieldName: 'image',
        fileAccept: 'image/*,.png,.jpg,.jpeg,.webp',
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/images/edits',
        notes: '当前调试台会按 multipart 方式上传本地图片。',
        sortOrder: 40,
    },
    {
        slug: 'stepfun-audio-speech',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'audio',
        name: 'TTS Speech',
        description: '文本转语音，返回音频二进制。',
        method: 'POST',
        path: '/audio/speech',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'audio',
        requestTemplate: {
            model: 'step-tts-mini',
            input: '智能阶跃，十倍每个人的可能。',
            voice: 'cixingnansheng',
            response_format: 'mp3',
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/create_audio',
        notes: '返回音频二进制，适合测试音色、格式和基础参数。',
        sortOrder: 50,
    },
    {
        slug: 'stepfun-audio-speech-sse',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'audio',
        name: 'TTS Speech SSE',
        description: '文本转语音的 SSE 流式版本。',
        method: 'POST',
        path: '/audio/speech',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'sse',
        requestTemplate: {
            model: 'step-tts-mini',
            input: '请用更轻快的语气朗读这句话。',
            voice: 'cixingnansheng',
            response_format: 'mp3',
            stream_format: 'sse',
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/create_audio',
        notes: '同一路径，不同请求参数下返回 SSE 数据流。',
        sortOrder: 60,
    },
    {
        slug: 'stepfun-create-voice',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'audio',
        name: 'Create Voice',
        description: '使用 file_id 复刻自定义音色。',
        method: 'POST',
        path: '/audio/voices',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'json',
        requestTemplate: {
            model: 'step-tts-mini',
            file_id: 'file-demo-123',
            sample_text: '欢迎来到 AiTool 的音色测试区。',
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/create_voice',
        notes: '文档中明确要求传 file_id，可配合文件上传接口串联使用。',
        sortOrder: 70,
    },
    {
        slug: 'stepfun-list-voices',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'audio',
        name: 'List Voices',
        description: '获取官方和自定义音色列表。',
        method: 'GET',
        path: '/audio/voices',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'none',
        responseType: 'json',
        requestTemplate: {},
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/list_voice',
        notes: '适合作为音色管理的拉取接口模板。',
        sortOrder: 80,
    },
    {
        slug: 'stepfun-audio-transcriptions',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'audio',
        name: 'ASR Transcription',
        description: '上传本地音频做转写。',
        method: 'POST',
        path: '/audio/transcriptions',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'multipart/form-data',
        responseType: 'json',
        requestTemplate: {
            model: 'step-asr',
            response_format: 'json',
        },
        queryTemplate: {},
        headerTemplate: {},
        fileFieldName: 'file',
        fileAccept: 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.webm,.mp4,.opus',
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/transcriptions',
        notes: '需要上传本地音频文件，适合做 ASR smoke test。',
        sortOrder: 90,
    },
    {
        slug: 'stepfun-audio-realtime-ws',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'realtime',
        name: 'Realtime Audio WS',
        description: '通过 WebSocket 进行实时 TTS/语音交互。',
        method: 'WS',
        path: '/realtime/audio',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'text',
        requestTemplate: {
            type: 'start',
            voice: 'cixingnansheng',
            text: '你好，欢迎来到 AiTool。',
            response_format: 'mp3',
            sample_rate: 24000,
        },
        queryTemplate: {
            model: 'step-tts-mini',
        },
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/ws_audio',
        notes: '当前调试台提供 wscat 连接命令和示例消息，不在页面内直连 WebSocket。',
        sortOrder: 100,
    },
    {
        slug: 'stepfun-audio-asr-file-submit',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'audio',
        name: 'ASR File Submit',
        description: '提交远程音频 URL 做异步转写。',
        method: 'POST',
        path: '/audio/asr/file/submit',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'json',
        requestTemplate: {
            url: 'https://example.com/demo.wav',
            config: {
                format: 'wav',
            },
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/asr',
        notes: '异步 ASR 提交入口，返回 task_id 后可调用查询接口。',
        sortOrder: 110,
    },
    {
        slug: 'stepfun-audio-asr-file-query',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'audio',
        name: 'ASR File Query',
        description: '根据 task_id 查询异步转写结果。',
        method: 'POST',
        path: '/audio/asr/file/query',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'json',
        requestTemplate: {
            task_id: 'task-demo-123',
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/asr',
        notes: 'Stepfun 文档页同时给出了 submit 与 query 两个异步 ASR 接口。',
        sortOrder: 120,
    },
    {
        slug: 'stepfun-audio-asr-sse',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'realtime',
        name: 'ASR SSE',
        description: '通过 HTTP SSE 流式返回识别结果。',
        method: 'POST',
        path: '/audio/asr/sse',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'sse',
        requestTemplate: {
            audio_format: {
                type: 'pcm',
                sample_rate: 16000,
                channel: 1,
            },
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/asr-stream',
        notes: '页面内可记录请求模板，但更适合配合真实流式音频输入使用。',
        sortOrder: 130,
    },
    {
        slug: 'stepfun-audio-asr-stream-ws',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'realtime',
        name: 'ASR Stream WS',
        description: '通过 WebSocket 持续发送音频帧并实时返回识别结果。',
        method: 'WS',
        path: '/realtime/asr/stream',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'text',
        requestTemplate: {
            event: 'start',
            audio_format: {
                type: 'pcm',
                sample_rate: 16000,
                channel: 1,
            },
            vad: true,
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/audio/asr-stream',
        notes: '当前调试台会生成 wscat 命令，适合先沉淀 URL、鉴权和起始消息。',
        sortOrder: 140,
    },
    {
        slug: 'stepfun-search',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'search',
        name: 'Search',
        description: '搜索接口，可用于补充联网检索类能力。',
        method: 'POST',
        path: '/search',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'application/json',
        responseType: 'json',
        requestTemplate: {
            query: '今天值得关注的 AI 行业动态',
            top_k: 5,
        },
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/Search/search',
        notes: '适合沉淀常用检索查询模板。',
        sortOrder: 150,
    },
    {
        slug: 'stepfun-account-get',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'account',
        name: 'Get Account',
        description: '查询当前账号信息或余额。',
        method: 'GET',
        path: '/accounts',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'none',
        responseType: 'json',
        requestTemplate: {},
        queryTemplate: {},
        headerTemplate: {},
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/accounts/get',
        notes: '适合作为环境连通性和权限验证接口。',
        sortOrder: 160,
    },
    {
        slug: 'stepfun-files-upload',
        serviceKey: 'stepfun',
        serviceName: 'Stepfun',
        category: 'files',
        name: 'Files Upload',
        description: '上传文件并获取 file_id，供后续音色复刻或其他链路使用。',
        method: 'POST',
        path: '/files',
        authType: 'bearer',
        authHeaderName: 'Authorization',
        contentType: 'multipart/form-data',
        responseType: 'json',
        requestTemplate: {
            purpose: 'storage',
        },
        queryTemplate: {},
        headerTemplate: {},
        fileFieldName: 'file',
        fileAccept: '.txt,.json,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.mp3,.wav',
        docUrl: 'https://platform.stepfun.com/docs/zh/api-reference/files/create',
        notes: '适合上传文件后获取 file_id，再串到音色复刻等业务接口中。',
        sortOrder: 170,
    },
];

export const apiLabSeedExamples: ApiLabSeedExample[] = [
    {
        endpointSlug: 'stepfun-chat-completions',
        name: '基础问答',
        requestBody: {
            model: 'step-1-8k',
            stream: false,
            messages: [
                { role: 'system', content: '你是一个专业的 AI 助手。' },
                { role: 'user', content: '请简短介绍 StepFun Chat 接口。' },
            ],
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                id: 'chatcmpl-demo',
                object: 'chat.completion',
                model: 'step-1-8k',
                choices: [
                    {
                        index: 0,
                        finish_reason: 'stop',
                        message: {
                            role: 'assistant',
                            content: 'StepFun Chat 接口兼容 OpenAI 风格，可直接用于对话生成。',
                        },
                    },
                ],
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-image-generation',
        name: '文生图返回样例',
        requestBody: {
            model: 'step-1x-medium',
            prompt: '一只坐在咖啡馆窗边的橘猫，电影感打光。',
            size: '1024x1024',
            n: 1,
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                created: 1741680000,
                data: [
                    {
                        url: 'https://cdn.example.com/generated/cat.png',
                    },
                ],
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-image-to-image',
        name: '图生图返回样例',
        requestBody: {
            model: 'step-1x-medium',
            prompt: '保持构图，改成赛博朋克夜景风格。',
            source_url: 'https://example.com/demo.png',
            source_weight: 0.7,
            size: '1024x1024',
            steps: 28,
            cfg_scale: 7.5,
            n: 1,
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                created: 1741680000,
                data: [
                    {
                        url: 'https://cdn.example.com/generated/cyberpunk-cat.png',
                    },
                ],
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-image-edits',
        name: '图像编辑返回样例',
        requestBody: {
            model: 'step-1x-edit',
            prompt: '给人物加上一副复古金边眼镜。',
            size: '1024x1024',
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                created: 1741680000,
                data: [
                    {
                        url: 'https://cdn.example.com/edited/portrait.png',
                    },
                ],
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-audio-speech',
        name: '默认语音样例',
        requestBody: {
            model: 'step-tts-mini',
            input: '欢迎来到 AiTool 的 API 调试台。',
            voice: 'cixingnansheng',
            response_format: 'mp3',
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'audio/mpeg' },
        responseBody: '<binary audio preview>',
        responseBodyFormat: 'text',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-audio-speech-sse',
        name: 'TTS SSE 流式样例',
        requestBody: {
            model: 'step-tts-mini',
            input: '请用更轻快的语气朗读这句话。',
            voice: 'cixingnansheng',
            response_format: 'mp3',
            stream_format: 'sse',
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'text/event-stream' },
        responseBody: `event: audio
data: {"audio":"<base64-chunk-1>","status":"streaming"}

event: audio
data: {"audio":"<base64-chunk-2>","status":"streaming"}

event: done
data: {"status":"completed"}`,
        responseBodyFormat: 'sse',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-create-voice',
        name: '音色复刻返回样例',
        requestBody: {
            model: 'step-tts-mini',
            file_id: 'file-demo-123',
            sample_text: '欢迎来到 AiTool 的音色测试区。',
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                voice_id: 'voice-demo-123',
                status: 'processing',
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-list-voices',
        name: '音色列表返回样例',
        requestBody: {},
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                data: [
                    { voice_id: 'cixingnansheng', name: '磁性男声' },
                    { voice_id: 'voice-demo-123', name: '我的克隆音色' },
                ],
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-audio-transcriptions',
        name: 'ASR 返回样例',
        requestBody: {
            model: 'step-asr',
            response_format: 'json',
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                text: '这是一个 ASR 返回示例。',
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-audio-realtime-ws',
        name: '实时语音 WS 消息样例',
        requestBody: {
            type: 'start',
            voice: 'cixingnansheng',
            text: '你好，欢迎来到 AiTool。',
            response_format: 'mp3',
            sample_rate: 24000,
        },
        requestQuery: {
            model: 'step-tts-mini',
        },
        requestHeaders: {},
        responseStatus: 101,
        responseHeaders: {},
        responseBody: `{"event":"tts.created","data":{"status":"accepted"}}
{"event":"tts.audio","data":{"audio":"<base64-chunk>","seq":1}}
{"event":"tts.completed","data":{"status":"completed"}}`,
        responseBodyFormat: 'text',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-audio-asr-file-submit',
        name: '异步 ASR 提交样例',
        requestBody: {
            url: 'https://example.com/demo.wav',
            config: {
                format: 'wav',
            },
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                task_id: 'task-demo-123',
                status: 'submitted',
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-audio-asr-file-query',
        name: '异步 ASR 查询样例',
        requestBody: {
            task_id: 'task-demo-123',
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                task_id: 'task-demo-123',
                status: 'finished',
                result: {
                    text: '这是一次异步 ASR 查询的示例结果。',
                },
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-audio-asr-sse',
        name: 'ASR SSE 结果样例',
        requestBody: {
            audio_format: {
                type: 'pcm',
                sample_rate: 16000,
                channel: 1,
            },
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'text/event-stream' },
        responseBody: `event: transcript
data: {"text":"你好","is_final":false}

event: transcript
data: {"text":"你好，欢迎来到 AiTool。","is_final":true}`,
        responseBodyFormat: 'sse',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-audio-asr-stream-ws',
        name: 'ASR WS 消息样例',
        requestBody: {
            event: 'start',
            audio_format: {
                type: 'pcm',
                sample_rate: 16000,
                channel: 1,
            },
            vad: true,
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 101,
        responseHeaders: {},
        responseBody: `{"event":"transcript.partial","data":{"text":"你好"}}
{"event":"transcript.final","data":{"text":"你好，欢迎来到 AiTool。"}}`,
        responseBodyFormat: 'text',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-search',
        name: '搜索返回样例',
        requestBody: {
            query: '今天值得关注的 AI 行业动态',
            top_k: 5,
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                data: [
                    {
                        title: 'AI 行业日报',
                        url: 'https://example.com/news/1',
                        snippet: '这里是搜索结果摘要。',
                    },
                ],
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-account-get',
        name: '账号信息样例',
        requestBody: {},
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                id: 'acct-demo',
                email: 'demo@example.com',
                balance: 120.5,
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
    {
        endpointSlug: 'stepfun-files-upload',
        name: '文件上传返回样例',
        requestBody: {
            purpose: 'storage',
        },
        requestQuery: {},
        requestHeaders: {},
        responseStatus: 200,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify(
            {
                id: 'file-demo-123',
                object: 'file',
                bytes: 1024,
                filename: 'demo.txt',
                purpose: 'storage',
            },
            null,
            2,
        ),
        responseBodyFormat: 'json',
        isRecommended: true,
    },
];
