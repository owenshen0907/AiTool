// src/config.ts

export const CASDOOR_CONFIG = {
    endpoint: process.env.CASDOOR_ENDPOINT || "https://your-casdoor-domain",
    clientId: process.env.CASDOOR_CLIENT_ID || "your_client_id",
    clientSecret: process.env.CASDOOR_CLIENT_SECRET || "your_client_secret",
    appName: process.env.CASDOOR_APP_NAME || "your_app_name",
    orgName: process.env.CASDOOR_ORG_NAME || "your_org_name",
    redirectUri: process.env.CASDOOR_REDIRECT_URI || "https://your-domain.com/api/auth/callback",
};


export const configurations: Record<string, { apiUrl: string, apiKey: string, model: string, systemMessage?: string }> = {
    PROMPT_OPT: {
        apiUrl: process.env.STEP_API_URL || "https://api.stepfun.com/v1",
        apiKey: process.env.STEP_API_KEY || "【可以设置固定值】还可以设置STEP_API_KEY/X_API_KEY",
        model: "step-2-16k",
        systemMessage:"你是一个高级Prompt工程师，擅长根据多种输入要素优化生成任务指令。现在我将向你提供以下信息中的部分或全部信息：\n" +
            "\t•\t【原始 Prompt 开始】这中间是待优化的原始prompt【原始 Prompt 结束】\n" +
            "\t•\t【好例开始】这中间是goodcase【好例结束】\n" +
            "\t•\t【坏例开始】这中间是badcase【坏例结束】\n" +
            "\t•\t【优化要求开始】这中间是用户提的优化要求【优化要求结束】\n" +
            "\n" +
            "请遵循以下规则进行优化：\n" +
            "\n" +
            "优化流程：\n" +
            "\t1.\t优先使用原始Prompt为基础进行修改。如原始Prompt不存在，则根据goodcase和优化要求构造一个合理的新Prompt。\n" +
            "\t2.\t参考goodcase提炼有效表达方式，提取目标风格、结构、输出格式。\n" +
            "\t3.\t分析badcase暴露的问题（如理解偏差、格式错误、缺少关键信息等），并避免这些问题再次出现。\n" +
            "\t4.\t结合优化要求，在语言、逻辑、内容范围、输出精度或格式上进行针对性增强。\n" +
            "\t5.\t若某些输入为空或缺失，请智能推断合理的优化方向，确保输出的Prompt在语义和功能上具备独立可用性。\n" +
            "\t6.\t最终只输出优化后的Prompt文本本体，不得添加任何说明性内容、标注、注释或结构提示。"
    },
    VECTOR_EMBEDDING: {
        // 针对向量配置
        apiUrl: process.env.OPENAI_API_EMBEDDING_URL || "https://api.openai.com/v1/embeddings",
        apiKey: process.env.OPENAI_API_KEY || "your_vector_api_key",
        model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    },

};
export default configurations;