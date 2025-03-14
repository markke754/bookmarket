import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true, role: 'admin' },
  },
  {
    path: '/seller',
    name: 'Seller',
    component: () => import('../views/Seller.vue'),
    meta: { requiresAuth: true, role: 'seller' },
  },
  {
    path: '/buyer',
    name: 'Buyer',
    component: () => import('../views/Buyer.vue'),
    meta: { requiresAuth: true, role: 'buyer' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.role && authStore.userRole !== to.meta.role) {
    next('/');
  } else {
    next();
  }
});

export default router;