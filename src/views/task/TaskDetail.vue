<template>
    <app-layout>
      <div class="task-detail-page">
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
  
        <div v-else-if="error" class="error-container">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h2>Có lỗi xảy ra</h2>
          <p>{{ error }}</p>
        </div>
  
        <div v-else-if="task" class="task-detail-content">
          <div class="task-header">
            <div class="task-title-section">
              <h1>{{ task.title }}</h1>
              <div class="task-meta">
                <span 
                  class="task-status" 
                  :class="getStatusClass(task.status)"
                >
                  {{ getStatusLabel(task.status) }}
                </span>
                <span 
                  class="task-priority" 
                  :class="getPriorityClass(task.priority)"
                >
                  {{ getPriorityLabel(task.priority) }}
                </span>
              </div>
            </div>
  
            <div class="task-actions">
              <button 
                v-if="task.status !== 'DONE'" 
                class="btn-complete"
                @click="completeTask"
              >
                <i class="fas fa-check"></i> Hoàn thành
              </button>
              <button 
                class="btn-edit"
                @click="openEditModal"
              >
                <i class="fas fa-edit"></i> Chỉnh sửa
              </button>
            </div>
          </div>
  
          <div class="task-details">
            <div class="section description">
              <h3>Mô tả</h3>
              <p>{{ task.description || 'Không có mô tả' }}</p>
            </div>
  
            <div class="section task-info">
              <div class="info-grid">
                <div class="info-item">
                  <i class="fas fa-calendar-alt"></i>
                  <div>
                    <span class="label">Ngày đến hạn</span>
                    <p>{{ formatDate(task.dueDate) }}</p>
                  </div>
                </div>
  
                <div class="info-item">
                  <i class="fas fa-percent"></i>
                  <div>
                    <span class="label">Tiến độ</span>
                    <p>{{ task.progress }}%</p>
                  </div>
                </div>
  
                <div class="info-item">
                  <i class="fas fa-user-tie"></i>
                  <div>
                    <span class="label">Người thực hiện</span>
                    <p>{{ assigneeName }}</p>
                  </div>
                </div>
  
                <div class="info-item">
                  <i class="fas fa-building"></i>
                  <div>
                    <span class="label">Không gian làm việc</span>
                    <p>{{ workspace?.name || 'Chưa chọn' }}</p>
                  </div>
                </div>
  
                <div class="info-item">
                  <i class="fas fa-sitemap"></i>
                  <div>
                    <span class="label">Phòng ban</span>
                    <p>{{ department?.name || 'Chưa chọn' }}</p>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="section progress-tracking">
              <h3>Theo dõi tiến độ</h3>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${task.progress}%` }"
                ></div>
              </div>
              <div class="progress-actions">
                <button 
                  class="btn-update-progress" 
                  @click="openProgressModal"
                >
                  Cập nhật tiến độ
                </button>
              </div>
            </div>
  
            <div class="section comments">
              <h3>Bình luận</h3>
              <div class="comments-list">
                <div 
                  v-for="comment in task.comments" 
                  :key="comment.id" 
                  class="comment-item"
                >
                  <div class="comment-avatar">
                    <img 
                      v-if="comment.user?.profileImage" 
                      :src="comment.user.profileImage" 
                      :alt="comment.user.fullName"
                    />
                    <div v-else class="avatar-placeholder">
                      {{ getInitials(comment.user.fullName) }}
                    </div>
                  </div>
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">
                        {{ comment.user.fullName }}
                      </span>
                      <span class="comment-date">
                        {{ formatDateTime(comment.createdAt) }}
                      </span>
                    </div>
                    <p>{{ comment.content }}</p>
                  </div>
                </div>
              </div>
              <div class="add-comment">
                <textarea 
                  v-model="newComment" 
                  placeholder="Nhập bình luận..."
                ></textarea>
                <button @click="addComment">Gửi</button>
              </div>
            </div>
  
            <div class="section attachments">
              <h3>Tệp đính kèm</h3>
              <div 
                v-if="task.attachments && task.attachments.length" 
                class="attachments-list"
              >
                <div 
                  v-for="attachment in task.attachments" 
                  :key="attachment.id" 
                  class="attachment-item"
                >
                  <i class="fas fa-file"></i>
                  <div class="attachment-info">
                    <span>{{ attachment.fileName }}</span>
                    <span class="attachment-meta">
                      {{ formatFileSize(attachment.fileSize) }} - 
                      {{ formatDateTime(attachment.uploadedAt) }}
                    </span>
                  </div>
                  <a 
                    :href="attachment.filePath" 
                    target="_blank" 
                    class="btn-download"
                  >
                    <i class="fas fa-download"></i>
                  </a>
                </div>
              </div>
              <div v-else class="no-attachments">
                Không có tệp đính kèm
              </div>
              <button 
                class="btn-upload-attachment" 
                @click="openAttachmentModal"
              >
                <i class="fas fa-paperclip"></i> Tải tệp
              </button>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import AppLayout from '../../components/layout/AppLayout.vue'
  import TaskService from '../../services/TaskService'
  import WorkspaceService from '../../services/WorkspaceService'
  import DepartmentService from '../../services/DepartmentService'
  import EmployeeService from '../../services/EmployeeService'
  
  export default defineComponent({
    name: 'TaskDetailView',
    components: {
      AppLayout
    },
    setup() {
      const route = useRoute()
      const taskId = ref(Number(route.params.id))
      
      const task = ref(null)
      const workspace = ref(null)
      const department = ref(null)
      const assignee = ref(null)
      
      const loading = ref(true)
      const error = ref('')
      
      const newComment = ref('')
      
      const assigneeName = computed(() => {
        return assignee.value 
          ? assignee.value.user.fullName 
          : 'Chưa phân công'
      })
      
      const fetchTaskDetails = async () => {
        loading.value = true
        try {
          // Lấy thông tin nhiệm vụ
          const taskResponse = await TaskService.getTaskById(taskId.value)
          task.value = taskResponse.data
          
          // Lấy thông tin không gian làm việc
          if (task.value.workspaceId) {
            const workspaceResponse = await WorkspaceService.getWorkspaceById(task.value.workspaceId)
            workspace.value = workspaceResponse.data
          }
          
          // Lấy thông tin phòng ban
          if (task.value.departmentId) {
            const departmentResponse = await DepartmentService.getDepartmentById(task.value.departmentId)
            department.value = departmentResponse.data
          }
          
          // Lấy thông tin người thực hiện
          if (task.value.assigneeId) {
            const assigneeResponse = await EmployeeService.getEmployeeById(task.value.assigneeId)
            assignee.value = assigneeResponse.data
          }
          
        } catch (err) {
          console.error('Lỗi tải chi tiết nhiệm vụ:', err)
          error.value = 'Không thể tải thông tin nhiệm vụ'
        } finally {
          loading.value = false
        }
      }
      
      const getStatusLabel = (status) => {
        const statusLabels = {
          'TODO': 'Chưa bắt đầu',
          'IN_PROGRESS': 'Đang thực hiện',
          'REVIEW': 'Đang kiểm duyệt',
          'DONE': 'Hoàn thành',
          'CANCELLED': 'Đã hủy'
        }
        return statusLabels[status] || status
      }
      
      const getPriorityLabel = (priority) => {
        const priorityLabels = {
          'LOW': 'Thấp',
          'MEDIUM': 'Trung bình',
          'HIGH': 'Cao',
          'URGENT': 'Khẩn cấp'
        }
        return priorityLabels[priority] || priority
      }
      
      const getStatusClass = (status) => {
        const statusClasses = {
          'TODO': 'status-todo',
          'IN_PROGRESS': 'status-in-progress',
          'REVIEW': 'status-review',
          'DONE': 'status-done',
          'CANCELLED': 'status-cancelled'
        }
        return statusClasses[status] || ''
      }
      
      const getPriorityClass = (priority) => {
        const priorityClasses = {
          'LOW': 'priority-low',
          'MEDIUM': 'priority-medium',
          'HIGH': 'priority-high',
          'URGENT': 'priority-urgent'
        }
        return priorityClasses[priority] || ''
      }
      
      const formatDate = (dateString) => {
        return dateString 
          ? new Date(dateString).toLocaleDateString('vi-VN') 
          : 'Không có hạn'
      }
      
      const formatDateTime = (dateString) => {
        return dateString 
          ? new Date(dateString).toLocaleString('vi-VN') 
          : 'Chưa xác định'
      }
      
      const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }
      
      const getInitials = (fullName) => {
        if (!fullName) return 'NV'
        return fullName.split(' ')
          .map(word => word[0])
          .join('')
          .substring(0, 2)
          .toUpperCase()
      }
      
      const completeTask = async () => {
        try {
          await TaskService.updateTaskStatus(taskId.value, 'DONE')
          await fetchTaskDetails()
        } catch (err) {
          console.error('Lỗi hoàn thành nhiệm vụ:', err)
          error.value = 'Không thể hoàn thành nhiệm vụ'
        }
      }
      
      const openEditModal = () => {
        // Implement edit task modal logic
      }
      
      const addComment = async () => {
        if (!newComment.value.trim()) return
        
        try {
          await TaskService.addTaskComment(taskId.value, {
            content: newComment.value
          })
          newComment.value = ''
          await fetchTaskDetails()
        } catch (err) {
          console.error('Lỗi thêm bình luận:', err)
          error.value = 'Không thể thêm bình luận'
        }
      }
      
      const openProgressModal = () => {
        // Implement update progress modal logic
      }
      
      const openAttachmentModal = () => {
        // Implement upload attachment modal logic
      }
      
      onMounted(fetchTaskDetails)
      
      return {
        task,
        workspace,
        department,
        assignee,
        loading,
        error,
        newComment,
        assigneeName,
        getStatusLabel,
        getPriorityLabel,
        getStatusClass,
        getPriorityClass,
        formatDate,
        formatDateTime,
        formatFileSize,
        getInitials,
        completeTask,
        openEditModal,
        addComment,
        openProgressModal,
        openAttachmentModal
      }
    }
  })
  </script>
  
  