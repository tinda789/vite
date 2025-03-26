import api from './api'

export default {
  getAllTasks() {
    return api.get('/tasks')
  },
  getTasksCreatedByMe() {
    return api.get('/tasks/created-by-me')
  },
  getTasksAssignedToMe() {
    return api.get('/tasks/assigned-to-me')
  },
  getTasksByWorkspace(workspaceId: number) {
    return api.get(`/tasks/workspace/${workspaceId}`)
  },
  getTasksByDepartment(departmentId: number) {
    return api.get(`/tasks/department/${departmentId}`)
  },
  getTasksByStatus(status: string) {
    return api.get(`/tasks/status/${status}`)
  },
  getTaskById(id: number) {
    return api.get(`/tasks/${id}`)
  },
  createTask(taskData: any) {
    return api.post('/tasks', taskData)
  },
  updateTask(id: number, taskData: any) {
    return api.put(`/tasks/${id}`, taskData)
  },
  updateTaskStatus(id: number, status: string) {
    return api.put(`/tasks/${id}/status?status=${status}`)
  },
  updateTaskProgress(id: number, progress: number) {
    return api.put(`/tasks/${id}/progress?progress=${progress}`)
  }
}