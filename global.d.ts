declare global {
    var userCache: Map<string, {
        userId: string;
        nickname: string;
        email: string;
        phone: string;
        wechat: string;
    }>;
}

export {};