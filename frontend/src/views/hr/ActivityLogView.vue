<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">ประวัติการใช้งาน</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">บันทึกการกระทำสำคัญในระบบ (Audit Trail) เพื่อความโปร่งใสและตรวจสอบย้อนหลัง</p>

    <v-card class="glass-card pa-4 mb-4">
      <v-row dense align="center">
        <v-col cols="12" sm="4">
          <v-select v-model="filterAction" :items="actionItems" label="ประเภทการกระทำ" clearable density="compact" hide-details @update:model-value="load" />
        </v-col>
        <v-col cols="12" sm="5">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="ค้นหารายละเอียด/ผู้ใช้..." density="compact" hide-details clearable />
        </v-col>
        <v-col cols="12" sm="3" class="text-right">
          <v-chip color="primary" variant="tonal" label>ทั้งหมด {{ filtered.length }} รายการ</v-chip>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="glass-card">
      <v-table density="comfortable" class="bg-transparent">
        <thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>การกระทำ</th><th>รายละเอียด</th><th>IP</th></tr></thead>
        <tbody>
          <tr v-for="log in paged" :key="log.id">
            <td class="text-caption">{{ formatDateTime(log.created_at) }}</td>
            <td>{{ log.user_name || '-' }}</td>
            <td><v-chip size="x-small" :color="actionColor(log.action)" label>{{ log.action }}</v-chip></td>
            <td>{{ log.detail }}</td>
            <td class="text-caption text-medium-emphasis">{{ log.ip || '-' }}</td>
          </tr>
          <tr v-if="!filtered.length"><td colspan="5" class="text-center text-medium-emphasis py-4">ไม่พบประวัติการใช้งาน</td></tr>
        </tbody>
      </v-table>
      <div class="d-flex justify-center pa-3" v-if="pageCount > 1">
        <v-pagination v-model="page" :length="pageCount" density="compact" total-visible="5" />
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../../lib/api'

const logs = ref([])
const filterAction = ref(null)
const search = ref('')
const page = ref(1)
const perPage = 15

const actionItems = [
  { title: 'สร้าง (CREATE)', value: 'CREATE' },
  { title: 'ส่งผล (SUBMIT)', value: 'SUBMIT' },
  { title: 'เข้าระบบ (LOGIN)', value: 'LOGIN' },
  { title: 'ลบ (DELETE)', value: 'DELETE' }
]
const actionColor = (a) => ({ CREATE: 'success', SUBMIT: 'primary', LOGIN: 'info', DELETE: 'error', UPDATE: 'warning' }[a] || 'grey')
const formatDateTime = (d) => (d ? new Date(d).toLocaleString('th-TH') : '-')

const filtered = computed(() => {
  if (!search.value) return logs.value
  const s = search.value.toLowerCase()
  return logs.value.filter(l => l.detail?.toLowerCase().includes(s) || l.user_name?.toLowerCase().includes(s))
})
const pageCount = computed(() => Math.ceil(filtered.value.length / perPage))
const paged = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))

const load = async () => {
  const q = filterAction.value ? `?action=${filterAction.value}` : ''
  try { logs.value = (await api.get('/activity-logs' + q)).data.data || []; page.value = 1 } catch (e) { /* noop */ }
}

onMounted(load)
</script>
