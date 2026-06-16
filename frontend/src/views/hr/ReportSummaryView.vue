<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">สรุปผลการประเมิน</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">แสดงรายงานผลการประเมินรายบุคคล</p>

    <v-row dense class="mb-4" align="center">
      <v-col cols="12" sm="4">
        <v-select v-model="periodId" :items="periodItems" label="รอบประเมิน" density="compact" hide-details @update:model-value="fetchSummary" />
      </v-col>
      <v-col cols="12" sm="3">
        <v-btn color="success" variant="tonal" @click="exportExcel" :disabled="!periodId" block><v-icon start>mdi-microsoft-excel</v-icon> Export Excel</v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-4" v-if="summary.period">
      <v-col cols="6" sm="3">
        <v-card class="glass-card pa-4 stat-card-primary"><div class="text-h4 font-weight-bold">{{ summary.total_evaluatees }}</div><div class="text-caption text-medium-emphasis">ผู้รับการประเมิน</div></v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="glass-card pa-4 stat-card-success"><div class="text-h4 font-weight-bold">{{ fmt(summary.score_summary?.avg_score) }}</div><div class="text-caption text-medium-emphasis">คะแนนเฉลี่ย</div></v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="glass-card pa-4 stat-card-info"><div class="text-h4 font-weight-bold">{{ fmt(summary.score_summary?.max_score) }}</div><div class="text-caption text-medium-emphasis">คะแนนสูงสุด</div></v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="glass-card pa-4 stat-card-warning"><div class="text-h4 font-weight-bold">{{ fmt(summary.score_summary?.min_score) }}</div><div class="text-caption text-medium-emphasis">คะแนนต่ำสุด</div></v-card>
      </v-col>
    </v-row>

    <v-card class="glass-card pa-5 mb-4" v-if="summary.status_breakdown?.length">
      <div class="text-h6 font-weight-medium mb-3"><v-icon color="primary" class="mr-2">mdi-chart-donut</v-icon>สถานะการประเมิน</div>
      <div class="d-flex ga-4">
        <v-chip v-for="s in summary.status_breakdown" :key="s.status" :color="statusColor(s.status)" size="large" label>
          {{ statusLabel(s.status) }}: {{ s.count }}
        </v-chip>
      </div>
    </v-card>

    <v-card class="glass-card pa-5">
      <div class="text-h6 font-weight-medium mb-3"><v-icon color="secondary" class="mr-2">mdi-account-details</v-icon>ผลการประเมินรายบุคคล</div>
      <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="ค้นหาชื่อ..." density="compact" class="mb-3" style="max-width:300px" clearable />
      <v-table density="compact" class="bg-transparent">
        <thead><tr><th>ชื่อ-สกุล</th><th>แผนก</th><th>คะแนนเฉลี่ย</th><th>จำนวนกรรมการ</th><th>ดำเนินการ</th></tr></thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id">
            <td>{{ u.full_name }}</td><td>{{ u.department || '-' }}</td>
            <td><span class="font-weight-bold">{{ u.avg_score || '-' }}</span></td>
            <td>{{ u.committee_count || 0 }}</td>
            <td>
              <v-btn size="small" color="primary" variant="tonal" @click="viewReport(u.id)" rounded="lg" class="mr-1"><v-icon start size="small">mdi-eye</v-icon>ดูรายงาน</v-btn>
              <v-btn size="small" color="error" variant="tonal" @click="downloadPdf(u.id)" rounded="lg" icon="mdi-file-pdf-box" />
            </td>
          </tr>
          <tr v-if="filtered.length===0"><td colspan="5" class="text-center text-medium-emphasis py-4">ไม่พบข้อมูล</td></tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Report Dialog -->
    <v-dialog v-model="reportDlg" max-width="800">
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="gradient-text font-weight-bold pa-0 mb-4">รายงานผลการประเมิน — {{ report.user?.full_name }}</v-card-title>
        <div v-if="report.user" class="mb-4 text-body-2">
          <span class="mr-4"><v-icon size="small" class="mr-1">mdi-domain</v-icon>{{ report.user.department || '-' }}</span>
          <span><v-icon size="small" class="mr-1">mdi-briefcase</v-icon>{{ report.user.position || '-' }}</span>
        </div>
        <div class="mb-3"><strong>คะแนนเฉลี่ยรวม:</strong> <span class="text-h5 font-weight-bold text-primary ml-2">{{ report.summary?.average_score || '-' }}</span></div>
        <v-table density="compact" class="bg-transparent mb-4">
          <thead><tr><th>กรรมการ</th><th>บทบาท</th><th>คะแนนรวม</th><th>ความคิดเห็น</th></tr></thead>
          <tbody>
            <tr v-for="r in report.results" :key="r.id">
              <td>{{ r.committee_name }}</td>
              <td><v-chip size="x-small" :color="r.committee_role==='chairman'?'warning':'info'" label>{{ r.committee_role==='chairman'?'ประธาน':'สมาชิก' }}</v-chip></td>
              <td class="font-weight-bold">{{ r.total_score }}</td>
              <td>{{ r.overall_comment || '-' }}</td>
            </tr>
          </tbody>
        </v-table>
        <div class="d-flex justify-end ga-2">
          <v-btn color="error" variant="tonal" @click="downloadPdf(report.user?.id)"><v-icon start>mdi-file-pdf-box</v-icon>ดาวน์โหลด PDF</v-btn>
          <v-btn variant="text" @click="reportDlg=false">ปิด</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../../lib/api'
import { statusColor, statusLabel } from '../../lib/format'

const periodId = ref(null)
const periodItems = ref([])
const summary = ref({})
const evaluatees = ref([])
const search = ref('')
const reportDlg = ref(false)
const report = ref({})

const fmt = (n) => (n != null ? Number(n).toFixed(1) : '-')
const filtered = computed(() => {
  if (!search.value) return evaluatees.value
  const s = search.value.toLowerCase()
  return evaluatees.value.filter(u => u.full_name?.toLowerCase().includes(s))
})

const fetchSummary = async () => {
  if (!periodId.value) return
  try {
    const { data } = await api.get(`/reports/summary/${periodId.value}`)
    summary.value = data.data || {}
    const uRes = await api.get('/users?role=evaluatee')
    const users = uRes.data.data || []
    // เติมคะแนนเฉลี่ย + จำนวนกรรมการของแต่ละคนจากรายงานรายบุคคล
    evaluatees.value = await Promise.all(users.map(async (u) => {
      try {
        const rd = (await api.get(`/reports/individual/${u.id}`)).data.data || {}
        return { ...u, avg_score: rd.summary?.average_score || null, committee_count: rd.summary?.total_committees || 0 }
      } catch { return { ...u, avg_score: null, committee_count: 0 } }
    }))
  } catch (e) { /* noop */ }
}

const viewReport = async (id) => {
  try { report.value = (await api.get(`/reports/individual/${id}`)).data.data || {}; reportDlg.value = true } catch (e) { /* noop */ }
}

// เปิด PDF (cookie แนบไปกับ request อัตโนมัติ) → เบราว์เซอร์ดาวน์โหลดไฟล์
const downloadPdf = (id) => { if (id) window.open(`/api/reports/pdf/${id}`, '_blank') }
const exportExcel = () => { if (periodId.value) window.open(`/api/reports/csv/${periodId.value}`, '_blank') }

onMounted(async () => {
  const { data } = await api.get('/evaluations')
  const p = data.data || []
  periodItems.value = p.map(x => ({ title: x.title, value: x.id }))
  if (p.length) { periodId.value = p[0].id; await fetchSummary() }
})
</script>
