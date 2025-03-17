import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '图书商城 - 首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '图书商城 - 登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { title: '图书商城 - 注册' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, role: 'admin', title: '图书商城 - 管理员控制台' },
  },
  {
    path: '/seller',
    name: 'Seller',
    component: () => import('../views/Seller.vue'),
    meta: { requiresAuth: true, role: 'seller', title: '图书商城 - 卖家中心' },
  },
  {
    path: '/buyer',
    name: 'Buyer',
    component: () => import('../views/Buyer.vue'),
    meta: { requiresAuth: true, role: 'buyer', title: '图书商城 - 买家中心' },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: { title: '图书商城 - 关于我们' }
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('../views/Help.vue'),
    meta: { title: '图书商城 - 帮助中心' }
  },
  // 添加一个兜底路由，处理所有未匹配的路径
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 每次导航前重新获取最新的auth状态
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.userRole;
  
  // 设置页面标题
  document.title = to.meta.title || '图书商城';
  
  // 记录导航日志，帮助调试
  console.log(`路由导航: 从 ${from.path} 到 ${to.path}`);
  console.log(`认证状态: ${isAuthenticated}, 角色: ${userRole}`);
  
  // 如果已经登录且要去登录页，则重定向到对应角色的页面
  if (to.path === '/login' && isAuthenticated && userRole) {
    console.log(`已登录，重定向到: /${userRole}`);
    next(`/${userRole}`);
    return;
  }
  
  // 需要授权的页面，如果未认证则重定向到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('需要授权但未登录，重定向到登录页');
    next('/login');
    return;
  }
  
  // 角色不匹配，重定向到首页
  if (to.meta.role && userRole !== to.meta.role) {
    console.log(`角色不匹配: 需要 ${to.meta.role}, 实际为 ${userRole}, 重定向到首页`);
    next('/');
    return;
  }
  
  // 其他情况正常导航
  next();
});

export default router;