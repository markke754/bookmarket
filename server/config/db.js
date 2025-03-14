import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 指定.env文件的路径（上一级目录）
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pkg;

// 确保密码是字符串类型
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: String(process.env.DB_PASSWORD), // 确保密码是字符串
    port: process.env.DB_PORT,
});

export const query = (text, params) => pool.query(text, params);