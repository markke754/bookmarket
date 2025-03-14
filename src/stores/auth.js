import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role,
  },
  
  actions: {
    async login(username, password) {
      try {
        const response = await axios.post('http://localhost:3000/api/login', {
          username,
          password,
        });
        
        this.token = response.data.token;
        this.user = response.data.user;
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return true;
      } catch (error) {
        console.error('登录失败:', error);
        return false;
      }
    },
    
    async register(userData) {
      try {
        const response = await axios.post('http://localhost:3000/api/register', userData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('注册响应:', response.data);
        return { success: true, message: response.data.message };
      } catch (error) {
        console.error('注册失败:', error.response?.data || error);
        return { 
          success: false, 
          message: error.response?.data?.message || '注册失败，请稍后重试'
        };
      }
    },
    
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});