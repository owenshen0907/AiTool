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
        systemMessage:"请结合【原始prompt】，【goodcase】，【badcase】，以及【优化要求】对原始prompt进行优化，使其可以解决badcase的问题。"
    },
    VECTOR_EMBEDDING: {
        // 针对向量配置
        apiUrl: process.env.OPENAI_API_EMBEDDING_URL || "https://api.openai.com/v1/embeddings",
        apiKey: process.env.OPENAI_API_KEY || "your_vector_api_key",
        model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    },

};
export default configurations;