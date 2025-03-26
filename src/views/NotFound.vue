<template>
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="error-code">404</div>
        <h1>Trang không tìm thấy</h1>
        <p>Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        
        <div class="actions">
          <router-link to="/" class="btn-home">
            <i class="fas fa-home"></i> Về trang chủ
          </router-link>
          <button @click="goBack" class="btn-back">
            <i class="fas fa-arrow-left"></i> Quay lại
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  import { useRouter } from 'vue-router'
  
  export default defineComponent({
    name: 'NotFoundView',
    setup() {
      const router = useRouter()
  
      const goBack = () => {
        router.go(-1)
      }
  
      return {
        goBack
      }
    }
  })
  </script>
  
  <style scoped>
  .not-found-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f7fa;
    padding: 2rem;
  }
  
  .not-found-content {
    text-align: center;
    background-color: white;
    padding: 3rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    max-width: 500px;
    width: 100%;
  }
  
  .error-code {
    font-size: 8rem;
    font-weight: bold;
    color: #4361ee;
    margin-bottom: 1rem;
  }
  
  h1 {
    font-size: 2rem;
    color: #333;
    margin-bottom: 1rem;
  }
  
  p {
    color: #666;
    margin-bottom: 2rem;
    line-height: 1.6;
  }
  
  .actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  
  .btn-home, 
  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    text-decoration: none;
    transition: all 0.3s;
  }
  
  .btn-home {
    background-color: #4361ee;
    color: white;
  }
  
  .btn-home:hover {
    background-color: #3a56d4;
  }
  
  .btn-back {
    background-color: #f1f5f9;
    color: #4361ee;
  }
  
  .btn-back:hover {
    background-color: #e2e8f0;
  }
  
  .btn-home i, 
  .btn-back i {
    font-size: 1rem;
  }
  
  @media (max-width: 576px) {
    .not-found-content {
      padding: 2rem;
    }
  
    .error-code {
      font-size: 5rem;
    }
  
    h1 {
      font-size: 1.5rem;
    }
  
    .actions {
      flex-direction: column;
    }
  
    .btn-home, 
    .btn-back {
      width: 100%;
      justify-content: center;
    }
  }
  </style>