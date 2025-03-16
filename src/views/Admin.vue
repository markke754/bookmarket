<template>
  <div class="admin-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <i class="el-icon-s-tools header-icon"></i>
            <span class="card-header-title">管理员控制台</span>
          </div>
          <el-button type="danger" plain @click="authStore.logout(); $router.push('/login')" class="logout-btn">
            <i class="el-icon-switch-button"></i> 退出登录
          </el-button>
        </div>
      </template>
      
      <el-tabs type="border-card" class="admin-tabs">
        <el-tab-pane label="管理员注册">
          <div class="tab-content">
            <h3 class="section-title">创建新管理员账号</h3>
            <p class="section-desc">仅限有权限的管理员创建新的管理员账号</p>
            
            <el-form @submit.prevent="handleAdminRegister" class="admin-register-form" label-position="top">
              <el-form-item label="用户名">
                <el-input v-model="newAdmin.username" placeholder="请输入用户名" prefix-icon="el-icon-user" />
              </el-form-item>
              
              <el-form-item label="密码">
                <el-input v-model="newAdmin.password" type="password" placeholder="请输入密码" prefix-icon="el-icon-lock" show-password />
              </el-form-item>
              
              <el-form-item label="邮箱">
                <el-input v-model="newAdmin.email" placeholder="请输入邮箱" prefix-icon="el-icon-message" />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" native-type="submit" :loading="registerLoading" class="register-button">
                  <i class="el-icon-plus"></i> 创建管理员账号
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="用户管理">
          <div class="tab-content">
            <h3 class="section-title">系统用户管理</h3>
            <p class="section-desc">查看和管理所有注册用户</p>
            
            <div class="table-toolbar">
              <el-input placeholder="搜索用户..." v-model="userSearchQuery" class="search-input" prefix-icon="el-icon-search"></el-input>
              <el-select v-model="userRoleFilter" placeholder="角色筛选" clearable class="role-filter">
                <el-option label="全部角色" value=""></el-option>
                <el-option label="管理员" value="admin"></el-option>
                <el-option label="卖家" value="seller"></el-option>
                <el-option label="买家" value="buyer"></el-option>
              </el-select>
            </div>
            
            <el-table 
              :data="filteredUsers" 
              style="width: 100%" 
              border 
              stripe
              highlight-current-row
              class="data-table"
            >
              <el-table-column prop="username" label="用户名" min-width="120">
                <template #default="{ row }">
                  <div class="user-cell">
                    <i class="el-icon-user user-icon"></i>
                    <span>{{ row.username }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="role" label="角色" width="120">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.role === 'admin' ? 'danger' : row.role === 'seller' ? 'warning' : 'success'"
                    size="medium"
                    effect="dark"
                  >
                    {{ row.role === 'admin' ? '管理员' : row.role === 'seller' ? '卖家' : '买家' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="email" label="邮箱" min-width="180" />
              <el-table-column prop="created_at" label="注册时间" min-width="180">
                <template #default="{ row }">
                  <i class="el-icon-time"></i> {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
            </el-table>
            
            <el-empty v-if="filteredUsers.length === 0" description="暂无用户数据" class="empty-state" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="订单管理">
          <div class="tab-content">
            <h3 class="section-title">订单管理系统</h3>
            <p class="section-desc">查看和管理所有用户订单</p>
            
            <div class="table-toolbar">
              <el-input placeholder="搜索订单..." v-model="orderSearchQuery" class="search-input" prefix-icon="el-icon-search"></el-input>
              <el-select v-model="orderStatusFilter" placeholder="状态筛选" clearable class="status-filter">
                <el-option label="全部状态" value=""></el-option>
                <el-option label="待处理" value="pending"></el-option>
                <el-option label="已完成" value="completed"></el-option>
              </el-select>
            </div>
            
            <el-table 
              :data="filteredOrders" 
              style="width: 100%" 
              border 
              stripe
              highlight-current-row
              class="data-table"
            >
              <el-table-column prop="id" label="订单ID" width="100">
                <template #default="{ row }">
                  <span class="order-id">#{{ row.id }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="buyer_id" label="买家ID" width="100" />
              <el-table-column prop="total_price" label="总价" width="120">
                <template #default="{ row }">
                  <span class="price">¥{{ formatPrice(row.total_price) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'info'"
                    size="medium"
                    effect="dark"
                  >
                    {{ row.status === 'completed' ? '已完成' : row.status === 'pending' ? '待处理' : row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" min-width="180">
                <template #default="{ row }">
                  <i class="el-icon-time"></i> {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" icon="el-icon-view" circle title="查看详情"></el-button>
                  <el-button 
                    :type="row.status === 'pending' ? 'success' : 'info'" 
                    size="small" 
                    :icon="row.status === 'pending' ? 'el-icon-check' : 'el-icon-refresh'" 
                    circle
                    :title="row.status === 'pending' ? '标记为完成' : '重置状态'"
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <el-empty v-if="filteredOrders.length === 0" description="暂无订单数据" class="empty-state" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const users = ref([]);
const orders = ref([]);
const registerLoading = ref(false);
const newAdmin = ref({
  username: '',
  password: '',
  email: ''
});

// 搜索和筛选
const userSearchQuery = ref('');
const userRoleFilter = ref('');
const orderSearchQuery = ref('');
const orderStatusFilter = ref('');

// 计算筛选后的用户列表
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(userSearchQuery.value.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchQuery.value.toLowerCase());
    const matchesRole = !userRoleFilter.value || user.role === userRoleFilter.value;
    return matchesSearch && matchesRole;
  });
});

// 计算筛选后的订单列表
const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    const matchesSearch = order.id.toString().includes(orderSearchQuery.value) ||
                         order.buyer_id.toString().includes(orderSearchQuery.value);
    const matchesStatus = !orderStatusFilter.value || order.status === orderStatusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 格式化价格
function formatPrice(price) {
  return Number(price).toFixed(2);
}

onMounted(async () => {
  try {
    console.log('正在加载管理员数据...');
    const [usersRes, ordersRes] = await Promise.all([
      axios.get('http://localhost:3000/api/users', {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }),
      axios.get('http://localhost:3000/api/orders', {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
    ]);
    console.log('用户数据加载成功:', usersRes.data.length);
    console.log('订单数据加载成功:', ordersRes.data.length);
    users.value = usersRes.data;
    orders.value = ordersRes.data;
  } catch (error) {
    console.error('获取数据失败:', error);
    let errorMessage = '获取数据失败';
    
    if (error.response) {
      if (error.response.status === 403) {
        errorMessage = '权限不足，只有管理员可以访问此页面';
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      errorMessage = '无法连接到服务器，请检查网络连接';
    } else {
      errorMessage = `请求错误: ${error.message}`;
    }
    
    ElMessage.error(errorMessage);
  }
});

async function handleAdminRegister() {
  if (!newAdmin.value.username || !newAdmin.value.password || !newAdmin.value.email) {
    ElMessage.warning('请填写所有必填字段');
    return;
  }
  
  registerLoading.value = true;
  try {
    const response = await axios.post('http://localhost:3000/api/admin/register', {
      ...newAdmin.value,
      role: 'admin'
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    
    if (response.data.success) {
      ElMessage.success('管理员账号创建成功');
      newAdmin.value = {
        username: '',
        password: '',
        email: ''
      };
      // 刷新用户列表
      const usersRes = await axios.get('http://localhost:3000/api/users', {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      users.value = usersRes.data;
    } else {
      ElMessage.error(response.data.message || '创建失败');
    }
  } catch (error) {
    console.error('创建管理员账号失败:', error);
    ElMessage.error('创建管理员账号失败');
  } finally {
    registerLoading.value = false;
  }
}
</script>

<style scoped>
.admin-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.main-card {
  border-radius: 8px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 16px 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 24px;
  margin-right: 10px;
  color: #409EFF;
}

.card-header-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.logout-btn {
  font-weight: 500;
}

.admin-tabs {
  margin-top: 0;
  border: none;
  background-color: #ffffff;
  box-shadow: none;
}

.tab-content {
  padding: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.section-desc {
  color: #909399;
  font-size: 14px;
  margin-bottom: 24px;
}

.admin-register-form {
  max-width: 500px;
  margin: 20px auto;
  padding: 30px;
  background-color: #f9fafc;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.register-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 500;
  margin-top: 10px;
  border-radius: 4px;
}

.table-toolbar {
  display: flex;
  margin-bottom: 20px;
  gap: 16px;
  align-items: center;
}

.search-input {
  max-width: 300px;
}

.role-filter,
.status-filter {
  width: 140px;
}

.data-table {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-icon {
  color: #409EFF;
}

.price {
  color: #f56c6c;
  font-weight: 600;
}

.order-id {
  font-weight: 600;
  color: #606266;
}

.empty-state {
  margin: 40px 0;
}

@media (max-width: 768px) {
  .admin-container {
    padding: 10px;
  }
  
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .role-filter,
  .status-filter {
    max-width: none;
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>