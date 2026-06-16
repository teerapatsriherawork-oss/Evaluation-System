<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text">จัดการรอบประเมิน</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">เพิ่มหัวข้อการประเมิน กำหนดช่วงเวลาเปิด-ปิดระบบ</p>
      </div>
      <v-spacer />
      <v-btn class="gradient-btn" @click="openDialog()" id="btn-add-period">
        <v-icon start>mdi-plus</v-icon> สร้างรอบประเมิน
      </v-btn>
    </div>

    <!-- Period Cards -->
    <v-row>
      <v-col v-for="p in periods" :key="p.id" cols="12" md="6" lg="4">
        <v-card class="glass-card hover-card pa-5">
          <div class="d-flex align-center mb-3">
            <v-icon color="primary" class="mr-2">mdi-clipboard-text</v-icon>
            <span class="text-h6 font-weight-medium flex-grow-1">{{ p.title }}</span>
            <v-chip :color="p.is_active ? 'success' : 'grey'" size="small" label class="pulse-dot">
              {{ p.is_active ? 'เปิด' : 'ปิด' }}
            </v-chip>
          </div>
          <p class="text-body-2 text-medium-emphasis mb-3">{{ p.description || 'ไม่มีรายละเอียด' }}</p>
          <div class="d-flex align-center text-body-2 text-medium-emphasis mb-4">
            <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
            {{ formatDate(p.start_date) }} — {{ formatDate(p.end_date) }}
          </div>
          <div class="d-flex ga-2">
            <v-btn size="small" color="secondary" variant="tonal" :to="`/hr/indicators/${p.id}`" rounded="lg">
              <v-icon start size="small">mdi-format-list-numbered</v-icon> ตัวชี้วัด
            </v-btn>
            <v-btn size="small" :color="p.is_active ? 'error' : 'success'" variant="tonal" @click="togglePeriod(p)" rounded="lg">
              <v-icon start size="small">{{ p.is_active ? 'mdi-pause' : 'mdi-play' }}</v-icon>
              {{ p.is_active ? 'ปิด' : 'เปิด' }}
            </v-btn>
            <v-btn size="small" variant="tonal" @click="openDialog(p)" rounded="lg" icon="mdi-pencil" />
            <v-btn size="small" color="error" variant="tonal" @click="confirmDelete(p)" rounded="lg" icon="mdi-delete" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty state -->
    <v-card v-if="periods.length === 0 && !loading" class="glass-card pa-10 text-center">
      <v-icon size="80" color="primary" class="mb-4">mdi-clipboard-plus</v-icon>
      <h3 class="text-h5 mb-2">ยังไม่มีรอบประเมิน</h3>
      <p class="text-medium-emphasis mb-4">เริ่มต้นสร้างรอบประเมินแรกของคุณ</p>
      <v-btn class="gradient-btn" @click="openDialog()"><v-icon start>mdi-plus</v-icon> สร้างรอบประเมิน</v-btn>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="550" persistent>
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="text-h5 font-weight-bold gradient-text pa-0 mb-4">
          {{ editMode ? 'แก้ไขรอบประเมิน' : 'สร้างรอบประเมินใหม่' }}
        </v-card-title>
        <v-form @submit.prevent="saveEvaluation" ref="formRef">
          <v-text-field v-model="form.title" label="ชื่อรอบประเมิน *" :rules="[r => !!r || 'กรุณากรอก']" class="mb-2" id="eval-title" />
          <v-textarea v-model="form.description" label="รายละเอียด" rows="2" class="mb-2" id="eval-desc" />
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.start_date" label="วันเริ่มต้น *" type="date" :rules="[r => !!r || 'กรุณาเลือก']" id="eval-start" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.end_date" label="วันสิ้นสุด *" type="date" :rules="[r => !!r || 'กรุณาเลือก']" id="eval-end" />
            </v-col>
          </v-row>
          <v-switch v-model="form.is_active" label="เปิดใช้งานทันที" color="success" class="mb-2" />
          <div class="d-flex ga-2 justify-end">
            <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
            <v-btn type="submit" class="gradient-btn" :loading="saving" id="eval-save">บันทึก</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Confirm Delete -->
    <v-dialog v-model="confirmDlg" max-width="400">
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="text-h6 font-weight-bold text-error pa-0 mb-3">ยืนยันการลบ</v-card-title>
        <p class="text-body-1 mb-4">คุณแน่ใจหรือไม่ที่จะลบ "{{ deleteTarget?.title }}"?</p>
        <div class="d-flex ga-2 justify-end">
          <v-btn variant="text" @click="confirmDlg = false">ยกเลิก</v-btn>
          <v-btn color="error" @click="deletePeriod" :loading="saving">ลบ</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { api } from '../../stores/auth'

const showSnackbar = inject('showSnackbar')
const periods = ref([])
const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const confirmDlg = ref(false)
const editMode = ref(false)
const editId = ref(null)
const deleteTarget = ref(null)
const formRef = ref(null)

const form = reactive({ title: '', description: '', start_date: '', end_date: '', is_active: false })

const resetForm = () => Object.assign(form, { title: '', description: '', start_date: '', end_date: '', is_active: false })

const openDialog = (p = null) => {
  if (p) {
    editMode.value = true; editId.value = p.id
    Object.assign(form, { title: p.title, description: p.description, start_date: p.start_date?.split('T')[0], end_date: p.end_date?.split('T')[0], is_active: p.is_active })
  } else { editMode.value = false; editId.value = null; resetForm() }
  dialog.value = true
}

const fetchPeriods = async () => {
  loading.value = true
  try { const { data } = await api.get('/evaluations'); periods.value = data.data || [] }
  catch (e) { console.error(e) } finally { loading.value = false }
}

const saveEvaluation = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (editMode.value) { await api.put(`/evaluations/${editId.value}`, form); showSnackbar('แก้ไขสำเร็จ') }
    else { await api.post('/evaluations', form); showSnackbar('สร้างสำเร็จ') }
    dialog.value = false; await fetchPeriods()
  } catch (e) { showSnackbar(e.response?.data?.message || 'เกิดข้อผิดพลาด', 'error') }
  finally { saving.value = false }
}

const togglePeriod = async (p) => {
  try { await api.patch(`/evaluations/${p.id}/toggle`); await fetchPeriods(); showSnackbar('เปลี่ยนสถานะสำเร็จ') }
  catch (e) { showSnackbar('เกิดข้อผิดพลาด', 'error') }
}

const confirmDelete = (p) => { deleteTarget.value = p; confirmDlg.value = true }
const deletePeriod = async () => {
  saving.value = true
  try { await api.delete(`/evaluations/${deleteTarget.value.id}`); confirmDlg.value = false; await fetchPeriods(); showSnackbar('ลบสำเร็จ') }
  catch (e) { showSnackbar('เกิดข้อผิดพลาด', 'error') }
  finally { saving.value = false }
}

const formatDate = d => d ? new Date(d).toLocaleDateString('th-TH') : '-'
onMounted(fetchPeriods)
</script>
