// src/config.ts

export const CASDOOR_CONFIG = {
    endpoint: process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT || "https://your-casdoor-domain",
    clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID || "your_client_id",
    clientSecret: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET || "your_client_secret",
    appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME || "your_app_name",
    orgName: process.env.NEXT_PUBLIC_CASDOOR_ORG_NAME || "your_org_name",
    redirectUri: process.env.NEXT_PUBLIC_CASDOOR_REDIRECT_URI || "https://your-domain.com/api/auth/callback",
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
    PROMPT_EVAL: {
        apiUrl: process.env.STEP_API_URL || "https://api.stepfun.com/v1",
        apiKey: process.env.STEP_API_KEY || "【可以设置固定值】还可以设置STEP_API_KEY/X_API_KEY",
        model: "step-2-mini",
        systemMessage:"角色：JSON结果对比评估专家\n" +
            "\n" +
            "任务说明：你需要对比Ground Truth和测试结果的JSON数据，判断测试结果是否合格。具体步骤如下：\n" +
            "1. 逐字段对比title、summary、keywords、pl：\n" +
            "   - title：检查核心关键词是否一致（如“Python脚本参数”相关表述）\n" +
            "   - summary：判断语义是否等价（功能描述是否相同）\n" +
            "   - keywords：验证关键词集合是否覆盖Ground Truth的80%以上（允许同义词或简称）\n" +
            "   - pl：必须完全一致\n" +
            "2. 对每个字段的差异进行容错判断（如术语缩写、表述顺序不影响核心含义）\n" +
            "3. 综合所有字段的对比结果，若主要信息无缺失且核心含义一致，则判定为合格，否则不合格\n" +
            "4. 编写结构化的reason说明，需明确差异点及判定依据\n" +
            "\n" +
            "输出格式：\n" +
            "{\n" +
            "  \"result\": \"合格\" 或 \"不合格\",\n" +
            "  \"reason\": \"对比字段差异但核心含义一致/存在关键信息缺失或含义不符\"\n" +
            "}\n" +
            "\n" +
            "请严格按照上述Schema输出，确保JSON可解析且字段完整" +
            "注意:reason的字数经历控制在20字以内。"
    },
    TITLE_GEN: {
        apiUrl: process.env.STEP_API_URL || "https://api.stepfun.com/v1",
        apiKey: process.env.STEP_API_KEY || "【可以设置固定值】还可以设置STEP_API_KEY/X_API_KEY",
        model: "step-2-16k",
        systemMessage:"你的任务是将下面具体的文本，提炼成5-8个字的标题。如果问题内容意图不清，没法提炼标题，则直接输出：意图未知"
    },
    SUMMARY_GEN: {
        apiUrl: process.env.STEP_API_URL || "https://api.stepfun.com/v1",
        apiKey: process.env.STEP_API_KEY || "【可以设置固定值】还可以设置STEP_API_KEY/X_API_KEY",
        model: "step-2-16k",
        systemMessage:"角色：信息提取专家" +
            "任务说明：你的任务是从输入【主体内容】中提取关键信息并进行结构化摘要。首先，识别内容中的核心模块（如总结、语法点、例句等），然后提炼每个模块的要点。" +
            "确保逻辑清晰，使用分点或分类方式呈现，涵盖原文核心数据，去除冗余细节。根据内容长度动态调整篇幅：若原文简短，压缩至1/3；若较长，严格控制在100字符内。" +
            "最后，将摘要整理成简洁易读的纯文本格式，不使用任何额外格式如Markdown或JSON。" +
            "输出示例：" +
            "实例1:当内容原内容本身就很短低于100字符时，输出内容可以参考下面的例子" +
            "摘要：动词时态包括现在时、过去时和将来时，用于表示动作发生的时间。" +
            "实例2:当内容原内容本身就很长，远多于100字符时，输出内容可以参考下面的例子" +
            "摘要：动词时态主要分为现在时（如I eat，表示当前动作）、过去时（如I ate，表示已完成动作）和将来时（如I will eat，表示将要发生的动作）。" +
            "通过具体例句展示不同时态的用法，帮助理解动作发生的时间差异。" +
            "输出格式：纯文本。以精炼的段落或分点形式输出，确保信息完整且简洁，字数不超过100字符。" +
            "千万注意：即使主体内容里面原本就包含了一些格式，例如markdown也要都去除掉，只保留纯文本。"
    },
    MERGE_GEN: {
        apiUrl: process.env.STEP_API_URL || "https://api.stepfun.com/v1",
        apiKey: process.env.STEP_API_KEY || "【可以设置固定值】还可以设置STEP_API_KEY/X_API_KEY",
        model: "step-2-16k",
        systemMessage:"角色：你是一个文档编辑\n" +
            "请按照以下步骤整合提供的内容：\n" +
            "1. **识别重复信息**：仔细检查所有内容，仅去除明确重复的部分，确保不丢失任何重要信息。\n" +
            "2. **保持原有格式**：在整合过程中，严格遵循原始内容的格式和结构。\n" +
            "3. **合并相关内容**：将两块相关的内容进行合并，确保逻辑清晰、信息完整。\n" +
            "4. **输出整合结果**：按照原始内容的格式输出整合后的信息，确保所有内容都被恰当地融入。"
    },
    VECTOR_EMBEDDING: {
        // 针对向量配置
        apiUrl: process.env.OPENAI_API_EMBEDDING_URL || "https://api.openai.com/v1/embeddings",
        apiKey: process.env.OPENAI_API_KEY || "your_vector_api_key",
        model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    },

};
export default configurations;