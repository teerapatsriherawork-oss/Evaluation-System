<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text">สำรอง & กู้คืนข้อมูล</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">สำรองข้อมูลทั้งระบบเก็บไว้ และกู้คืนเมื่อจำเป็น</p>
      </div>
      <v-spacer />
      <v-btn class="gradient-btn" @click="doBackup" :loading="backingUp">
        <v-icon start>mdi-database-plus</v-icon> สำรองข้อมูลตอนนี้
      </v-btn>
    </div>

    <v-alert type="warning" variant="tonal" class="mb-4" rounded="lg" density="comfortable">
      <v-icon start>mdi-alert</v-icon> การกู้คืนจะ<strong>เขียนทับข้อมูลปัจจุบันทั้งหมด</strong> โปรดสำรองข้อมูลล่าสุดก่อนทุกครั้ง
    </v-alert>

    <v-card class="glass-card">
      <v-table density="comfortable" class="bg-transparent">
        <thead><tr><th>ชื่อไฟล์สำรอง</th><th>วันที่สร้าง</th><th width="140">จัดการ</th></tr></thead>
        <tbody>
          <tr v-for="b in backups" :key="b.id">
            <td><v-icon size="small" class="mr-2" color="primary">mdi-database</v-icon>{{ b.backup_name }}</td>
            <td>{{ formatDateTime(b.created_at) }}</td>
            <td>
              <v-btn size="small" color="warning" variant="tonal" @click="doRestore(b)" :loading="restoringId === b.id" rounded="lg">
                <v-icon start size="small">mdi-restore</v-icon> กู้คืน
              </v-btn>
            </td>
          </tr>
          <tr v-if="!backups.length"><td colspan="3" class="text-center text-medium-emphasis py-4">ยังไม่มีข้อมูลสำรอง — กดปุ่ม "สำรองข้อมูลตอนนี้" เพื่อสร้างครั้งแรก</td></tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../lib/api'
import { useNotify } from '../../composables/useNotify'
import { useConfirm } from '../../composables/useConfirm'

const { success, error } = useNotify()
const confirm = useConfirm()
const backups = ref([])
const backingUp = ref(false)
const restoringId = ref(null)

const formatDateTime = (d) => (d ? new Date(d).toLocaleString('th-TH') : '-')

const load = async () => {
  try { backups.value = (await api.get('/reports/backup/list')).data.data || [] } catch (e) { /* noop */ }
}

const doBackup = async () => {
  backingUp.value = true
  try { await api.post('/reports/backup'); success('สำรองข้อมูลสำเร็จ'); await load() }
  catch (e) { error() } finally { backingUp.value = false }
}

const doRestore = async (b) => {
  const ok = await confirm({
    title: 'ยืนยันการกู้คืนข้อมูล',
    message: `กู้คืนจาก "${b.backup_name}"?\n\n⚠️ ข้อมูลปัจจุบันทั้งหมดจะถูกเขียนทับด้วยข้อมูลสำรองนี้`,
    color: 'warning', confirmText: 'กู้คืนข้อมูล', icon: 'mdi-restore'
  })
  if (!ok) return
  restoringId.value = b.id
  try { await api.post('/reports/restore', { backup_id: b.id }); success('กู้คืนข้อมูลสำเร็จ') }
  catch (e) { error('กู้คืนไม่สำเร็จ') } finally { restoringId.value = null }
}

onMounted(load)
</script>
