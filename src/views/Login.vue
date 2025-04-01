<template>
  <div class="login-container">
    <LoadingIndicator :loading="loading" text="登录中..." />
    <el-card class="login-card">
      <div class="login-header">
        <el-button type="text" @click="$router.push('/')" class="back-home-button">
          <el-icon><ArrowLeft /></el-icon> 返回主页
        </el-button>
        <h2>登录</h2>
        <p class="login-subtitle">欢迎回到图书商城系统</p>
      </div>
      <el-form @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="username" placeholder="请输入用户名" prefix-icon="el-icon-user" />
        </el-form-item>
        
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="请输入密码" prefix-icon="el-icon-lock" show-password />
        </el-form-item>
        
        <el-form-item>
          <el-select v-model="role" placeholder="请选择角色" class="role-select">
            <el-option label="买家" value="buyer" />
            <el-option label="卖家" value="seller" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>

        <el-form-item class="login-actions">
          <el-button type="primary" native-type="submit" :loading="loading" class="login-button">登录</el-button>
          <div class="register-link">
            <span>还没有账号？</span>
            <el-button type="text" @click="$router.push('/register')">立即注册</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import LoadingIndicator from '../components/LoadingIndicator.vue';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const role = ref('');
// 使用本地loading状态而非store中的状态
const loading = ref(false);

// 添加生命周期钩子，在组件挂载时输出日志，便于调试
onMounted(() => {
  console.log('登录页面已加载');
  console.log('当前认证状态:', authStore.isAuthenticated);
  console.log('当前用户角色:', authStore.userRole);
  
  // 强制刷新Pinia状态，确保与localStorage同步
  if (localStorage.getItem('token') === null && authStore.token !== null) {
    console.log('检测到状态不一致，正在重置Pinia状态');
    authStore.logout();
  }
});

async function handleLogin() {
  if (!username.value || !password.value || !role.value) {
    ElMessage.warning('请输入用户名、密码和选择角色');
    return;
  }
  
  // 设置本地loading状态
  loading.value = true;
  
  try {
    const success = await authStore.login(username.value, password.value, role.value);
    if (success) {
      ElMessage.success('登录成功');
      router.push(`/${role.value}`);
    }
  } catch (error) {
    console.error('登录处理错误:', error);
    ElMessage.error('登录失败，请稍后重试');
  } finally {
    // 确保loading状态被重置
    loading.value = false;
    // 同时确保store中的loading状态也被重置
    if (authStore.loading) {
      authStore.$patch({ loading: false });
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--bg-secondary);
  background-image: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  transition: background-color var(--transition-normal), background-image var(--transition-normal);
}

.login-card {
  width: 400px;
  border-radius: var(--border-radius-medium);
  box-shadow: var(--box-shadow);
  padding: 10px 20px;
  background-color: var(--card-bg);
  color: var(--text-primary);
  transition: background-color var(--transition-normal), color var(--transition-normal);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

}

.login-header h2 {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  margin-top: 10px;
}

.login-actions {
  margin-top: 20px;
}

.register-link {
  text-align: center;
  margin-top: 15px;
  color: var(--text-secondary);
  font-size: 14px;
}

.el-input {
  margin-bottom: 15px;
}

.el-input__inner {
  padding: 12px 15px;
}

.back-home-button {
  position: absolute;
  left: 20px;
  top: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 14px;
}

.back-home-button:hover {
  color: var(--text-primary);
}

.role-select {
  width: 100%;
}
</style>