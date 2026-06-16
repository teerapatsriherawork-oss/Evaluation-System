<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">ความคืบหน้า</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">แสดงความคืบหน้าในการดำเนินงานของแต่ละตัวชี้วัด</p>

    <v-card class="glass-card pa-6 mb-6">
      <div class="d-flex align-center mb-4">
        <v-icon color="secondary" size="large" class="mr-3">mdi-chart-arc</v-icon>
        <div class="flex-grow-1">
          <div class="text-h6 font-weight-medium">ความคืบหน้าโดยรวม</div>
          <v-progress-linear :model-value="progress.progress" color="secondary" height="28" rounded class="mt-2">
            <strong class="text-white">{{ progress.progress }}%</strong>
          </v-progress-linear>
        </div>
      </div>
      <v-row class="mt-2">
        <v-col cols="6" sm="3">
          <div class="text-center"><div class="text-h4 font-weight-bold text-primary">{{ progress.total }}</div><div class="text-caption text-medium-emphasis">ตัวชี้วัดทั้งหมด</div></div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="text-center"><div class="text-h4 font-weight-bold text-success">{{ progress.completed }}</div><div class="text-caption text-medium-emphasis">เสร็จสิ้น</div></div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="text-center"><div class="text-h4 font-weight-bold text-warning">{{ progress.draft }}</div><div class="text-caption text-medium-emphasis">ร่าง</div></div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="text-center"><div class="text-h4 font-weight-bold text-error">{{ progress.remaining }}</div><div class="text-caption text-medium-emphasis">เหลือ</div></div>
        </v-col>
      </v-row>
    </v-card>

    <v-card class="glass-card pa-5">
      <div class="text-h6 font-weight-medium mb-3"><v-icon color="primary" class="mr-2">mdi-format-list-checks</v-icon>รายการตัวชี้วัด</div>
      <v-table density="compact" class="bg-transparent">
        <thead><tr><th>ตัวชี้วัด</th><th>หัวข้อ</th><th>น้ำหนัก</th><th>คะแนนตนเอง</th><th>สถานะ</th></tr></thead>
        <tbody>
          <tr v-for="sa in selfData" :key="sa.id">
            <td>{{ sa.indicator_name }}</td><td>{{ sa.topic_title }}</td><td>{{ sa.weight }}</td>
            <td class="font-weight-bold">{{ sa.self_score ?? '-' }}</td>
            <td><v-chip size="x-small" :color="sa.status==='submitted'?'success':'warning'" label>{{ sa.status==='submitted'?'ส่งแล้ว':'ร่าง' }}</v-chip></td>
          </tr>
          <tr v-if="!selfData.length"><td colspan="5" class="text-center text-medium-emphasis py-4">ไม่พบข้อมูล</td></tr>
        </tbody>
      </v-table>
    </v-card>

    <div class="mt-4 d-flex justify-end">
      <v-btn color="error" variant="tonal" @click="exportPDF" :loading="exporting" rounded="lg">
        <v-icon start>mdi-file-pdf-box</v-icon> Export PDF
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useAuthStore, api } from '../../stores/auth'
const auth = useAuthStore(); const showSnackbar = inject('showSnackbar')
const progress = ref({ total: 0, completed: 0, draft: 0, remaining: 0, progress: 0 })
const selfData = ref([]); const exporting = ref(false)

onMounted(async () => {
  try {
    const [pRes, saRes] = await Promise.all([
      api.get(`/self-assessments/progress/${auth.user.id}`),
      api.get(`/self-assessments/${auth.user.id}`)
    ])
    progress.value = pRes.data.data || progress.value
    selfData.value = saRes.data.data || []
  } catch(e){}
})

const exportPDF = async () => {
  exporting.value = true
  try {
    // Simple client-side PDF generation using window.print()
    const printWindow = window.open('', '_blank')
    const html = `<html><head><title>ผลการประเมินตนเอง - ${auth.userName}</title>
      <style>body{font-family:Sarabun,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f0f0f0}.header{text-align:center;margin-bottom:20px}</style></head>
      <body><div class="header"><h2>รายงานผลการประเมินตนเอง</h2><p>${auth.userName} | ${auth.user?.department || ''}</p></div>
      <p><strong>ความคืบหน้า:</strong> ${progress.value.progress}% (${progress.value.completed}/${progress.value.total})</p>
      <table><tr><th>ตัวชี้วัด</th><th>หัวข้อ</th><th>น้ำหนัก</th><th>คะแนน</th><th>สถานะ</th></tr>
      ${selfData.value.map(s => `<tr><td>${s.indicator_name}</td><td>${s.topic_title}</td><td>${s.weight}</td><td>${s.self_score ?? '-'}</td><td>${s.status==='submitted'?'ส่งแล้ว':'ร่าง'}</td></tr>`).join('')}
      </table></body></html>`
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
    showSnackbar('สร้าง PDF สำเร็จ')
  } catch(e){ showSnackbar('เกิดข้อผิดพลาด','error') }
  finally { exporting.value = false }
}
</script>
