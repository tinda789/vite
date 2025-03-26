import api from './api'

export default {
  getCurrentUser() {
    return api.get('/user/info')
  },
  updateProfile(profileData: any) {
    return api.put('/user/profile', profileData)
  },
  changePassword(passwordData: any) {
    return api.put('/user/password', passwordData)
  },
  // Admin endpoints
  getAllUsers() {
    return api.get('/admin/users')
  },
  getUserById(id: number) {
    return api.get(`/admin/users/${id}`)
  },
  createUser(userData: any) {
    return api.post('/admin/users', userData)
  },
  updateUser(id: number, userData: any) {
    return api.put(`/admin/users/${id}`, userData)
  },
  deleteUser(id: number) {
    return api.delete(`/admin/users/${id}`)
  },
  updateUserStatus(id: number, status: number) {
    return api.put(`/admin/users/${id}/status?status=${status}`)
  },
  updateUserRoles(id: number, roleNames: string[]) {
    return api.put(`/admin/users/${id}/roles`, roleNames)
  },
  // Thêm vào UserService.ts
  getUserStats() {
  return api.get('/admin/users/stats');
}
}