import { config } from 'dotenv';
config({ path: '.env.local' }); // 加载 .env.local 中的环境变量
import pkg from 'pg';
const { Client } = pkg;

const initDb = async () => {
    if (process.env.DB_INIT !== 'true') {
        console.log("DB_INIT 参数未开启，跳过数据库初始化。");
        return;
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("已连接到 PostgreSQL 数据库。");

        // 创建单词表 (words)
        await client.query(`
      CREATE TABLE IF NOT EXISTS words (
        id VARCHAR(50) PRIMARY KEY,
        kana TEXT NOT NULL,
        kanji TEXT,
        romaji TEXT,
        pos TEXT,
        level INTEGER CHECK (level BETWEEN 1 AND 5),
        translation TEXT,
        extension JSONB DEFAULT '{}'::jsonb
      );
    `);
        console.log("单词表创建成功。");

        // 创建语法表 (grammar)
        await client.query(`
      CREATE TABLE IF NOT EXISTS grammar (
        id VARCHAR(50) PRIMARY KEY,
        grammar_formula TEXT NOT NULL,
        grammar_category_01 TEXT,
        grammar_category_02 TEXT,
        explanation TEXT,
        example_sentence TEXT DEFAULT NULL,
        lesson INT NOT NULL,
        level INTEGER CHECK (level BETWEEN 1 AND 5),
        embedding vector(1536),
        extension JSONB DEFAULT '{}'::jsonb
      );
    `);
        console.log("语法表创建成功。");

        // 创建用户信息表 (user_info)
        await client.query(`
      CREATE TABLE IF NOT EXISTS user_info (
        user_id VARCHAR(50) PRIMARY KEY,
        nickname TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        wechat TEXT,
        account_level INTEGER
      );
    `);
        console.log("用户信息表创建成功。");

        // 创建单词学习日志表 (word_study_log)
        await client.query(`
      CREATE TABLE IF NOT EXISTS word_study_log (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        word_id VARCHAR(50) NOT NULL,
        dimension TEXT CHECK (dimension IN ('听', '说', '写', '阅')),
        study_status INTEGER CHECK (study_status IN (1, -1)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user_info(user_id)
      );
    `);
        console.log("单词学习日志表创建成功。");

        // 创建语法学习日志表 (grammar_study_log)
        await client.query(`
      CREATE TABLE IF NOT EXISTS grammar_study_log (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        grammar_id VARCHAR(50) NOT NULL,
        dimension TEXT CHECK (dimension IN ('听', '说', '写', '阅')),
        study_status INTEGER CHECK (study_status IN (1, -1)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user_info(user_id)
      );
    `);
        console.log("语法学习日志表创建成功。");

        // 创建语法学习笔记表 (notes)
        await client.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- 自动生成 UUID
                title TEXT NOT NULL,                -- 笔记标题，同时作为目录显示的名称
                parent_id UUID,                     -- 自引用，指向父笔记的 id（NULL 表示根目录）
                summary TEXT,                       -- 概述说明
                content TEXT,                       -- 详细内容（Markdown 格式）
                tags TEXT,                          -- 标签，逗号分隔
                comments JSONB DEFAULT '[]'::jsonb,  -- 评论反馈，存储评论数组
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                update_log TEXT,                    -- 更新内容说明
                user_id VARCHAR(50) NOT NULL,       -- 用户ID，必填
                is_public BOOLEAN DEFAULT false,
                FOREIGN KEY (user_id) REFERENCES user_info(user_id),
                FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE SET NULL
                );
`);
        console.log("笔记表创建成功。");

        console.log("数据库表创建或验证成功。");
    } catch (error) {
        console.error("数据库初始化出错：", error);
    } finally {
        await client.end();
        console.log("已断开 PostgreSQL 连接。");
    }
};

initDb();