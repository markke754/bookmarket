import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query as db } from './config/db.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET;

// 身份验证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '未提供访问令牌' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: '访问令牌无效' });
        }
        req.user = user;
        next();
    });
};

// 用户注册
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, role, email } = req.body;
        
        // 输出请求数据（不包含密码）
        console.log('注册请求数据:', { username, role, email });
        
        // 验证必填字段
        if (!username || !password || !role || !email) {
            console.log('注册失败：缺少必填字段');
            return res.status(400).json({ message: '所有字段都是必填的' });
        }
        
        // 验证角色值
        if (!['admin', 'buyer', 'seller'].includes(role)) {
            console.log('注册失败：无效的角色值');
            return res.status(400).json({ message: '无效的角色值' });
        }

        // 检查数据库连接
        try {
            await db('SELECT 1');
            console.log('数据库连接正常');
        } catch (dbError) {
            console.error('数据库连接错误:', dbError);
            return res.status(500).json({ message: '数据库连接错误', error: dbError.message });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('尝试插入用户数据...');
        const result = await db(
            'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, hashedPassword, role, email]
        );

        console.log('注册成功，用户ID:', result.rows[0].id);
        res.status(201).json({ message: '注册成功', userId: result.rows[0].id });
    } catch (error) {
        console.error('注册失败，详细错误:', error);
        // 检查是否是唯一约束违反错误
        if (error.code === '23505') {
            return res.status(400).json({ message: '用户名已存在' });
        }
        res.status(500).json({ message: '注册失败', error: error.message });
    }
});

// 用户登录
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await db('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: '登录失败', error: error.message });
    }
});

// 获取图书列表
app.get('/api/books', async (req, res) => {
    try {
        const result = await db('SELECT * FROM books');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: '获取图书列表失败', error: error.message });
    }
});

// 添加图书（卖家）
app.post('/api/books', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: '只有卖家可以添加图书' });
        }

        const { title, author, price, stock, description } = req.body;
        const result = await db(
            'INSERT INTO books (title, author, price, stock, seller_id, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, author, price, stock, req.user.id, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: '添加图书失败', error: error.message });
    }
});

// 添加到购物车
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { book_id, quantity } = req.body;
        const result = await db(
            'INSERT INTO cart_items (user_id, book_id, quantity) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, book_id, quantity]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: '添加到购物车失败', error: error.message });
    }
});

// 创建订单
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { book_id, quantity } = req.body;

        // 获取图书信息
        const bookResult = await db('SELECT * FROM books WHERE id = $1', [book_id]);
        if (bookResult.rows.length === 0) {
            return res.status(404).json({ message: '图书不存在' });
        }

        const book = bookResult.rows[0];
        const total_price = book.price * quantity;

        // 创建订单
        const result = await db(
            'INSERT INTO orders (buyer_id, book_id, quantity, total_price) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, book_id, quantity, total_price]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: '创建订单失败', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});