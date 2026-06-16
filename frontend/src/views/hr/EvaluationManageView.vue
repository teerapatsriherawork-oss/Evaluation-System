<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text">จัดการรอบประเมิน</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">เพิ่มหัวข้อการประเมิน กำหนดช่วงเวลาเปิด-ปิดระบบ</p>
      </div>
      <v-spacer />
      <v-btn class="gradient-btn" @click="openCreate()" id="btn-add-period">
        <v-icon start>mdi-plus</v-icon> สร้างรอบประเมิน
      </v-btn>
    </div>

    <v-row>
      <v-col v-for="p in items" :key="p.id" cols="12" md="6" lg="4">
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
            <v-btn size="small" variant="tonal" @click="edit(p)" rounded="lg" icon="mdi-pencil" />
            <v-btn size="small" color="error" variant="tonal" @click="confirmDelete(p)" rounded="lg" icon="mdi-delete" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <EmptyState v-if="!items.length && !loading" icon="mdi-clipboard-plus"
      title="ยังไม่มีรอบประเมิน" subtitle="เริ่มต้นสร้างรอบประเมินแรกของคุณ">
      <v-btn class="gradient-btn" @click="openCreate()"><v-icon start>mdi-plus</v-icon> สร้างรอบประเมิน</v-btn>
    </EmptyState>

    <!-- Dialog สร้าง/แก้ไข -->
    <v-dialog v-model="dialog" max-width="550" persistent>
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="text-h5 font-weight-bold gradient-text pa-0 mb-4">
          {{ isEdit() ? 'แก้ไขรอบประเมิน' : 'สร้างรอบประเมินใหม่' }}
        </v-card-title>
        <v-form @submit.prevent="save(formRef)" ref="formRef">
          <v-text-field v-model="form.title" label="ชื่อรอบประเมิน *" :rules="[req]" class="mb-2" id="eval-title" />
          <v-textarea v-model="form.description" label="รายละเอียด" rows="2" class="mb-2" id="eval-desc" />
          <v-row dense>
            <v-col cols="6"><v-text-field v-model="form.start_date" label="วันเริ่มต้น *" type="date" :rules="[req]" id="eval-start" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.end_date" label="วันสิ้นสุด *" type="date" :rules="[req]" id="eval-end" /></v-col>
          </v-row>
          <v-switch v-model="form.is_active" label="เปิดใช้งานทันที" color="success" class="mb-2" />
          <div class="d-flex ga-2 justify-end">
            <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
            <v-btn type="submit" class="gradient-btn" :loading="saving" id="eval-save">บันทึก</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCrud } from '../../composables/useCrud'
import { useNotify } from '../../composables/useNotify'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { useConfirm } from '../../composables/useConfirm'
import EmptyState from '../../components/EmptyState.vue'

const req = (v) => !!v || 'กรุณากรอกข้อมูล'
const { items, loading, saving, dialog, form, isEdit, load, openCreate, openEdit, save, remove } =
  useCrud('/evaluations', { title: '', description: '', start_date: '', end_date: '', is_active: false })
const { success, error } = useNotify()
const confirm = useConfirm()
const formRef = ref(null)

// แปลงวันที่ ISO → YYYY-MM-DD ให้ input type=date ตอนแก้ไข
const edit = (p) => openEdit({ ...p, start_date: p.start_date?.split('T')[0], end_date: p.end_date?.split('T')[0] })
const togglePeriod = async (p) => {
  const act = p.is_active ? 'ปิด' : 'เปิด'
  const ok = await confirm({
    title: `${act}รอบประเมิน`,
    message: `ต้องการ${act}รอบ "${p.title}"?${p.is_active ? '\nผู้ใช้จะไม่สามารถประเมินได้ชั่วคราว' : '\nผู้ใช้จะเริ่มประเมินได้ทันที'}`,
    color: p.is_active ? 'warning' : 'success', confirmText: act, icon: p.is_active ? 'mdi-pause' : 'mdi-play'
  })
  if (!ok) return
  try { await api.patch(`/evaluations/${p.id}/toggle`); await load(); success(`${act}รอบประเมินแล้ว`) } catch { error() }
}
// ลบ → ถามยืนยันผ่าน global confirm (useCrud.remove จัดการให้)
const confirmDelete = (p) => remove(p.id, {
  title: 'ยืนยันการลบ',
  message: `ลบรอบประเมิน "${p.title}"?\nหัวข้อ ตัวชี้วัด และข้อมูลที่เกี่ยวข้องจะถูกลบทั้งหมด`
})

load()
</script>
