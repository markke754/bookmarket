<template>
  <div class="shopping-cart">
    <LoadingIndicator :loading="loading" text="处理中..." />
    <div class="cart-header">
      <h3>购物车</h3>
      <el-button type="danger" size="small" @click="clearCart" :disabled="!cartItems.length">
        清空购物车
      </el-button>
    </div>
    
    <div v-if="!cartItems.length" class="empty-cart">
      <el-empty description="购物车为空" />
    </div>
    
    <div v-else class="cart-items">
      <div v-for="(item, index) in cartItems" :key="index" class="cart-item">
        <div class="item-image">
          <img :src="getImageUrl(item.image)" alt="书籍封面" />
        </div>
        <div class="item-details">
          <div class="item-title">{{ item.title }}</div>
          <div class="item-price">¥{{ item.price }}</div>
          <div class="item-quantity">
            <el-button size="small" @click="decreaseQuantity(index)" :disabled="item.quantity <= 1">-</el-button>
            <span>{{ item.quantity }}</span>
            <el-button size="small" @click="increaseQuantity(index)">+</el-button>
            <el-button type="danger" size="small" @click="removeItem(index)" class="remove-button">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="cart-footer" v-if="cartItems.length">
      <div class="cart-total">
        <span>总计:</span>
        <span class="total-price">¥{{ total }}</span>
      </div>
      <el-button type="primary" @click="checkout" :loading="loading">结算</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useCartStore } from '../stores/cart';
import { ElMessage, ElMessageBox } from 'element-plus';
import LoadingIndicator from './LoadingIndicator.vue';

const cartStore = useCartStore();
const cartItems = computed(() => cartStore.items);
const loading = ref(false);

const total = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
});

function getImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return `${import.meta.env.VITE_API_URL}/${image}`;
}

function increaseQuantity(index) {
  cartStore.updateQuantity(index, cartItems.value[index].quantity + 1);
}

function decreaseQuantity(index) {
  if (cartItems.value[index].quantity > 1) {
    cartStore.updateQuantity(index, cartItems.value[index].quantity - 1);
  }
}

function removeItem(index) {
  cartStore.removeItem(index);
  ElMessage.success('商品已从购物车中移除');
}

function clearCart() {
  ElMessageBox.confirm('确定要清空购物车吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    cartStore.clearCart();
    ElMessage.success('购物车已清空');
  }).catch(() => {});
}

function checkout() {
  if (cartItems.value.length === 0) {
    ElMessage.warning('购物车为空，无法结算');
    return;
  }
  
  loading.value = true;
  try {
    emit('checkout');
  } catch (error) {
    console.error('结算处理错误:', error);
    ElMessage.error('结算过程中发生错误');
  } finally {
    loading.value = false;
  }
}

const emit = defineEmits(['checkout']);
</script>

<style scoped>
.shopping-cart {
  position: relative;
  padding: 15px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.cart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.empty-cart {
  padding: 30px 0;
  text-align: center;
}

.cart-items {
  max-height: 400px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.item-image {
  width: 80px;
  height: 100px;
  margin-right: 15px;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
}

.item-price {
  color: #e6a23c;
  font-weight: bold;
  margin-bottom: 10px;
}

.item-quantity {
  display: flex;
  align-items: center;
}

.item-quantity span {
  margin: 0 10px;
  min-width: 20px;
  text-align: center;
}

.remove-button {
  margin-left: auto;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.cart-total {
  font-size: 16px;
}

.total-price {
  font-weight: bold;
  color: #f56c6c;
  margin-left: 5px;
}

@media (max-width: 768px) {
  .item-image {
    width: 60px;
    height: 80px;
  }
  
  .item-quantity button {
    padding: 4px 8px;
  }
  
  .remove-button {
    margin-left: 5px;
  }
}
</style> 