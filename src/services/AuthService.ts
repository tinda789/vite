import api from './api'

export default {
  login(username: string, password: string) {
    return api.post('/auth/signin', { username, password })
  },
  register(userData: any) {
    return api.post('/auth/signup', userData)
  },
  forgotPassword(email: string) {
    return api.post('/auth/forgot-password', { email })
  },
  resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return api.post('/auth/reset-password', {
      token,
      newPassword,
      confirmPassword
    })
  },
  setup2FA() {
    return api.post('/auth/2fa/setup')
  },
  enable2FA(verificationCode: string) {
    return api.post('/auth/2fa/enable', { verificationCode })
  },
  disable2FA(verificationCode: string) {
    return api.post('/auth/2fa/disable', { verificationCode })
  }
}