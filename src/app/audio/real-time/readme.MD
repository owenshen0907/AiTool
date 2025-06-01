# 实时对话页面 (Real-Time Page) 文件说明

本目录用来存放“实时对话体验”相关的前端文件。下次需要调整页面时，可参考本说明快速定位各文件的职责和用法。

```
src/app/audio/real-time/
├── components/
│   ├── Header.tsx
│   ├── ConversationArea.tsx
│   ├── DebugLog.tsx
│   └── Modals.tsx
├── hooks/
│   ├── useCustomVoices.ts
│   └── useRealtimeClient.ts
├── utils/
│   └── formatTime.ts
└── page.tsx
```

---

## 1. `page.tsx`

- **位置**：`src/app/audio/real-time/page.tsx`
- **功能**：
    - 整个实时对话页面的入口。负责：
        1. 所有全局状态的声明与管理（包括 WebSocket 地址、API Key、对话列表、事件日志、连接状态、录音/播放状态、自定义音色、会话参数等）。
        2. 加载/保存 LocalStorage 中的 “服务器地址”、“模型名称”、“API Key” 三项配置。
        3. 调用自定义 Hook (`useCustomVoices`、`useRealtimeClient`) 来完成主业务逻辑：拉取自定义音色、创建并管理 WebSocket 连接、启动停止录音与播放、同步服务器会话等。
        4. 将状态和操作函数通过 Props 传递给各子组件（Header、ConversationArea、DebugLog、Modals），并将页面整体布局（上下两部分：Header + 左右两列）搭建好。
        5. 负责“自动滚动”逻辑——当事件日志更新或过滤条件变更时，将右侧日志区滚到底部。

- **后续维护注意**：
    - 若需要新增全局状态（例如“切换语言”“切换主题”），可在此添加 `useState()` 并将对应 Props 传给需要的子组件。
    - 如果要调整整体布局（如移动端响应式布局、调整左右两列宽度），仅需修改此文件的 JSX 结构和 Tailwind 类名。
    - 若后端中转服务地址或路径有变化，只需修改传给 `useRealtimeClient` Hook 的 `wsUrl` 或 Hook 内部对 WebSocket URL 的拼接逻辑（见 Hooks 部分）。

---

## 2. `hooks/useCustomVoices.ts`

- **位置**：`src/app/audio/real-time/hooks/useCustomVoices.ts`
- **功能**：
    - 在用户填写的 WebSocket 地址 (`wsUrl`) 与 API Key 有效时，向后端接口 `GET {httpDomain}/v1/audio/voices?limit=100` 拉取自定义音色列表。
    - 将返回的自定义音色与系统预定义音色（`voices`）合并，形成一个完整的 “音色选项数组” (`allVoices`)。
    - 通过 React 的 `useEffect` 监听 `wsUrl` 和 `apiKey` 的变化，做到“自动重新拉取音色列表”。

- **使用方式**：  
  在 `page.tsx` 中直接调用：
  ```ts
  const allVoices = useCustomVoices(wsUrl, apiKey);
  ```
  之后 `allVoices` 数组即可传给下拉组件用于“切换音色”。

- **后续维护注意**：
    - 如果后端接口路径或返回数据结构发生变化，只需修改该文件中 `fetchCustomVoices()` 的 URL 或解析逻辑。
    - 如需对拉取失败做更丰富的错误提示，可在 `catch` 块中扩展逻辑。
    - 如果想做离线缓存（如存到 LocalStorage），也可在此 Hook 中补充。

---

## 3. `hooks/useRealtimeClient.ts`

