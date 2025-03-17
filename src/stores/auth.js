import { defineStore } from 'pinia';
import axios from 'axios';
import router from '../router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')),
    loading: false,
    error: null
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role,
    userId: (state) => state.user?.id,
    username: (state) => state.user?.username,
  },
  
  actions: {
    setError(error) {
      this.error = error;
      // 5秒后自动清除错误
      setTimeout(() => {
        this.error = null;
      }, 5000);
    },
    
    async login(username, password, role) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('http://localhost:3000/api/login', {
          username,
          password,
        });
        
        const data = response.data;
        
        // 验证用户角色是否匹配
        if (data.user.role !== role) {
          this.setError(`登录失败: 您不是${role === 'buyer' ? '买家' : role === 'seller' ? '卖家' : '管理员'}`);
          this.loading = false;  // 确保在返回前重置loading状态
          return false;
        }
        
        this.token = data.token;
        this.user = data.user;
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        // 配置全局axios默认头部
        this.setAxiosDefaultHeader();
        
        this.loading = false;  // 确保在成功返回前重置loading状态
        return true;
      } catch (error) {
        console.error('登录失败:', error);
        
        if (error.response) {
          // 服务器返回错误
          const message = error.response.data.message || '登录失败';
          this.setError(`登录失败: ${message}`);
        } else if (error.request) {
          // 请求已发出但没有收到响应
          this.setError('登录失败: 服务器无响应');
        } else {
          // 请求设置出错
          this.setError(`登录失败: ${error.message}`);
        }
        
        this.loading = false;  // 确保在失败返回前重置loading状态
        return false;
      } finally {
        // 确保无论如何都重置loading状态
        this.loading = false;
      }
    },
    
    async register(userData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post('http://localhost:3000/api/register', userData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return { success: true, message: response.data.message };
      } catch (error) {
        console.error('注册失败:', error.response?.data || error);
        
        if (error.response) {
          // 服务器返回错误
          const message = error.response.data.message || '注册失败';
          this.setError(`注册失败: ${message}`);
        } else if (error.request) {
          // 请求已发出但没有收到响应
          this.setError('注册失败: 服务器无响应');
        } else {
          // 请求设置出错
          this.setError(`注册失败: ${error.message}`);
        }
        
        return { 
          success: false, 
          message: error.response?.data?.message || '注册失败，请稍后重试'
        };
      } finally {
        this.loading = false;
      }
    },
    
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 清除全局axios默认头部
      delete axios.defaults.headers.common['Authorization'];
      
      // 重定向到登录页
      router.push('/login');
    },
    
    // 自动恢复会话（如果有存储的token）
    autoLogin() {
      if (this.token && this.user) {
        // 配置全局axios默认头部
        this.setAxiosDefaultHeader();
        return true;
      }
      return false;
    },
    
    // 设置全局axios默认头部
    setAxiosDefaultHeader() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    },
    
    // 检查token是否过期
    async checkTokenValidity() {
      if (!this.token) return false;
      
      try {
        // 调用一个简单的API端点来验证token
        await axios.get('http://localhost:3000/api/health', {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        });
        return true;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // token已过期，执行登出
          this.logout();
        }
        return false;
      }
    }
  },
});