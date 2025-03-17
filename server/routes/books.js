import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { query as db } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, deleteFile } from '../utils/upload.js';
import { AppError } from '../middleware/error.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');





const router = express.Router();

// 获取所有图书
router.get('/', async (req, res, next) => {
    try {
        const result = await db('SELECT * FROM books ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        next(new AppError('获取图书列表失败', 500));
    }
});

// 获取单本图书
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db('SELECT * FROM books WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return next(new AppError('图书不存在', 404));
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        next(new AppError('获取图书详情失败', 500));
    }
});

// 获取所有图书分类
router.get('/categories', async (req, res, next) => {
    try {
        console.log('获取所有图书分类');
        const result = await db('SELECT DISTINCT category FROM books WHERE category IS NOT NULL');
        const categories = result.rows.map(row => row.category).filter(Boolean);
        
        // 添加一些默认分类
        const defaultCategories = ['小说', '文学', '历史', '科技', '经济', '艺术', '教育', '生活', '计算机', '外语'];
        const allCategories = [...new Set([...categories, ...defaultCategories])];
        
        res.json({ categories: allCategories });
    } catch (error) {
        console.error('获取图书分类失败:', error);
        next(new AppError('获取图书分类失败', 500));
    }
});

// 添加图书(卖家)
router.post('/', authenticateToken, upload.single('image'), async (req, res, next) => {
    try {
        if (req.user.role !== 'seller') {
            return next(new AppError('只有卖家可以添加图书', 403));
        }
        
        const { title, author, price, stock, description, category } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        
        // 记录图片路径信息
        console.log('添加图书 - 图片路径:', {
            原始文件名: req.file?.originalname,
            存储文件名: req.file?.filename,
            保存的image_url: image_url
        });
        
        const result = await db(
            'INSERT INTO books (title, author, price, stock, seller_id, description, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [title, author, price, stock, req.user.id, description || null, category || null, image_url]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(new AppError('添加图书失败: ' + error.message, 500));
    }
});

// 更新图书(卖家)
router.put('/:id', authenticateToken, upload.single('image'), async (req, res, next) => {
    try {
        if (req.user.role !== 'seller') {
            return next(new AppError('只有卖家可以更新图书', 403));
        }
        
        const { id } = req.params;
        const { title, author, price, stock, description } = req.body;
        
        // 检查是否是该书的卖家
        const bookCheck = await db('SELECT * FROM books WHERE id = $1', [id]);
        if (bookCheck.rows.length === 0) {
            return next(new AppError('图书不存在', 404));
        }
        
        if (bookCheck.rows[0].seller_id !== req.user.id) {
            return next(new AppError('只能更新自己的图书', 403));
        }
        
        let image_url = bookCheck.rows[0].image_url;
        
        // 如果上传了新图片，删除旧图片并更新
        if (req.file) {
            if (image_url) {
                deleteFile(image_url);
            }
            image_url = `/uploads/${req.file.filename}`;
        }
        
        const result = await db(
            'UPDATE books SET title = $1, author = $2, price = $3, stock = $4, description = $5, image_url = $6 WHERE id = $7 RETURNING *',
            [title, author, price, stock, description, image_url, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        next(new AppError('更新图书失败: ' + error.message, 500));
    }
});

// 删除图书(卖家)
router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
        if (req.user.role !== 'seller') {
            return next(new AppError('只有卖家可以删除图书', 403));
        }
        
        const { id } = req.params;
        
        // 检查是否是该书的卖家
        const bookCheck = await db('SELECT * FROM books WHERE id = $1', [id]);
        if (bookCheck.rows.length === 0) {
            return next(new AppError('图书不存在', 404));
        }
        
        if (bookCheck.rows[0].seller_id !== req.user.id) {
            return next(new AppError('只能删除自己的图书', 403));
        }
        
        // 删除图书相关图片
        if (bookCheck.rows[0].image_url) {
            deleteFile(bookCheck.rows[0].image_url);
        }
        
        await db('DELETE FROM books WHERE id = $1', [id]);
        
        res.json({ message: '图书删除成功' });
    } catch (error) {
        next(new AppError('删除图书失败: ' + error.message, 500));
    }
});

export default router;