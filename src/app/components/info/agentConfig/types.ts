/**
 * Agent 场景元数据（只描述结构，不含用户选择）
 */
export interface AgentScene {
    sceneKey: string;   // 唯一键
    label: string;      // UI 展示名
    desc: string;       // 场景说明
}

/**
 * Agent 元数据
 */
export interface AgentMeta {
    agentId: string;    // 唯一 ID
    name: string;
    description: string;
    scenes: AgentScene[];
}

/**
 * 用户针对某个场景的模型选择
 */
export interface AgentSceneSelection {
    sceneKey: string;
    supplierId: string | null;
    model: string | null;
}

/**
 * 用户针对单个 Agent 的配置
 */
export interface AgentUserConfig {
    agentId: string;
    scenes: AgentSceneSelection[];
    // 后续可扩展：temperature / maxTokens / 等
}

/**
 * 错误信息
 */
export interface AgentConfigError {
    stage: 'load' | 'save';
    message: string;
    detail?: any;
}