<template>
  <div class="seller-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <i class="el-icon-sell header-icon"></i>
            <span class="card-header-title">卖家中心</span>
          </div>
          <el-button type="danger" plain @click="authStore.logout(); $router.push('/login')" class="logout-btn">
            <i class="el-icon-switch-button"></i> 退出登录
          </el-button>
        </div>
      </template>
      
      <div class="content-section">
        <div class="section-header">
          <h3 class="section-title">图书管理</h3>
          <p class="section-desc">管理您的图书库存和信息</p>
          <div class="toolbar">
            <el-input 
              placeholder="搜索图书..." 
              v-model="searchQuery" 
              class="search-input" 
              prefix-icon="el-icon-search"
              clearable
            ></el-input>
            <el-button 
              type="primary" 
              @click="openAddBookDialog" 
              icon="el-icon-plus" 
              class="add-book-btn"
            >添加图书</el-button>
          </div>
        </div>
        
        <el-table 
          :data="filteredBooks" 
          style="width: 100%" 
          border 
          stripe
          highlight-current-row
          class="data-table"
        >
          <el-table-column label="封面" width="100" align="center">
            <template #default="{ row }">
              <div class="book-cover-container">
                <img 
                  v-if="row.image_url" 
                  :src="getImageUrl(row.image_url)" 
                  class="book-cover-image"
                  @click="previewBookCover(row)" 
                />
                <div v-else class="book-cover-placeholder">
                  <i class="el-icon-picture-outline"></i>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="书名" min-width="150">
            <template #default="{ row }">
              <div class="book-title">{{ row.title }}</div>
              <div class="book-desc" v-if="row.description">{{ truncateText(row.description, 50) }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="author" label="作者" min-width="120" />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">
              <span class="price">¥{{ formatPrice(row.price) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="row.stock > 10 ? 'success' : row.stock > 0 ? 'warning' : 'danger'"
                size="medium"
                effect="dark"
              >
                {{ row.stock }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="editBook(row)" 
                icon="el-icon-edit" 
                circle 
                title="编辑图书"
              />
              <el-button 
                type="danger" 
                size="small" 
                @click="deleteBook(row)" 
                icon="el-icon-delete" 
                circle
                title="删除图书"
              />
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty v-if="filteredBooks.length === 0" description="暂无图书" class="empty-state" />
      </div>
      
      <!-- 图片预览对话框 -->
      <el-dialog v-model="imagePreviewVisible" title="图片预览" width="50%" destroy-on-close center class="preview-dialog">
        <div class="image-preview-container">
          <img :src="imagePreviewUrl" class="preview-image-large" />
        </div>
      </el-dialog>
      
      <el-dialog 
        v-model="dialogVisible" 
        :title="isEdit ? '编辑图书' : '添加图书'" 
        width="600px"
        destroy-on-close
        class="book-form-dialog"
      >
        <el-form 
          :model="bookForm" 
          label-width="100px" 
          ref="bookFormRef" 
          enctype="multipart/form-data"
          class="book-form"
          :rules="bookFormRules"
        >
          <el-form-item label="书名" prop="title">
            <el-input 
              v-model="bookForm.title" 
              placeholder="请输入书名" 
              prefix-icon="el-icon-reading"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="作者" prop="author">
            <el-input 
              v-model="bookForm.author" 
              placeholder="请输入作者" 
              prefix-icon="el-icon-user"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          
          <div class="form-row">
            <el-form-item label="价格" prop="price" class="form-col">
              <el-input-number 
                v-model="bookForm.price" 
                :precision="2" 
                :step="0.1" 
                :min="0" 
                style="width: 100%" 
                placeholder="设置价格"
              />
            </el-form-item>
            <el-form-item label="库存" prop="stock" class="form-col">
              <el-input-number 
                v-model="bookForm.stock" 
                :min="0" 
                style="width: 100%" 
                placeholder="设置库存"
              />
            </el-form-item>
          </div>
          
          <el-form-item label="描述" prop="description">
            <el-input 
              v-model="bookForm.description" 
              type="textarea" 
              :rows="4" 
              placeholder="请输入图书描述，包括内容简介、适合读者群体等信息"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="封面图片" class="upload-item">
            <el-upload
              class="book-image-uploader"
              action="#"
              :auto-upload="false"
              :show-file-list="true"
              :limit="1"
              :on-change="handleImageChange"
              :on-exceed="handleExceed"
              :before-remove="handleRemove"
            >
              <template #default>
                <div class="el-upload-dragger">
                  <el-icon class="el-icon--upload">
                    <i class="el-icon-upload"></i>
                  </el-icon>
                  <div class="el-upload__text">拖拽图片到此处或 <em>点击上传</em></div>
                  <div class="upload-tip">支持 JPG/PNG/GIF 格式，大小不超过 5MB</div>
                </div>
              </template>
              <template #file="{ file }">
                <div class="el-upload-list__item">
                  <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
                  <div class="el-upload-list__item-actions">
                    <span class="el-upload-list__item-preview" @click="previewImage(file)">
                      <i class="el-icon-zoom-in"></i>
                    </span>
                    <span class="el-upload-list__item-delete" @click="handleRemove(file)">
                      <i class="el-icon-delete"></i>
                    </span>
                  </div>
                </div>
              </template>
            </el-upload>
            <div v-if="bookForm.image_url && !imageFile" class="current-image">
              <p>当前图片：</p>
              <img :src="getImageUrl(bookForm.image_url)" class="preview-image" @click="previewCurrentImage" />
              <el-button size="small" type="danger" icon="el-icon-delete" @click="removeCurrentImage" class="remove-image-btn">删除图片</el-button>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="cancelForm">取消</el-button>
            <el-button type="primary" @click="submitBook" :loading="submitting">{{ isEdit ? '保存修改' : '添加图书' }}</el-button>
          </div>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const authStore = useAuthStore();
const books = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const searchQuery = ref('');
const bookFormRef = ref(null);

const bookForm = ref({
  title: '',
  author: '',
  price: 0,
  stock: 0,
  description: '',
  image_url: ''
});

const imageFile = ref(null);
const imagePreviewVisible = ref(false);
const imagePreviewUrl = ref('');

// 表单验证规则
const bookFormRules = {
  title: [
    { required: true, message: '请输入书名', trigger: 'blur' },
    { min: 2, max: 100, message: '书名长度应在2到100个字符之间', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入作者', trigger: 'blur' },
    { min: 2, max: 50, message: '作者名长度应在2到50个字符之间', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请设置价格', trigger: 'change' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'change' }
  ],
  stock: [
    { required: true, message: '请设置库存', trigger: 'change' },
    { type: 'number', min: 0, message: '库存不能小于0', trigger: 'change' }
  ],
  description: [
    { max: 500, message: '描述最多500个字符', trigger: 'blur' }
  ]
};

// 搜索过滤的图书列表
const filteredBooks = computed(() => {
  if (!searchQuery.value) return books.value;
  
  const query = searchQuery.value.toLowerCase();
  return books.value.filter(book => 
    book.title.toLowerCase().includes(query) || 
    book.author.toLowerCase().includes(query) ||
    (book.description && book.description.toLowerCase().includes(query))
  );
});

// 打开添加图书对话框
function openAddBookDialog() {
  isEdit.value = false;
  bookForm.value = {
    title: '',
    author: '',
    price: 0,
    stock: 0,
    description: '',
    image_url: ''
  };
  imageFile.value = null;
  dialogVisible.value = true;
  // 确保对话框显示后重置表单
  nextTick(() => {
    if (bookFormRef.value) {
      bookFormRef.value.resetFields();
    }
  });
}

// 截断文本
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// 格式化价格
function formatPrice(price) {
  return Number(price).toFixed(2);
}

// 预览书籍封面
function previewBookCover(book) {
  if (book.image_url) {
    imagePreviewUrl.value = getImageUrl(book.image_url);
    imagePreviewVisible.value = true;
  }
}

// 删除当前图片
function removeCurrentImage() {
  ElMessageBox.confirm('确定要删除当前图片吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    bookForm.value.image_url = null;
    ElMessage.success('图片已删除');
  }).catch(() => {});
}

// 取消表单
function cancelForm() {
  ElMessageBox.confirm('确定要取消操作吗？未保存的数据将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '返回编辑',
    type: 'warning'
  }).then(() => {
    dialogVisible.value = false;
    // 清理资源
    nextTick(() => {
      if (bookFormRef.value) {
        bookFormRef.value.resetFields();
      }
      imageFile.value = null;
    });
  }).catch(() => {
    // 用户取消关闭，继续编辑
  });
}

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
  // 创建深拷贝避免直接修改原对象
  bookForm.value = JSON.parse(JSON.stringify(book));
  imageFile.value = null;
  dialogVisible.value = true;
  
  // 确保对话框显示后更新表单状态
  nextTick(() => {
    if (bookFormRef.value) {
      bookFormRef.value.clearValidate();
    }
  });
}

function handleImageChange(file) {
  console.log('图片变更:', file);
  
  // 验证图片类型
  const isImage = file.raw.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    imageFile.value = null;
    return false;
  }
  
  // 验证图片大小
  const isLt5M = file.raw.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB!');
    imageFile.value = null;
    return false;
  }
  
  imageFile.value = file;
  
  // 确保文件对象有URL属性用于预览
  if (file && !file.url && file.raw) {
    console.log('创建预览URL:', file.raw.name, file.raw.type, file.raw.size);
    file.url = URL.createObjectURL(file.raw);
  }
  
  return true;
}

function handleExceed() {
  ElMessage.warning('只能上传一张图片');
}

function handleRemove(file) {
  console.log('删除图片:', file);
  imageFile.value = null;
  return true;
}

function previewImage(file) {
  imagePreviewUrl.value = file.url;
  imagePreviewVisible.value = true;
}

function previewCurrentImage() {
  imagePreviewUrl.value = getImageUrl(bookForm.value.image_url);
  imagePreviewVisible.value = true;
}

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:3000${url}`;
}

async function submitBook() {
  // 表单验证
  if (!bookFormRef.value) return;
  
  try {
    await bookFormRef.value.validate();
  } catch (error) {
    ElMessage.warning('请正确填写表单信息');
    return;
  }
  
  submitting.value = true;
  
  try {
    console.log('开始提交图书信息');
    const formData = new FormData();
    formData.append('title', bookForm.value.title);
    formData.append('author', bookForm.value.author);
    formData.append('price', bookForm.value.price);
    formData.append('stock', bookForm.value.stock);
    formData.append('description', bookForm.value.description);
    
    if (imageFile.value) {
      console.log('上传新图片:', imageFile.value.name);
      formData.append('image', imageFile.value.raw);
    } else {
      console.log('保留原图片:', bookForm.value.image_url);
    }
    
    const apiUrl = isEdit.value 
      ? `http://localhost:3000/api/books/${bookForm.value.id}`
      : 'http://localhost:3000/api/books';
    
    console.log('请求URL:', apiUrl);
    console.log('请求方法:', isEdit.value ? 'PUT' : 'POST');
    
    const headers = { 
      Authorization: `Bearer ${authStore.token}`,
      'Content-Type': 'multipart/form-data'
    };
    
    console.log('请求头:', headers);
    
    if (isEdit.value) {
      const response = await axios.put(apiUrl, formData, { headers });
      console.log('更新成功，响应数据:', response.data);
      ElMessage.success('图书信息更新成功');
    } else {
      const response = await axios.post(apiUrl, formData, { headers });
      console.log('添加成功，响应数据:', response.data);
      ElMessage.success('图书添加成功');
    }
    dialogVisible.value = false;
    imageFile.value = null;
    loadBooks();
  } catch (error) {
    console.error(isEdit.value ? '更新图书失败:' : '添加图书失败:', error);
    
    // 详细记录错误信息
    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误响应数据:', error.response.data);
      
      // 显示更详细的错误信息
      if (error.response.status === 403) {
        ElMessage.error('权限不足，无法更新图书');
      } else if (error.response.status === 404) {
        ElMessage.error('图书不存在或无权限修改');
      } else if (error.response.data && error.response.data.message) {
        ElMessage.error(error.response.data.message);
      } else {
        ElMessage.error(isEdit.value ? '更新图书失败，服务器错误' : '添加图书失败，服务器错误');
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      ElMessage.error('网络连接失败，请检查服务器是否正常运行');
    } else {
      // 请求设置时出现问题
      ElMessage.error(isEdit.value ? `更新图书失败: ${error.message}` : `添加图书失败: ${error.message}`);
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadBooks();
});
</script>

