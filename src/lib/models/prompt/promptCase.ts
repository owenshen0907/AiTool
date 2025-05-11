// src/lib/models/prompt/promptCase.ts

/**
 * 内容项：Case 内容表对应的数据结构
 */
export interface CaseContentItem {
    id: string;
    directoryId: string;
    title: string;
    summary?: string;
    body?: string;
    position: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * prompt_case_list 表对应模型
 */
export interface PromptCaseList {
    /** 主键 UUID */
    id: string;
    /** 关联的 case_content.id */
    caseContentId: string;
    /** 序号 */
    seq: number;
    /** 文本形式的 Case，可为空 */
    caseText?: string;
    /** Ground Truth 文本 */
    groundTruth: string;
    /** 创建时间 */
    createdAt: string;  // ISO timestamp
    /** 更新时间 */
    updatedAt: string;  // ISO timestamp
}

/**
 * prompt_case_image 表对应模型
 */
export interface PromptCaseImage {
    /** 主键 UUID */
    id: string;
    /** 关联的 prompt_case_list.id */
    caseListId: string;
    /** 图片 URL 或文件路径 */
    imageUrl: string;
    /** 排序位置 */
    position: number;
    /** 创建时间 */
    createdAt: string;  // ISO timestamp
}

/**
 * prompt_test_detail 表对应模型
 */
export interface PromptTestDetail {
    /** 主键 UUID */
    id: string;
    /** 关联的 prompt_case_list.id */
    caseListId: string;
    /** 测试所用模型名 */
    modelName: string;
    /** 测试输出结果 */
    testResult: string;
    /** 是否通过 */
    passed: boolean;
    /** 若不通过的原因说明，可为空 */
    reason?: string;
    /** 测试时间 */
    testTime: string;   // ISO timestamp
    /** 调用链追踪 ID */
    traceId: string;
}