<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">欢迎来到图书商城</h1>
        <p class="hero-subtitle">发现、购买和销售您喜爱的图书</p>
        <div class="hero-buttons">
          <router-link to="/login">
            <el-button type="primary" size="large">立即登录</el-button>
          </router-link>
          <router-link to="/register">
            <el-button size="large">注册账号</el-button>
          </router-link>
        </div>
      </div>
      <div class="hero-image">
        <div class="image-placeholder">
          <el-icon class="placeholder-icon"><Reading /></el-icon>
          <span>图书商城</span>
        </div>
      </div>
    </div>
    
    <div class="features-section">
      <h2 class="section-title">我们的特色</h2>
      <div class="features-grid">
        <div class="feature-card">
          <el-icon class="feature-icon"><ShoppingBag /></el-icon>
          <h3>便捷购物</h3>
          <p>轻松浏览和购买各类图书，支持多种支付方式</p>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon"><Goods /></el-icon>
          <h3>卖家平台</h3>
          <p>成为卖家，管理您的图书库存和订单</p>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon"><Money /></el-icon>
          <h3>安全支付</h3>
          <p>支持支付宝和微信支付，安全便捷</p>
        </div>
        <div class="feature-card">
          <el-icon class="feature-icon"><Reading /></el-icon>
          <h3>丰富分类</h3>
          <p>提供多种图书分类，满足不同读者需求</p>
        </div>
      </div>
    </div>
    
    <!-- 图书展示区域 -->
    <div class="books-section" ref="booksSection">
      <h2 class="section-title">热门图书</h2>
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated />
        <el-skeleton :rows="3" animated />
      </div>
      <el-row v-else :gutter="24">
        <el-col v-for="book in books.slice(0, 8)" :key="book.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card :body-style="{ padding: '0px' }" class="book-card" shadow="hover">
            <div class="book-cover">
              <el-image 
                :src="getImageUrl(book.image_url)" 
                fit="cover"
                class="book-cover-image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <span>图片加载失败</span>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">作者：{{ book.author }}</p>
              <div class="book-price-stock">
                <span class="book-price">¥{{ book.price }}</span>
                <span class="book-stock" :class="{ 'low-stock': book.stock < 5 }">库存: {{ book.stock }}</span>
              </div>
              <el-button 
                type="primary" 
                @click="promptLogin"
                :disabled="book.stock <= 0"
                class="view-book-btn"
              >
                查看详情
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-empty v-if="books.length === 0 && !loading" description="暂无图书" />
    </div>
    
    <div class="cta-section">
      <div class="cta-content">
        <h2>准备好开始了吗？</h2>
        <p>立即注册账号，开始您的图书之旅</p>
        <router-link to="/register">
          <el-button type="primary" size="large">立即注册</el-button>
        </router-link>
      </div>
    </div>
    
    <!-- 使用指南对话框 -->
    <el-dialog v-model="showGuide" title="使用指南" width="50%">
      <div class="guide-content">
        <h3>如何使用图书商城</h3>
        <el-divider></el-divider>
        <h4>1. 浏览图书</h4>
        <p>您可以在首页浏览所有图书，查看图书详情、价格和库存情况。</p>
        
        <h4>2. 注册账号</h4>
        <p>点击右上角的"注册"按钮，填写用户信息并选择您的角色（买家/卖家）。</p>
        
        <h4>3. 登录系统</h4>
        <p>使用您的用户名和密码登录系统，根据您的角色进入相应的界面。</p>
        
        <h4>4. 买家功能</h4>
        <p>作为买家，您可以浏览图书、将图书加入购物车、管理购物车并完成购买。</p>
        
        <h4>5. 卖家功能</h4>
        <p>作为卖家，您可以管理您的图书，包括添加新书、编辑图书信息和管理库存。</p>
      </div>
    </el-dialog>

    <!-- 登录提示对话框 -->
    <el-dialog v-model="showLoginPrompt" title="提示" width="30%">
      <span>请先登录后再进行操作</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLoginPrompt = false">取消</el-button>
          <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
        </span>
      </template>
    </el-dialog>
    
    <footer class="home-footer">
      <div class="footer-links">
        <router-link to="/about">关于我们</router-link>
        <span class="divider">|</span>
        <router-link to="/help">帮助中心</router-link>
      </div>
      <p>&copy; 2023-{{ new Date().getFullYear() }} 图书商城. 保留所有权利.</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ShoppingBag, Goods, Money, Reading, Picture } from '@element-plus/icons-vue';

const books = ref([]);
const loading = ref(false);
const showGuide = ref(false);
const showLoginPrompt = ref(false);
const booksSection = ref(null);
const apiUrl = import.meta.env.VITE_API_URL;

