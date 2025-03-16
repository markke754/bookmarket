import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { query as db } from './config/db.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置文件上传
const uploadsDir = path.join(__dirname, 'uploads');

// 确保上传目录存在
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Multer存储目标目录:', uploadsDir);
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        console.log('处理上传文件:', file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = 'book-' + uniqueSuffix + ext;
        console.log('生成的文件名:', filename);
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 限制5MB
    },
    fileFilter: function (req, file, cb) {
        console.log('文件过滤:', file.originalname, file.mimetype);
        // 只接受图片文件
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            console.log('文件类型不被接受:', file.originalname);
            return cb(new Error('只允许上传图片文件！'), false);
        }
        console.log('文件类型被接受');
        cb(null, true);
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer错误处理
        console.error('Multer错误:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: '文件大小超过限制(5MB)' });
        }
        return res.status(400).json({ message: '文件上传失败', error: err.message });
    } else if (err) {
        // 其他错误
        console.error('服务器错误:', err);
        return res.status(500).json({ message: '服务器错误', error: err.message });
    }
    next();
});

// 中间件
app.use(cors());
app.use(express.json());

// 提供静态文件访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// 获取图书列表（需要认证）
app.get('/api/books', authenticateToken, async (req, res) => {
    try {
        const result = await db('SELECT * FROM books');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: '获取图书列表失败', error: error.message });
    }
});

// 获取公开图书列表（无需认证）
app.get('/api/books/public', async (req, res) => {
    try {
        const result = await db('SELECT * FROM books');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: '获取图书列表失败', error: error.message });
    }
});

// 添加图书（卖家）
app.post('/api/books', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: '只有卖家可以添加图书' });
        }

        const { title, author, price, stock, description } = req.body;
        let image_url = null;
        
        if (req.file) {
            // 构建图片URL
            image_url = `/uploads/${req.file.filename}`;
        }
        
        const result = await db(
            'INSERT INTO books (title, author, price, stock, seller_id, description, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, author, price, stock, req.user.id, description, image_url]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('添加图书失败:', error);
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

// 更新图书（卖家）
app.put('/api/books/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        console.log('接收到更新图书请求:', req.params.id);
        console.log('请求体:', req.body);
        console.log('请求文件:', req.file);
        
        if (req.user.role !== 'seller') {
            console.log('用户角色不是卖家:', req.user.role);
            return res.status(403).json({ message: '只有卖家可以更新图书' });
        }

        const { id } = req.params;
        const { title, author, price, stock, description } = req.body;

        // 验证必填字段
        if (!title || !author || price === undefined || stock === undefined) {
            console.log('缺少必填字段');
            return res.status(400).json({ message: '请提供所有必填字段' });
        }

        // 验证图书是否属于该卖家
        console.log('验证图书所有权...');
        const bookCheck = await db('SELECT * FROM books WHERE id = $1 AND seller_id = $2', [id, req.user.id]);
        if (bookCheck.rows.length === 0) {
            console.log('图书不存在或不属于此卖家');
            return res.status(404).json({ message: '图书不存在或无权限修改' });
        }
        
        let image_url = bookCheck.rows[0].image_url;
        
        // 如果上传了新图片
        if (req.file) {
            console.log('处理新上传的图片:', req.file.filename);
            // 如果有旧图片，尝试删除
            if (image_url) {
                const oldImagePath = path.join(__dirname, image_url);
                console.log('尝试删除旧图片:', oldImagePath);
                if (fs.existsSync(oldImagePath)) {
                    try {
                        fs.unlinkSync(oldImagePath);
                        console.log('旧图片删除成功');
                    } catch (err) {
                        console.error('删除旧图片失败:', err);
                    }
                } else {
                    console.log('旧图片文件不存在');
                }
            }
            // 设置新图片URL
            image_url = `/uploads/${req.file.filename}`;
            console.log('新图片URL:', image_url);
        } else {
            console.log('没有上传新图片，保留原图片:', image_url);
        }

        console.log('执行数据库更新...');
        const result = await db(
            'UPDATE books SET title = $1, author = $2, price = $3, stock = $4, description = $5, image_url = $6 WHERE id = $7 AND seller_id = $8 RETURNING *',
            [title, author, price, stock, description, image_url, id, req.user.id]
        );

        console.log('更新成功:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('更新图书失败:', error);
        res.status(500).json({ message: '更新图书失败', error: error.message, stack: error.stack });
    }
});

// 删除图书（卖家）
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: '只有卖家可以删除图书' });
        }

        const { id } = req.params;

        // 验证图书是否属于该卖家
        const bookCheck = await db('SELECT * FROM books WHERE id = $1 AND seller_id = $2', [id, req.user.id]);
        if (bookCheck.rows.length === 0) {
            return res.status(404).json({ message: '图书不存在或无权限删除' });
        }
        
        // 如果有图片，删除图片文件
        if (bookCheck.rows[0].image_url) {
            const imagePath = path.join(__dirname, bookCheck.rows[0].image_url);
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath);
                } catch (err) {
                    console.error('删除图片文件失败:', err);
                }
            }
        }

        await db('DELETE FROM books WHERE id = $1 AND seller_id = $2', [id, req.user.id]);
        res.json({ message: '图书删除成功' });
    } catch (error) {
        console.error('删除图书失败:', error);
        res.status(500).json({ message: '删除图书失败', error: error.message });
    }
});

// 获取所有用户（仅管理员）
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '只有管理员可以访问用户列表' });
        }
        const result = await db('SELECT id, username, role, email, created_at FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ message: '获取用户列表失败', error: error.message });
    }
});

// 获取所有订单（仅管理员）
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '只有管理员可以访问订单列表' });
        }
        const result = await db('SELECT * FROM orders');
        res.json(result.rows);
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({ message: '获取订单列表失败', error: error.message });
    }
});

// 管理员创建其他管理员账户
app.post('/api/admin/register', authenticateToken, async (req, res) => {
    try {
        // 验证当前用户是否为管理员
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '只有管理员可以创建管理员账号' });
        }

        const { username, password, email, role } = req.body;
        
        // 验证必填字段
        if (!username || !password || !email || role !== 'admin') {
            return res.status(400).json({ 
                success: false, 
                message: '所有字段都是必填的，且角色必须为admin' 
            });
        }
        
        // 检查用户名是否已存在
        const userCheck = await db('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: '用户名已存在' 
            });
        }
        
        // 哈希密码
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 插入新管理员
        const result = await db(
            'INSERT INTO users (username, password, role, email) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, hashedPassword, 'admin', email]
        );
        
        res.status(201).json({ 
            success: true, 
            message: '管理员账号创建成功', 
            userId: result.rows[0].id 
        });
    } catch (error) {
        console.error('创建管理员账号失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '创建管理员账号失败', 
            error: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});