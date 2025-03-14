<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <div class="home-header">
      <div class="logo-container">
        <h1 class="site-title">图书商城</h1>
      </div>
      <div class="nav-buttons">
        <el-button type="primary" @click="$router.push('/login')">登录</el-button>
        <el-button @click="$router.push('/register')">注册</el-button>
      </div>
    </div>

    <!-- 网站介绍区域 -->
    <el-card class="intro-section">
      <div class="intro-content">
        <h2>欢迎来到图书商城</h2>
        <p>这是一个专业的在线图书交易平台，为您提供丰富的图书资源和便捷的购买体验。</p>
        <div class="intro-buttons">
          <el-button type="primary" @click="showGuide = true">使用指南</el-button>
          <el-button @click="scrollToBooks">浏览图书</el-button>
        </div>
      </div>
    </el-card>

    <!-- 图书展示区域 -->
    <div class="books-section" ref="booksSection">
      <h2 class="section-title">热门图书</h2>
      <el-row :gutter="24">
        <el-col v-for="book in books" :key="book.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card :body-style="{ padding: '0px' }" class="book-card" shadow="hover">
            <div class="book-cover">
              <div class="book-cover-placeholder"></div>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">作者：{{ book.author }}</p>
              <p class="book-price">¥{{ book.price }}</p>
              <p class="book-stock" :class="{ 'low-stock': book.stock < 5 }">
                库存：{{ book.stock }}
                <span v-if="book.stock < 5 && book.stock > 0" class="stock-warning">库存紧张</span>
                <span v-if="book.stock <= 0" class="stock-empty">已售罄</span>
              </p>
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
      
      <el-empty v-if="books.length === 0" description="暂无图书" />
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

    <!-- 页脚 -->
    <div class="home-footer">
      <p>© 2023 图书商城 - 您的在线图书交易平台</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const books = ref([]);
const showGuide = ref(false);
const showLoginPrompt = ref(false);
const booksSection = ref(null);

// 加载图书数据
async function loadBooks() {
  try {
    const response = await axios.get('http://localhost:3000/api/books/public');
    books.value = response.data;
  } catch (error) {
    console.error('获取图书列表失败:', error);
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background-light);
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background-color: white;
  box-shadow: var(--box-shadow-light);
  position: sticky;
  top: 0;
  z-index: 10;
}

.site-title {
  color: var(--primary-color);
  margin: 0;
  font-size: 28px;
}

.nav-buttons .el-button {
  margin-left: 10px;
}

.intro-section {
  margin: 40px auto;
  width: 90%;
  max-width: 1200px;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: none;
  border-radius: var(--border-radius-large);
}

.intro-content {
  padding: 40px;
  text-align: center;
}

.intro-content h2 {
  font-size: 32px;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.intro-content p {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 800px;
  margin: 0 auto 30px;
  line-height: 1.6;
}

.intro-buttons {
  margin-top: 20px;
}

.intro-buttons .el-button {
  margin: 0 10px;
  padding: 12px 24px;
  font-size: 16px;
}

.books-section {
  padding: 40px;
  width: 90%;
  max-width: 1200px;
  margin: 0 auto 40px;
}

.section-title {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 30px;
  text-align: center;
}

.book-card {
  margin-bottom: 24px;
  transition: transform 0.3s;
  height: 100%;
}

.book-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--box-shadow-hover);
}

.book-cover {
  height: 200px;
  overflow: hidden;
}

.book-cover-placeholder {
  height: 100%;
  background-color: #e0e0e0;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-info {
  padding: 16px;
}

.book-title {
  font-size: 18px;
  margin: 0 0 8px;
  color: var(--text-primary);
  height: 54px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.book-author {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 8px 0;
}

.book-price {
  font-size: 18px;
  color: #e74c3c;
  font-weight: bold;
  margin: 8px 0;
}

.book-stock {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 8px 0;
}

.stock-warning {
  color: var(--warning-color);
  font-size: 12px;
  margin-left: 5px;
}

.stock-empty {
  color: var(--danger-color);
  font-size: 12px;
  margin-left: 5px;
}

.view-book-btn {
  width: 100%;
  margin-top: 10px;
}

.guide-content {
  padding: 20px;
}

.guide-content h3 {
  color: var(--primary-color);
  font-size: 24px;
  margin-bottom: 20px;
}

.guide-content h4 {
  color: var(--text-primary);
  font-size: 18px;
  margin: 16px 0 8px;
}

.guide-content p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.home-footer {
  background-color: #2c3e50;
  color: white;
  text-align: center;
  padding: 20px;
  margin-top: auto;
}
</style>