// 获取图片URL
function getImageUrl(image) {
  if (!image) {
    console.warn('图片路径为空');
    return '';
  }
  
  console.log('处理图片路径:', image);
  
  // 如果已经是完整URL，直接返回
  if (image.startsWith('http')) {
    return image;
  }
  
  // 确保路径以/uploads开头
  let normalizedPath = image;
  if (!normalizedPath.startsWith('/uploads') && !normalizedPath.startsWith('uploads')) {
    normalizedPath = `/uploads/${normalizedPath.replace(/^\/+/, '')}`;
  } else if (normalizedPath.startsWith('uploads/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  
  // 构建完整URL
  const fullUrl = `${apiUrl}${normalizedPath}`;
  console.log('构建的完整URL:', fullUrl);
  
  return fullUrl;
}

// 加载图书数据
async function loadBooks() {
  loading.value = true;
  try {
    const response = await axios.get(`${apiUrl}/api/books/public`);
    books.value = response.data.books || [];
  } catch (error) {
    console.error('获取图书列表失败:', error);
  } finally {
    loading.value = false;
  }
}

// 提示用户登录
function promptLogin() {
  showLoginPrompt.value = true;
}

// 滚动到图书区域
function scrollToBooks() {
  booksSection.value.scrollIntoView({ behavior: 'smooth' });
}

onMounted(() => {
  loadBooks();
});
</script>

<style scoped>
.home-container {
  padding-bottom: 40px;
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 60px;
  gap: 40px;
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 3rem;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 30px;
}

.hero-buttons {
  display: flex;
  gap: 20px;
}

.hero-image {
  flex: 1;
  max-width: 500px;
}

.hero-image img {
  width: 100%;
  border-radius: var(--border-radius-medium);
  box-shadow: var(--box-shadow-medium);
}

.image-placeholder {
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: var(--border-radius-medium);
  box-shadow: var(--box-shadow-medium);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.placeholder-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: 20px;
}

.image-placeholder span {
  font-size: 1.5rem;
  color: var(--text-primary);
  font-weight: bold;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 40px;
}

.features-section {
  margin-bottom: 60px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.feature-card {
  background-color: #fff;
  padding: 30px;
  border-radius: var(--border-radius-medium);
  box-shadow: var(--box-shadow-light);
  text-align: center;
  transition: transform var(--transition-normal);
}

.feature-card:hover {
  transform: translateY(-10px);
}

.feature-icon {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 15px;
}

.feature-card p {
  color: var(--text-regular);
}

.books-section {
  margin-bottom: 60px;
}

.loading-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.book-card {
  margin-bottom: 24px;
  transition: transform 0.3s;
  height: 100%;
}

.book-card:hover {
  transform: translateY(-5px);
}

.book-cover {
  height: 200px;
  overflow: hidden;
  background-color: var(--background-dark);
}

.book-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-cover-placeholder {
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.book-info {
  padding: 15px;
}

.book-title {
  font-size: 16px;
  margin-bottom: 8px;
  color: var(--text-primary);
  height: 44px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.book-author {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.book-price {
  font-size: 18px;
  font-weight: bold;
  color: var(--danger-color);
  margin-bottom: 8px;
}

.book-stock {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stock-warning {
  color: var(--warning-color);
  font-size: 12px;
}

.stock-empty {
  color: var(--danger-color);
  font-size: 12px;
}

.low-stock {
  color: var(--warning-color);
}

.view-book-btn {
  width: 100%;
}

.cta-section {
  background-color: var(--primary-color);
  padding: 60px 0;
  border-radius: var(--border-radius-medium);
  margin-bottom: 60px;
}

.cta-content {
  text-align: center;
  color: #fff;
}

.cta-content h2 {
  font-size: 2rem;
  margin-bottom: 15px;
}

.cta-content p {
  font-size: 1.2rem;
  margin-bottom: 30px;
}

.guide-content h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 15px;
}

.guide-content h4 {
  font-size: 16px;
  color: var(--text-primary);
  margin: 15px 0 5px;
}

.guide-content p {
  color: var(--text-regular);
  margin-bottom: 10px;
}

.home-footer {
  text-align: center;
  color: var(--text-secondary);
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}

.footer-links {
  margin-bottom: 10px;
}

.footer-links a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.divider {
  margin: 0 10px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .hero-buttons {
    justify-content: center;
  }
  
  .hero-image {
    order: -1;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .cta-section {
    padding: 40px 20px;
  }
}

.image-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 12px;
  background-color: #f5f7fa;
}

.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.book-price-stock {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
</style>