<style scoped>
.seller-container {
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

.content-section {
  padding: 20px;
}

.section-header {
  margin-bottom: 24px;
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
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input {
  max-width: 300px;
}

.add-book-btn {
  font-weight: 500;
}

.data-table {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.book-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}

.book-desc {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price {
  color: #f56c6c;
  font-weight: 600;
}

.book-form-dialog {
  border-radius: 8px;
}

.book-form {
  padding: 20px 0;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 22px;
}

.form-col {
  flex: 1;
  margin-bottom: 0 !important;
}

.upload-item {
  margin-top: 10px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

.current-image {
  margin-top: 15px;
  padding: 15px;
  border-radius: 6px;
  background-color: #f9fafc;
  text-align: center;
}

.current-image p {
  margin-bottom: 10px;
  font-weight: 500;
  color: #606266;
}

.preview-image {
  max-width: 200px;
  max-height: 280px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.preview-image:hover {
  transform: scale(1.05);
}

.preview-image-large {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 4px;
}

.preview-dialog .el-dialog__body {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
}

.image-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.el-upload-dragger {
  border-radius: 6px;
  border: 2px dashed #dcdfe6;
  transition: all 0.3s;
}

.el-upload-dragger:hover {
  border-color: #409EFF;
}

.el-icon--upload {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 10px;
}

.el-upload__text {
  color: #606266;
  margin-bottom: 5px;
}

.el-upload__text em {
  color: #409EFF;
  font-style: normal;
}

.el-upload-list__item-thumbnail {
  width: 120px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
}

.book-cover-container {
  width: 80px;
  height: 120px;
  overflow: hidden;
  margin: 0 auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.book-cover-container:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.book-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.book-cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.book-cover-placeholder i {
  font-size: 24px;
  opacity: 0.7;
}

.remove-image-btn {
  margin-top: 10px;
}

.empty-state {
  margin: 40px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

@media (max-width: 768px) {
  .seller-container {
    padding: 10px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    max-width: none;
    width: 100%;
    margin-bottom: 10px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .el-dialog {
    width: 95% !important;
    margin: 10px auto !important;
  }
  
  .book-form {
    padding: 10px 0;
  }
}
</style>