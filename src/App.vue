<script setup>
// 引入主题样式
import './assets/theme.css';
import NavBar from './components/NavBar.vue';
import ErrorMessage from './components/ErrorMessage.vue';
</script>

<template>
  <div class="app-container">
    <NavBar />
    <ErrorMessage />
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style>
:root {
  --primary-color: #409eff;
  --primary-hover: #66b1ff;
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
  --info-color: #909399;
  --text-primary: #303133;
  --text-regular: #606266;
  --text-secondary: #909399;
  --border-color: #dcdfe6;
  --border-light: #e4e7ed;
  --background-light: #f5f7fa;
  --background-dark: #ebeef5;
  --border-radius-small: 4px;
  --border-radius-medium: 6px;
  --border-radius-large: 8px;
  --transition-normal: 0.3s ease;
  --box-shadow-light: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  --box-shadow-medium: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-regular);
  background-color: var(--background-light);
  line-height: 1.5;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.main-content {
  flex: 1;
  padding: 80px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* 全局过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .main-content {
    padding: 70px 10px 10px;
  }
}
</style>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