- **位置**：`src/app/audio/real-time/hooks/useRealtimeClient.ts`
- **功能**：
    - 该 Hook 负责所有“实时语音对话”相关的业务逻辑，包括：
        1. 初始化客户端：根据传入的 `wsUrl`、`apiKey`、`modelName` 拼接 WebSocket 中转服务地址，并创建 `RealtimeClient` 实例。
        2. 注册事件监听：
        - `realtime.event`：将收到的服务器/客户端事件追加到父组件的 `realtimeEvents` 数组，并在 `response.done` 时更新 `isAISpeaking` 状态。若出现 `error` 类型事件，则立即断开并设置错误提示。
        - `error`：捕获 SDK 内部错误，同样触发断连与错误提示。
        - `conversation.interrupted`：在 VAD 模式下若检测到用户开始说话，立即中断 AI 正在播放的音频分片，并继续录音。
        - `conversation.updated`：当收到音频分片时，将 PCM 数据传给 `wavStreamPlayer` 播放；当整段 AI 音频合成完成，则将其转成 `wavFile` 并更新对话历史。
        3. 暴露操作函数：
        - `connectConversation()`：打开浏览器麦克风、创建或重用 `RealtimeClient` 并连接到中转服务器，发送首次 “输入文本” 触发 AI 响应，或根据模式进行持续录音。
        - `disconnectConversation()`：断开 WebSocket，停止录音与播放，并将 `isConnected` 置为 `false`。
        - `startRecording()` / `stopRecording()`：手动模式下录音与停止录音，并调用 `createResponse()` 触发 AI 合成。
        - `toggleVAD()`：在“手动”与“实时 (server_vad)”两种录音切换，必要时调用 `updateSession({ turn_detection: null | { type: 'server_vad' } })`。
        - `changeVoice()`, `changeInstructions()`, `changeTemperature()`, `changeInputFormat()`, `changeOutputFormat()`：将当前 UI 中修改的参数同步到服务器会话。

- **使用方式**：  
  在 `page.tsx` 中按下列方式调用，同时将需要的状态及更新方法作为参数传入：

  ```ts
  const {
    connectConversation,
    disconnectConversation,
    startRecording,
    stopRecording,
    toggleVAD,
    changeVoice,
    changeInstructions,
    changeTemperature,
    changeInputFormat,
    changeOutputFormat,
  } = useRealtimeClient({
    wsUrl,
    modelName,
    apiKey,
    selectedVoice,
    setIsAISpeaking,
    setConnectionError,
    setRealtimeEvents,
    setItems,
    setIsConnected,
    wavRecorder,
    wavStreamPlayer,
    conversationalMode,
    startTime,
  });
  ```
  这样，`page.tsx` 可以将这几个函数绑定到按钮或其他 UI 事件上。

- **后续维护注意**：
    - 如果中转服务地址或路径需要改动，只需修改本文件中 `let wsProxyUrl = 'ws://127.0.0.1:8080/ws';` 部分。
    - 若“实时语音 SDK”版本升级，可能会导致事件类型或客户端 API 变化，需要在此文件统一修改。
    - 如需插入更多“会话初始化参数”或“事件拦截逻辑”，都放在 `initClient()` 函数中做相应扩展。
    - 本 Hook 内部强依赖 `wavRecorder` 和 `wavStreamPlayer`，如果更换录音/播放库，需要在此处同时修改调用方式。

---

## 4. `components/Header.tsx`

- **位置**：`src/app/audio/real-time/components/Header.tsx`
- **功能**：
    - 渲染页面最顶部的工具栏，包括：
        1. 标题：固定显示 “Stepfun Realtime 实时对话体验”。
        2. 连接相关按钮：
        - 当未连接时：显示 “服务器设置” 按钮（打开服务器配置弹窗）、“点击连接” 按钮（触发 `connectConversation()`）。
        - 当已连接时：隐藏上述两按钮，改为显示：
            - “切换音色” 下拉框：从父组件传入的 `allVoices` 数组渲染，可通过 `onVoiceChange` 回调将选中音色通知父组件，并同步到服务器。
            - “对话模式” 下拉框：在 “手动” 与 “实时 (VAD)” 之间切换，调用 `onToggleVAD`。
            - “温度” 输入框：只能在未连接状态下修改，调用 `onTemperatureChange`。
            - “修改人设” 按钮：打开 “修改人设” 弹窗（调用 `onOpenInstructions`）。
            - “点击断开连接” 按钮：触发 `onDisconnect`，断开当前会话。
        3. 错误提示：如果 `connectionError` 非空，则以红色文本方式在工具栏右侧展示。

