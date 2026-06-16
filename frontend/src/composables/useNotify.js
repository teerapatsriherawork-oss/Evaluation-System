import { inject } from 'vue'

/**
 * useNotify — ห่อ showSnackbar ที่ provide จาก App.vue ให้เรียกง่าย
 *   const { success, error, notify } = useNotify()
 *   success('บันทึกสำเร็จ'); error('ผิดพลาด')
 */
export const useNotify = () => {
  const snackbar = inject('showSnackbar')
  return {
    notify: (text, color = 'success') => snackbar?.(text, color),
    success: (text = 'สำเร็จ') => snackbar?.(text, 'success'),
    error: (text = 'เกิดข้อผิดพลาด') => snackbar?.(text, 'error')
  }
}
