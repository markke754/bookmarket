import express from 'express';
import jwt from 'jsonwebtoken';
import { query as db } from '../config/db.js';

const router = express.Router();

// 创建认证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: '认证令牌无效' });
    }
};

// 订单准备（获取收款码）
router.post('/prepare', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'buyer') {
            return res.status(403).json({ message: '只有买家可以创建订单' });
        }

        const { items } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ message: '购物车为空' });
        }

        // 验证所有图书是否从同一卖家
        const bookIds = items.map(item => item.id);
        const booksResult = await db(
            'SELECT b.id, b.seller_id, u.username as seller_name FROM books b JOIN users u ON b.seller_id = u.id WHERE b.id = ANY($1::int[])',
            [bookIds]
        );

        if (booksResult.rows.length === 0) {
            return res.status(404).json({ message: '图书不存在' });
        }

        const sellerId = booksResult.rows[0].seller_id;
        const sellerName = booksResult.rows[0].seller_name;

        // 确保所有图书来自同一卖家
        const differentSeller = booksResult.rows.find(book => book.seller_id !== sellerId);
        if (differentSeller) {
            return res.status(400).json({ message: '一次只能购买同一卖家的图书' });
        }

        // 获取卖家的收款码
        const paymentCodesResult = await db(
            'SELECT type, image_url FROM payment_codes WHERE seller_id = $1',
            [sellerId]
        );

        const paymentCodes = {};
        paymentCodesResult.rows.forEach(code => {
            paymentCodes[code.type] = code.image_url;
        });

        res.json({
            seller: {
                id: sellerId,
                name: sellerName
            },
            sellerPaymentCodes: paymentCodes
        });
    } catch (error) {
        console.error('准备订单失败:', error);
        res.status(500).json({ message: '准备订单失败', error: error.message });
    }
});

// 确认支付订单
router.post('/confirm', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'buyer') {
            return res.status(403).json({ message: '只有买家可以支付订单' });
        }

        const { paymentMethod, selectedSeller, cartItems } = req.body;

        if (!paymentMethod || !selectedSeller || !cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: '参数不完整' });
        }

        // 事务开始
        await db('BEGIN');

        // 遍历购物车项，创建订单
        for (const item of cartItems) {
            // 获取图书信息，主要是检查库存
            const bookResult = await db(
                'SELECT * FROM books WHERE id = $1 FOR UPDATE',
                [item.id]
            );

            if (bookResult.rows.length === 0) {
                await db('ROLLBACK');
                return res.status(404).json({ message: `图书ID ${item.id} 不存在` });
            }

            const book = bookResult.rows[0];
            
            // 检查库存是否足够
            if (book.stock < item.quantity) {
                await db('ROLLBACK');
                return res.status(400).json({ message: `图书《${book.title}》库存不足，当前库存: ${book.stock}` });
            }

            // 创建订单
            await db(
                'INSERT INTO orders (buyer_id, book_id, quantity, total_price, status, payment_method) VALUES ($1, $2, $3, $4, $5, $6)',
                [req.user.id, item.id, item.quantity, item.price * item.quantity, 'paid', paymentMethod]
            );

            // 更新库存
            await db(
                'UPDATE books SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.id]
            );
        }

        // 事务提交
        await db('COMMIT');

        res.json({ message: '订单支付成功' });
    } catch (error) {
        await db('ROLLBACK');
        console.error('支付订单失败:', error);
        res.status(500).json({ message: '支付订单失败', error: error.message });
    }
});

// 获取买家订单历史
router.get('/history', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'buyer') {
            return res.status(403).json({ message: '只有买家可以查看自己的订单历史' });
        }

        const ordersResult = await db(
            `SELECT o.id, o.quantity, o.total_price, o.status, o.created_at, o.payment_method,
             b.title as book_title, b.author as book_author, b.image_url as book_image,
             u.username as seller_name
             FROM orders o
             JOIN books b ON o.book_id = b.id
             JOIN users u ON b.seller_id = u.id
             WHERE o.buyer_id = $1
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json(ordersResult.rows);
    } catch (error) {
        console.error('获取订单历史失败:', error);
        res.status(500).json({ message: '获取订单历史失败', error: error.message });
    }
});

// 获取卖家的订单列表
router.get('/seller', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: '只有卖家可以查看自己的销售订单' });
        }

        const ordersResult = await db(
            `SELECT o.id, o.quantity, o.total_price, o.status, o.created_at, o.payment_method,
             b.title as book_title, b.id as book_id,
             u.username as buyer_name
             FROM orders o
             JOIN books b ON o.book_id = b.id
             JOIN users u ON o.buyer_id = u.id
             WHERE b.seller_id = $1
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json(ordersResult.rows);
    } catch (error) {
        console.error('获取销售订单失败:', error);
        res.status(500).json({ message: '获取销售订单失败', error: error.message });
    }
});

// 更新订单状态（卖家）
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'seller') {
            return res.status(403).json({ message: '只有卖家可以更新订单状态' });
        }

        const { id } = req.params;
        const { status } = req.body;

        // 验证状态有效性
        const validStatuses = ['paid', 'shipped', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: '无效的订单状态' });
        }

        // 验证订单是否属于该卖家
        const orderCheck = await db(
            `SELECT o.id FROM orders o
             JOIN books b ON o.book_id = b.id
             WHERE o.id = $1 AND b.seller_id = $2`,
            [id, req.user.id]
        );

        if (orderCheck.rows.length === 0) {
            return res.status(404).json({ message: '订单不存在或不属于您' });
        }

        // 更新订单状态
        await db(
            'UPDATE orders SET status = $1 WHERE id = $2',
            [status, id]
        );

        res.json({ message: '订单状态已更新' });
    } catch (error) {
        console.error('更新订单状态失败:', error);
        res.status(500).json({ message: '更新订单状态失败', error: error.message });
    }
});

export default router; 