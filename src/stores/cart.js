import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useCartStore = defineStore('cart', () => {
  // 从本地存储加载购物车数据
  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  };

  const items = ref(loadCartFromStorage());
  
  // 监听购物车变化并保存到本地存储
  watch(items, (newItems) => {
    localStorage.setItem('cart', JSON.stringify(newItems));
  }, { deep: true });

  // 添加商品到购物车
  function addItem(item) {
    const existingItemIndex = items.value.findIndex(
      (cartItem) => cartItem.id === item.id
    );

    if (existingItemIndex !== -1) {
      // 如果商品已存在，增加数量
      items.value[existingItemIndex].quantity += 1;
    } else {
      // 否则添加新商品
      items.value.push({
        ...item,
        quantity: 1
      });
    }
  }

  // 从购物车移除商品
  function removeItem(index) {
    items.value.splice(index, 1);
  }

  // 更新商品数量
  function updateQuantity(index, quantity) {
    if (index >= 0 && index < items.value.length) {
      items.value[index].quantity = quantity;
    }
  }

  // 清空购物车
  function clearCart() {
    items.value = [];
  }

  // 获取购物车中的商品总数
  const totalItems = () => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0);
  };

  // 获取购物车中的商品总价
  const totalPrice = () => {
    return items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  };
}); 