import api from './api'

export default {
  getAllWorkspaces() {
    return api.get('/workspaces')
  },
  getActiveWorkspaces() {
    return api.get('/workspaces/active')
  },
  getWorkspacesByDepartment(departmentId: number) {
    return api.get(`/workspaces/department/${departmentId}`)
  },
  getWorkspaceById(id: number) {
    return api.get(`/workspaces/${id}`)
  },
  createWorkspace(workspaceData: any) {
    return api.post('/workspaces', workspaceData)
  },
  updateWorkspace(id: number, workspaceData: any) {
    return api.put(`/workspaces/${id}`, workspaceData)
  },
  deleteWorkspace(id: number) {
    return api.delete(`/workspaces/${id}`)
  }
}