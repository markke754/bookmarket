<template>
  <div class="buyer-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-header-title">图书商城</span>
          <div>
            <el-button type="primary" @click="showCart = true" icon="el-icon-shopping-cart-2">
              购物车 <el-badge v-if="cartItems.length > 0" :value="cartItems.length" />
            </el-button>
            <el-button @click="authStore.logout(); $router.push('/login')" icon="el-icon-switch-button">
              退出登录
            </el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="24">
        <el-col v-for="book in books" :key="book.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card :body-style="{ padding: '0px' }" class="book-card" shadow="hover">
            <div class="book-cover">
              <img v-if="book.image_url" :src="getImageUrl(book.image_url)" class="book-cover-image" />
              <div v-else class="book-cover-placeholder"></div>
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
                @click="addToCart(book)" 
                :disabled="book.stock <= 0"
                class="add-to-cart-btn"
              >
                加入购物车
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-empty v-if="books.length === 0" description="暂无图书" />
      
      <el-drawer v-model="showCart" title="购物车" size="30%" :with-header="true">
        <template #header>
          <div class="drawer-header">
            <h3>购物车</h3>
            <el-button v-if="cartItems.length > 0" type="text" @click="cartItems = []">清空</el-button>
          </div>
        </template>
        
        <el-empty v-if="cartItems.length === 0" description="购物车为空" />
        
        <el-table v-else :data="cartItems" style="width: 100%">
          <el-table-column prop="title" label="书名" min-width="120" />
          <el-table-column prop="price" label="单价" width="80">
            <template #default="{ row }">
              <span class="price">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :max="row.stock" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ row }">
              <el-button type="danger" size="small" @click="removeFromCart(row)" icon="el-icon-delete" circle />
            </template>
          </el-table-column>
        </el-table>
        
        <div class="cart-footer" v-if="cartItems.length > 0">
          <div class="total">总计：<span class="total-price">¥{{ total }}</span></div>
          <el-button type="success" @click="checkout" :disabled="cartItems.length === 0">
            结算
          </el-button>
        </div>
      </el-drawer>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const authStore = useAuthStore();
const books = ref([]);
const cartItems = ref([]);
const showCart = ref(false);

const total = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `http://localhost:3000${url}`;
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

function addToCart(book) {
  const existingItem = cartItems.value.find(item => item.id === book.id);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cartItems.value.push({
      ...book,
      quantity: 1
    });
  }
  ElMessage.success('已添加到购物车');
}

function removeFromCart(item) {
  const index = cartItems.value.indexOf(item);
  if (index > -1) {
    cartItems.value.splice(index, 1);
  }
}

async function checkout() {
  try {
    for (const item of cartItems.value) {
      await axios.post('http://localhost:3000/api/orders', {
        book_id: item.id,
        quantity: item.quantity
      }, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
    }
    cartItems.value = [];
    showCart.value = false;
    ElMessage.success('订单创建成功');
    loadBooks();
  } catch (error) {
    ElMessage.error('订单创建失败');
  }
}

onMounted(() => {
  loadBooks();
});
</script>

<style scoped>
.buyer-container {
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

.book-card {
  margin-bottom: 24px;
  transition: transform var(--transition-normal);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-5px);
}

.book-cover {
  height: 160px;
  background-color: var(--background-dark);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: var(--border-radius-small);
}

.book-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--border-radius-small);
}

.book-cover-placeholder {
  width: 100px;
  height: 140px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
  border-radius: var(--border-radius-small);
}

.book-info {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.book-title {
  font-size: 18px;
  margin: 0 0 10px 0;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.book-author {
  color: var(--text-secondary);
  margin: 5px 0;
  font-size: 14px;
}

.book-price {
  color: #e74c3c;
  font-weight: bold;
  font-size: 18px;
  margin: 5px 0;
}

.book-stock {
  color: var(--text-secondary);
  margin: 5px 0 15px 0;
  font-size: 14px;
}

.low-stock {
  color: var(--warning-color);
}

.stock-warning {
  background-color: var(--warning-color);
  color: white;
  padding: 2px 6px;
  border-radius: var(--border-radius-small);
  font-size: 12px;
  margin-left: 5px;
}

.stock-empty {
  background-color: var(--text-light);
  color: white;
  padding: 2px 6px;
  border-radius: var(--border-radius-small);
  font-size: 12px;
  margin-left: 5px;
}

.add-to-cart-btn {
  margin-top: auto;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.drawer-header h3 {
  margin: 0;
  font-size: 18px;
}

.cart-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background-color: #fff;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--box-shadow-light);
}

.total {
  font-size: 16px;
  color: var(--text-primary);
}

.total-price {
  font-size: 20px;
  font-weight: bold;
  color: #e74c3c;
}

.price {
  color: #e74c3c;
  font-weight: bold;
}

@media (max-width: 768px) {
  .buyer-container {
    padding: 10px;
  }
  
  .el-drawer {
    width: 80% !important;
  }
}
</style>