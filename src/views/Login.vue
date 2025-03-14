<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const loading = ref(false);

async function handleLogin() {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }
  
  loading.value = true;
  try {
    const success = await authStore.login(username.value, password.value);
    if (success) {
      ElMessage.success('登录成功');
      const role = authStore.userRole;
      router.push(`/${role}`);
    } else {
      ElMessage.error('登录失败');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--background-light);
  background-image: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

.login-card {
  width: 400px;
  border-radius: var(--border-radius-medium);
  box-shadow: var(--box-shadow);
  padding: 10px 20px;
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
</style>