import { ref, reactive, inject } from 'vue'
import { api } from '../lib/api'

/**
 * useCrud — รวม pattern ของหน้า CRUD (list + dialog + form + save + delete)
 * ที่เคยเขียนซ้ำในแทบทุก view ของฝ่ายบุคลากร
 *
 *   const { items, dialog, form, load, openCreate, openEdit, save, remove } = useCrud('/evaluations', { title: '', description: '' })
 *   load()              // โหลดรายการ → items (รับ query string เช่น load('?period_id=1'))
 *   openCreate()        // เปิด dialog โหมดสร้าง (reset form)
 *   openEdit(row)       // เปิด dialog โหมดแก้ไข (เติม form จาก row)
 *   save(formRef)       // validate + POST/PUT + แจ้งเตือน + reload
 *   remove(id)          // DELETE + reload
 *
 * state ที่คืน: items, loading, saving, dialog, editId, form, isEdit()
 */
export const useCrud = (endpoint, blankForm = {}, options = {}) => {
  const idKey = options.idKey || 'id'
  const notify = inject('showSnackbar')
  const confirm = inject('confirm')

  const items = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const dialog = ref(false)
  const editId = ref(null)
  const form = reactive({ ...blankForm })

  const isEdit = () => editId.value !== null

  const load = async (params = '') => {
    loading.value = true
    try {
      const { data } = await api.get(endpoint + params)
      items.value = data.data || []
    } catch (e) {
      notify?.(e.response?.data?.message || 'โหลดข้อมูลไม่สำเร็จ', 'error')
    } finally {
      loading.value = false
    }
  }

  const resetForm = (row = null) => Object.assign(form, blankForm, row || {})

  const openCreate = (preset = {}) => {
    editId.value = null
    resetForm(preset)
    dialog.value = true
  }

  const openEdit = (row) => {
    editId.value = row[idKey]
    resetForm(row)
    dialog.value = true
  }

  // คืน true ถ้าบันทึกสำเร็จ (เผื่อ caller อยากทำอย่างอื่นต่อ)
  const save = async (formRef) => {
    if (formRef) {
      const { valid } = await formRef.validate()
      if (!valid) return false
    }
    saving.value = true
    try {
      if (isEdit()) await api.put(`${endpoint}/${editId.value}`, form)
      else await api.post(endpoint, form)
      dialog.value = false
      notify?.(isEdit() ? 'แก้ไขสำเร็จ' : 'บันทึกสำเร็จ')
      await load()
      return true
    } catch (e) {
      notify?.(e.response?.data?.message || 'เกิดข้อผิดพลาด', 'error')
      return false
    } finally {
      saving.value = false
    }
  }

  // remove(id) ลบทันที | remove(id, 'ข้อความ') หรือ remove(id, {opts}) จะถามยืนยันก่อน
  const remove = async (id, confirmOpts = null) => {
    if (confirmOpts && confirm && !(await confirm(confirmOpts))) return false
    try {
      await api.delete(`${endpoint}/${id}`)
      notify?.('ลบสำเร็จ')
      await load()
      return true
    } catch (e) {
      notify?.(e.response?.data?.message || 'ลบไม่สำเร็จ', 'error')
      return false
    }
  }

  return { items, loading, saving, dialog, editId, form, isEdit, load, resetForm, openCreate, openEdit, save, remove }
}
