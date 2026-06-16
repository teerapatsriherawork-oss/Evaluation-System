<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">ติดตามสถานะ</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">ติดตามการประเมินของกรรมการ และผู้รับการประเมิน</p>

    <v-select v-model="periodId" :items="periodItems" label="เลือกรอบประเมิน" density="compact" class="mb-4" style="max-width:400px" @update:model-value="fetchTracking" />

    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-card class="glass-card pa-5">
          <div class="d-flex align-center mb-4"><v-icon color="warning" class="mr-2">mdi-gavel</v-icon><span class="text-h6 font-weight-medium">สถานะกรรมการ</span></div>
          <v-table density="compact" class="bg-transparent">
            <thead><tr><th>กรรมการ</th><th>บทบาท</th><th>สถานะ</th><th>เสร็จ/ทั้งหมด</th></tr></thead>
            <tbody>
              <tr v-for="c in tracking.committee_tracking" :key="c.committee_name">
                <td>{{ c.committee_name }}</td>
                <td><v-chip size="x-small" :color="c.committee_role==='chairman'?'warning':'info'" label>{{ c.committee_role==='chairman'?'ประธาน':'สมาชิก' }}</v-chip></td>
                <td><v-chip size="x-small" :color="statusColor(c.status)" label>{{ statusLabel(c.status) }}</v-chip></td>
                <td>{{ c.completed }}/{{ c.total }}</td>
              </tr>
              <tr v-if="!tracking.committee_tracking?.length"><td colspan="4" class="text-center text-medium-emphasis py-3">ไม่พบข้อมูล</td></tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="glass-card pa-5">
          <div class="d-flex align-center mb-4"><v-icon color="secondary" class="mr-2">mdi-account</v-icon><span class="text-h6 font-weight-medium">สถานะผู้รับการประเมิน</span></div>
          <v-table density="compact" class="bg-transparent">
            <thead><tr><th>ชื่อ</th><th>กรอกแล้ว</th><th>ส่งแล้ว</th><th>ทั้งหมด</th><th>ความคืบหน้า</th></tr></thead>
            <tbody>
              <tr v-for="e in tracking.evaluatee_tracking" :key="e.evaluatee_name">
                <td>{{ e.evaluatee_name }}</td><td>{{ e.self_filled }}</td><td>{{ e.self_submitted }}</td><td>{{ e.total_indicators }}</td>
                <td><v-progress-linear :model-value="e.total_indicators ? (e.self_submitted/e.total_indicators)*100 : 0" color="secondary" height="8" rounded /></td>
              </tr>
              <tr v-if="!tracking.evaluatee_tracking?.length"><td colspan="5" class="text-center text-medium-emphasis py-3">ไม่พบข้อมูล</td></tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../stores/auth'
const periodId = ref(null); const periodItems = ref([]); const tracking = ref({})
const statusColor = s => ({pending:'grey',in_progress:'warning',completed:'success'}[s]||'grey')
const statusLabel = s => ({pending:'รอ',in_progress:'กำลังทำ',completed:'เสร็จ'}[s]||s)
const fetchTracking = async () => { if (!periodId.value) return; try { const { data } = await api.get(`/reports/tracking/${periodId.value}`); tracking.value = data.data || {} } catch(e){} }
onMounted(async () => { try { const { data } = await api.get('/evaluations'); const p = data.data||[]; periodItems.value = p.map(x=>({title:x.title,value:x.id})); if(p.length){ periodId.value=p[0].id; await fetchTracking() } } catch(e){} })
</script>
