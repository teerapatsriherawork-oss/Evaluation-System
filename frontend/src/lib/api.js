import axios from 'axios'

/**
 * axios instance กลางของทั้งแอป
 * - baseURL '/api' (proxy ไป backend ผ่าน vite.config)
 * - withCredentials: ส่ง httpOnly cookie (JWT) อัตโนมัติทุก request
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

// ถ้า token หมดอายุ/ไม่ผ่าน (401) → ล้าง session แล้วเด้งไปหน้า login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.removeItem('user')
      location.href = '/login'
    }
    return Promise.reject(err)
  }
)
