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
    PROMPT_MATE_GEN: {
        apiUrl: process.env.STEP_API_URL || "https://api.stepfun.com/v1",
        apiKey: process.env.STEP_API_KEY || "【可以设置固定值】还可以设置STEP_API_KEY/X_API_KEY",
        model: "step-r1-v-mini",
        systemMessage:"你是一名「Prompt架构师」，专门为大语言模型撰写SystemPrompt。\n" +
            "请基于下列参数，产出最终的SystemPrompt（仅输出Prompt本身，不要解释）。\n" +
            "参数 \n" +
            "1）输入形式: {{INPUT_TYPE}} （有纯文本，图文混合，视频+文本，音频+文本。总共四种形式。） \n" +
            "2）目标意图: {{INTENT_CODE}} （描述了希望生成的prompt具体的推理意图是什么。）  \n" +
            "3）输出格式: {{OUTPUT_FMT}}    \n" +
            "4）JSON Schema: {{SCHEMA_JSON}}  \n" +
            "生成要求 \n" +
            "- **第一段**：「角色：…」：一句话设定模型身份，例如 “你是一位 XXX（根据目标意图以及用户输入的相关信息来设定一个专家角色）专家”。  \n" +
            "- **第二段**：「任务说明：…」清晰描述 达成目标意图的任务，需要执行任务步骤，越详细越好。  \n" +
            "- **第三段**：「输出格式：…」  \n" +
            "    - 说明必须输出格式 （有纯文本，Markdown，JSON。总共三种。纯文本表示对输出的内容格式没有特殊要求。Markdown表示希望输出的内容严格遵守markdown格式，JSON则表示输出要按照JSON的格式要求，需要确保JSON格式完整可以解析。）\n" +
            "    - 若是JSON，则再判断有没有完整的Schema：（如果通过参数JSON Schema对输出的字段进行了控制，则需要限定输出的格式和字段，请勿随意更改格式和增减字段。如果没有设置则则按照你的理解总结一个Schema）  \n" +
            "- 用条目或短句，避免冗余；输出的prompt已markdown的形式输出。"
    },
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