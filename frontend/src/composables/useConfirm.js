import { inject } from 'vue'

/**
 * useConfirm — กล่องยืนยันกลาง (provide จาก App.vue) คืน Promise<boolean>
 *   const confirm = useConfirm()
 *   if (await confirm('ลบรายการนี้?')) { ...ลบ... }
 *   if (await confirm({ title:'กู้คืนข้อมูล', message:'จะเขียนทับทั้งหมด', confirmText:'กู้คืน' })) { ... }
 */
export const useConfirm = () => inject('confirm')
