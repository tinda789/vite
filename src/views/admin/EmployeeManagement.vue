<template>
    <app-layout>
      <div class="container-fluid my-3">
        <h1>Quản lý nhân viên (Admin)</h1>
        <!-- Nội dung sẽ được phát triển sau -->
      </div>
    </app-layout>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  import AppLayout from '../../components/layout/AppLayout.vue'
  
  export default defineComponent({
    name: 'EmployeeManagementView',
    components: {
      AppLayout
    }
  })
  </script>