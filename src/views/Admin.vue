<template>
  <div class="admin-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-header-title">管理员控制台</span>
          <el-button @click="authStore.logout(); $router.push('/login')" icon="el-icon-switch-button">退出登录</el-button>
        </div>
      </template>
      
      <el-tabs type="border-card" class="admin-tabs">
        <el-tab-pane label="用户管理">
          <el-table :data="users" style="width: 100%" border stripe>
            <el-table-column prop="username" label="用户名" min-width="100" />
            <el-table-column prop="role" label="角色" width="100">
              <template #default="{ row }">
                <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'seller' ? 'warning' : 'success'">
                  {{ row.role }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="email" label="邮箱" min-width="150" />
            <el-table-column prop="created_at" label="创建时间" min-width="150" />
          </el-table>
          <el-empty v-if="users.length === 0" description="暂无用户数据" />
        </el-tab-pane>
        
        <el-tab-pane label="订单管理">
          <el-table :data="orders" style="width: 100%" border stripe>
            <el-table-column prop="id" label="订单ID" width="80" />
            <el-table-column prop="buyer_id" label="买家ID" width="80" />
            <el-table-column prop="total_price" label="总价" width="100">
              <template #default="{ row }">
                <span class="price">¥{{ row.total_price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'info'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" min-width="150" />
          </el-table>
          <el-empty v-if="orders.length === 0" description="暂无订单数据" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const users = ref([]);
const orders = ref([]);

onMounted(async () => {
  try {
    const [usersRes, ordersRes] = await Promise.all([
      axios.get('http://localhost:3000/api/users', {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }),
      axios.get('http://localhost:3000/api/orders', {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
    ]);
    users.value = usersRes.data;
    orders.value = ordersRes.data;
  } catch (error) {
    console.error('获取数据失败:', error);
    ElMessage.error('获取数据失败');
  }
});
</script>

<style scoped>
.admin-container {
  padding: 20px;
  background-color: var(--background-light);
  min-height: 100vh;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-title {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-primary);
}

.admin-tabs {
  margin-top: 10px;
  box-shadow: var(--box-shadow-light);
  border-radius: var(--border-radius-medium);
}

.price {
  color: #e74c3c;
  font-weight: bold;
}

@media (max-width: 768px) {
  .admin-container {
    padding: 10px;
  }
}
</style>