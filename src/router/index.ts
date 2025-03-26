import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

// Lazy loading routes
const Home = () => import('../views/Home.vue')
const Login = () => import('../views/auth/Login.vue')
const Register = () => import('../views/auth/Register.vue')
const ForgotPassword = () => import('../views/auth/ForgotPassword.vue')
const Profile = () => import('../views/user/Profile.vue')

const routes = [
  {
    path: '/',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/register',
    component: Register
  },
  {
    path: '/forgot-password',
    component: ForgotPassword
  },
  {
    path: '/profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  
  // Company routes
  {
    path: '/companies',
    component: () => import('../views/company/CompanyList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/companies/:id',
    component: () => import('../views/company/CompanyDetail.vue'),
    meta: { requiresAuth: true }
  },
  
  // Department routes
  {
    path: '/departments',
    component: () => import('../views/department/DepartmentList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/departments/:id',
    component: () => import('../views/department/DepartmentDetail.vue'),
    meta: { requiresAuth: true }
  },
  
  // Employee routes
  {
    path: '/employees',
    component: () => import('../views/employee/EmployeeList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/employees/:id',
    component: () => import('../views/employee/EmployeeDetail.vue'),
    meta: { requiresAuth: true }
  },
  
  // Task routes
  {
    path: '/tasks',
    component: () => import('../views/task/TaskList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks/:id',
    component: () => import('../views/task/TaskDetail.vue'),
    meta: { requiresAuth: true }
  },
  
  // Admin routes
  {
    path: '/admin',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    component: () => import('../views/admin/UserManagement.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  
  // Not found
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (requiresAdmin && !authStore.isAdmin) {
    next('/')
  } else {
    next()
  }
})

export default router