- **Props 需求**：

  ```ts
  interface HeaderProps {
    isConnected: boolean;
    connectionError: string;
    onOpenSettings: () => void;
    onConnect: () => void;
    onDisconnect: () => void;
    conversationalMode: 'manual' | 'realtime';
    availableModels: readonly string[];
    modelName: string;
    onModelChange: (model: string) => void;
    wsUrl: string;
    onWsUrlChange: (url: string) => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
    temperature: number;
    onTemperatureChange: (temp: number) => void;
    allVoices: { name: string; value: string }[];
    selectedVoice: { name: string; value: string };
    onVoiceChange: (voiceValue: string) => void;
    onToggleVAD: () => void;
    onOpenInstructions: () => void;
  }
  ```

- **后续维护注意**：
    - 若需要在工具栏里增加新选项（例如“选择语言”、“导出日志”按钮），请在此组件里新增对应 UI 元素与 Props。
    - 若想改用其他 UI 库（如 Ant Design、Radix UI）替换 DaisyUI 下拉/按钮样式，可在此文件中做相应替换。
    - 如果要对 “已连接状态” 分支做更多内容（例如新增“静音”按钮），同样在此处修改并将事件回调传回父组件。

---

## 5. `components/ConversationArea.tsx`

- **位置**：`src/app/audio/real-time/components/ConversationArea.tsx`
- **功能**：
    - 渲染页面左侧的对话区，包含：
        1. 连接前提示：当 `isConnected === false` 时，显示一个简单的说明文本，指导用户先 “服务器设置” + “点击连接”。
        2. 连接后界面：
        - 顶部 AI 圆圈：根据 `isAISpeaking` / `isRecording` 状态，切换不同的渐变背景和动画效果。
        - 对话历史列表：遍历 `items`（每条 `item` 含有 `item.formatted.transcript` 和可选的 `item.formatted.file.url`）。
            - 若带 `file.url`，渲染一个 WaveSurfer 波形播放器（`initWaveSurfer` 函数负责实例化并绑定事件）。
            - 点击波形区域 `null` 时，调用 `togglePlay(item.id)` 切换播放/暂停；点击下载按钮则调用 `downloadAudio(url, filename)`。
            - 文本气泡本身根据 `item.role` 是 “user” 还是 “assistant” 渲染在左右两侧，并应用不同颜色。
        - 底部录音区：
            - 如果 `conversationalMode === 'manual'`，渲染一个大圆按钮，用 `onMouseDown={startRecording}` / `onMouseUp={stopRecording}` 来控制录音；按住时按钮颜色变更，同步更新 `isRecording` 状态。
            - 如果为“实时模式 (realtime)”，只显示文字 “实时对话中……”，不再显示录音按钮。

- **Props 需求**：

  ```ts
  interface ConversationAreaProps {
    items: any[];                        // 对话历史列表
    audioPlayers: Record<string, AudioPlayer>; // WaveSurfer 播放状态映射
    isConnected: boolean;                // 是否已连接
    isRecording: boolean;                // 本地是否正在录音
    isAISpeaking: boolean;               // AI 是否正在播放音频
    conversationalMode: 'manual' | 'realtime'; // 会话模式
    startRecording: () => void;          // 录音开始回调
    stopRecording: () => void;           // 录音停止回调
    formatTime: (timestamp: string) => string; // 格式化时间函数 (timestamp -> MM:SS.hh)
    eventsContainerRef: React.RefObject<HTMLDivElement>; // 滚动容器引用
    startTime: string;                   // 对话开始时间（用于格式化日志/时间线）
  }
  ```

- **后续维护注意**：
    - 如果需要替换 WaveSurfer 为其他播放可视化库，请在本文件中修改 `initWaveSurfer` 和 `togglePlay`。
    - 若想在对话列表中展示更多信息（如消息时间戳、AI 音量条、语速指示等），可以在此组件里添加对应的 JSX 结构与样式。
    - 调整按钮样式、圆圈动画、气泡配色等，只需修改 Tailwind/DaisyUI 类名。

---

## 6. `components/DebugLog.tsx`

