<template>
    <div>
      <h1>Debug User Info</h1>
      <pre>{{ userInfo }}</pre>
    </div>
  </template>
  
  <script>
  import { defineComponent, computed } from 'vue';
  import { useAuthStore } from '../store/auth';
  
  export default defineComponent({
    setup() {
      const authStore = useAuthStore();
      const userInfo = computed(() => ({
        user: authStore.user,
        isAuthenticated: authStore.isAuthenticated,
        isAdmin: authStore.isAdmin
      }));
  
      return {
        userInfo
      };
    }
  });
  </script>