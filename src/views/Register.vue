<template>
  <div class="register-container">
    <el-card class="register-card">
      <div class="register-header">
        <el-button type="text" @click="$router.push('/')" class="back-home-button">
          <el-icon><ArrowLeft /></el-icon> 返回主页
        </el-button>
        <h2>注册</h2>
        <p class="register-subtitle">创建您的图书商城账号</p>
      </div>
      <el-form @submit.prevent="handleRegister">
        <el-form-item>
          <el-input v-model="username" placeholder="请输入用户名" prefix-icon="el-icon-user" />
        </el-form-item>
        
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="请输入密码" prefix-icon="el-icon-lock" show-password />
        </el-form-item>
        
        <el-form-item>
          <el-input v-model="email" placeholder="请输入邮箱" prefix-icon="el-icon-message" />
        </el-form-item>
        
        <el-form-item>
          <el-select v-model="role" placeholder="请选择角色" class="role-select">
            <el-option label="买家" value="buyer" />
            <el-option label="卖家" value="seller" />
          </el-select>
        </el-form-item>
        
        <el-form-item class="register-actions">
          <el-button type="primary" native-type="submit" :loading="loading" class="register-button">注册</el-button>
          <div class="login-link">
            <span>已有账号？</span>
            <el-button type="text" @click="$router.push('/login')">返回登录</el-button>
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
import { ArrowLeft } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const email = ref('');
const role = ref('');
const loading = ref(false);

async function handleRegister() {
  if (!username.value || !password.value || !email.value || !role.value) {
    ElMessage.warning('请填写所有必填字段');
    return;
  }
  
  loading.value = true;
  try {
    const result = await authStore.register({
      username: username.value,
      password: password.value,
      email: email.value,
      role: role.value,
    });
    
    if (result.success) {
      ElMessage.success(result.message || '注册成功');
      router.push('/login');
    } else {
      ElMessage.error(result.message || '注册失败');
    }
  } catch (error) {
    console.error('注册处理错误:', error);
    ElMessage.error('注册过程中发生错误');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--background-light);
  background-image: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

.register-card {
  width: 400px;
  border-radius: var(--border-radius-medium);
  box-shadow: var(--box-shadow);
  padding: 10px 20px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;

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

.register-header h2 {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.register-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.register-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  margin-top: 10px;
}

.register-actions {
  margin-top: 20px;
}

.login-link {
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

.role-select {
  width: 100%;
}
</style>