- **位置**：`src/app/audio/real-time/components/DebugLog.tsx`
- **功能**：
    - 渲染页面右侧的“调试日志”区域，用于展示所有从 SDK 收发的实时事件，方便开发和排查。包括：
        1. 顶部标题 “调试日志” 以及两个按钮：
        - “全部折叠”：清空所有 `expandedEvents` 展开状态；
        - “清掉”：同时清空 `expandedEvents`，并重置 `filterText`（可由父组件进一步清空 `realtimeEvents`）。
        2. 当有事件时，渲染一行“来源筛选”下拉框和“关键词过滤”输入框。
        3. 日志列表主体：遍历 `filterEvents(realtimeEvents)` 后的数组：
        - 每条显示 “相对时间（`formatTime(event.time, startTime)`） + 来源（server/client） + 事件类型”
        - 点击该行可展开/折叠，显示完整的 `JSON.stringify(event.event, null, 2)` 详情。

- **Props 需求**：

  ```ts
  interface DebugLogProps {
    realtimeEvents: RealtimeEvent[];            // 所有事件列表
    filterText: string;                         // 关键词过滤文本
    setFilterText: (text: string) => void;      // 更新关键词
    filterSource: 'all' | 'server' | 'client';  // 当前来源筛选值
    setFilterSource: (src: 'all' | 'server' | 'client') => void; // 更新筛选值
    expandedEvents: Record<string, boolean>;     // 哪些事件处于“展开”状态 (key=`time-index`)
    setExpandedEvents: (obj: Record<string, boolean>) => void; // 更新展开状态
    eventsContainerRef: React.RefObject<HTMLDivElement>;       // 用于外层自动滚动
    startTime: string;                          // 对话开始时间，用于格式化输出
  }
  ```

- **后续维护注意**：
    - 如果需要新增 “按事件类型筛选” 或 “按时间范围筛选”，可以在此文件里对 `filterEvents()` 函数进行扩展，并在渲染区域增加相应的下拉/日期控件。
    - 若想改动日志行样式（字体、背景、对齐方式等），可直接修改 Tailwind 类名。
    - 如果要把日志导出到文本文件或 JSON，需要为顶部新增“导出日志”按钮，并在回调中读取 `realtimeEvents` 生成下载链接。

---

## 7. `components/Modals.tsx`

- **位置**：`src/app/audio/real-time/components/Modals.tsx`
- **功能**：
    - 同时渲染两个原生 `<dialog>` 弹窗：
        1. **修改人设弹窗**（`<dialog id="instructionsModal">`）：
        - 包含一个 `<textarea>`，用于用户编辑 “人设文案” (`newInstruction`)。
        - “取消”按钮调用 `onCloseInstructions()`；“确定”按钮先调用 `onChangeInstructions()`（把最新 `newInstruction` 同步到父组件并发到服务器），然后执行 `onCloseInstructions()` 关闭弹窗。
        2. **服务器设置弹窗**（`<dialog id="settingsModal">`）：
        - 包含三个输入项：
            1. “服务器 URL” (`<input value={wsUrl} onChange={onWsUrlChange}>`)，用来填写 WebSocket 中转地址；
            2. “模型” 下拉框(`<select value={modelName} onChange={onModelChange}>`)，可选值来自 `availableModels`；
            3. “API Key” (`<input value={apiKey} onChange={onApiKeyChange}>`)；
        - “确定”按钮调用 `onCloseSettings()` 关闭弹窗。实际的配置修改逻辑在 `page.tsx` 里会监听状态变化并自动保存到 LocalStorage。

- **Props 需求**：

  ```ts
  interface ModalsProps {
    wsUrl: string;
    onWsUrlChange: (url: string) => void;
    modelName: string;
    onModelChange: (model: string) => void;
    apiKey: string;
    onApiKeyChange: (key: string) => void;
    availableModels: readonly string[];
    instructions: string;
    newInstruction: string;
    setNewInstruction: (text: string) => void;
    onChangeInstructions: () => void;
    onCloseInstructions: () => void;
    onCloseSettings: () => void;
  }
  ```

- **后续维护注意**：
    - 如果需要替换为其他 Modal 实现（如 Headless UI/Dialog、Radix UI/Dialog），可删除或注释掉原生 `<dialog>`，并将新的组件插入此处，保持 Props 对接即可。
    - 若想添加更多“服务器设置”字段（例如“超时时间”、“代理地址”），只需在此弹窗里新增对应输入框并绑定 Props 回调即可。
    - 若想对“人设”做更复杂的富文本编辑，可在此弹窗中替换 `<textarea>` 为富文本编辑器（如 Quill、Draft.js），并相应修改 `onChangeInstructions` 数据结构。