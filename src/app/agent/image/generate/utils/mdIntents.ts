/** 正则 */
const INTENTS_RE =
    /<!--\s*INTENTS START\s*-->([\s\S]*?)<!--\s*INTENTS END\s*-->/;

export function extractIntentsBlock(md: string) {
    const m = md.match(INTENTS_RE);
    return m ? m[0] : null;         // 整块返回
}

export function upsertIntentsBlock(md: string, block: string) {
    return INTENTS_RE.test(md) ? md.replace(INTENTS_RE, block) : md + block;
}
