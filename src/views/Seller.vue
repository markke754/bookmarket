<template>
  <div class="seller-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-header-title">卖家中心</span>
          <el-button @click="authStore.logout(); $router.push('/login')" icon="el-icon-switch-button">退出登录</el-button>
        </div>
      </template>
      
      <el-button type="primary" @click="dialogVisible = true" icon="el-icon-plus" class="add-book-btn">添加图书</el-button>
      
      <el-table :data="books" style="width: 100%; margin-top: 20px" border stripe>
        <el-table-column prop="title" label="书名" min-width="120" />
        <el-table-column prop="author" label="作者" min-width="100" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            <span class="price">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100">
          <template #default="{ row }">
            <el-tag :type="row.stock > 10 ? 'success' : row.stock > 0 ? 'warning' : 'danger'">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editBook(row)" icon="el-icon-edit" circle />
            <el-button type="danger" size="small" @click="deleteBook(row)" icon="el-icon-delete" circle />
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="books.length === 0" description="暂无图书" />
      
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑图书' : '添加图书'" width="500px">
        <el-form :model="bookForm" label-width="80px">
          <el-form-item label="书名">
            <el-input v-model="bookForm.title" placeholder="请输入书名" />
          </el-form-item>
          <el-form-item label="作者">
            <el-input v-model="bookForm.author" placeholder="请输入作者" />
          </el-form-item>
          <el-form-item label="价格">
            <el-input-number v-model="bookForm.price" :precision="2" :step="0.1" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="库存">
            <el-input-number v-model="bookForm.stock" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="bookForm.description" type="textarea" :rows="4" placeholder="请输入图书描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitBook">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const authStore = useAuthStore();
const books = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const bookForm = ref({
  title: '',
  author: '',
  price: 0,
  stock: 0,
  description: ''
});

async function deleteBook(book) {
  try {
    await ElMessageBox.confirm('确定要删除这本图书吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await axios.delete(`http://localhost:3000/api/books/${book.id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    ElMessage.success('删除成功');
    loadBooks();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除图书失败:', error);
      if (error.response?.status === 404) {
        ElMessage.error('图书不存在或无权限删除');
      } else if (error.response?.status === 403) {
        ElMessage.error('没有删除权限');
      } else if (error.response?.data?.message) {
        ElMessage.error(error.response.data.message);
      } else if (!error.response) {
        ElMessage.error('网络连接失败，请检查服务器是否正常运行');
      } else {
        ElMessage.error('删除失败，请稍后重试');
      }
    }
  }
}

async function loadBooks() {
  try {
    const response = await axios.get('http://localhost:3000/api/books', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    books.value = response.data;
  } catch (error) {
    console.error('获取图书列表失败:', error);
  }
}

function editBook(book) {
  isEdit.value = true;
  bookForm.value = { ...book };
  dialogVisible.value = true;
}

async function submitBook() {
  try {
    if (isEdit.value) {
      await axios.put(`http://localhost:3000/api/books/${bookForm.value.id}`, bookForm.value, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      ElMessage.success('更新成功');
    } else {
      await axios.post('http://localhost:3000/api/books', bookForm.value, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
    loadBooks();
  } catch (error) {
    console.error(isEdit.value ? '更新图书失败:' : '添加图书失败:', error);
    ElMessage.error(error.response?.data?.message || (isEdit.value ? '更新失败，请检查网络连接' : '添加失败，请检查网络连接'));
  }
}

onMounted(() => {
  loadBooks();
});
</script>

<style scoped>
.seller-container {
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

.add-book-btn {
  margin-bottom: 20px;
}

.price {
  color: #e74c3c;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .seller-container {
    padding: 10px;
  }
  
  .el-dialog {
    width: 90% !important;
  }
}
</style>