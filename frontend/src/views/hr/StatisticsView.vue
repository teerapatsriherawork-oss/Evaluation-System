<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">สถิติภาพรวม</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">สรุปสถิติภาพรวมจากข้อมูลการประเมิน เช่น ค่าเฉลี่ยคะแนน</p>

    <v-select v-model="periodId" :items="periodItems" label="รอบประเมิน" density="compact" class="mb-4" style="max-width:400px" @update:model-value="fetchStats" />

    <v-row>
      <v-col cols="12" md="7">
        <v-card class="glass-card pa-5">
          <div class="text-h6 font-weight-medium mb-4"><v-icon color="primary" class="mr-2">mdi-chart-bar</v-icon>คะแนนรายผู้รับการประเมิน</div>
          <canvas ref="chartRef" height="300"></canvas>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="glass-card pa-5">
          <div class="text-h6 font-weight-medium mb-4"><v-icon color="secondary" class="mr-2">mdi-chart-pie</v-icon>คะแนนรายหัวข้อ</div>
          <canvas ref="topicChartRef" height="300"></canvas>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="glass-card pa-5 mt-4">
      <div class="text-h6 font-weight-medium mb-3"><v-icon color="accent" class="mr-2">mdi-table</v-icon>ตารางคะแนนรายผู้รับการประเมิน</div>
      <v-table density="compact" class="bg-transparent">
        <thead><tr><th>#</th><th>ชื่อ-สกุล</th><th>แผนก</th><th>คะแนนเฉลี่ย</th><th>ระดับ</th></tr></thead>
        <tbody>
          <tr v-for="(s,i) in stats.evaluatee_scores" :key="i">
            <td>{{ i+1 }}</td><td>{{ s.full_name }}</td><td>{{ s.department||'-' }}</td>
            <td class="font-weight-bold">{{ Number(s.avg_score).toFixed(2) }}</td>
            <td><v-chip size="x-small" :color="gradeColor(s.avg_score)" label>{{ gradeLabel(s.avg_score) }}</v-chip></td>
          </tr>
          <tr v-if="!stats.evaluatee_scores?.length"><td colspan="5" class="text-center text-medium-emphasis py-4">ไม่พบข้อมูล</td></tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { api } from '../../stores/auth'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const periodId = ref(null); const periodItems = ref([]); const stats = ref({})
const chartRef = ref(null); const topicChartRef = ref(null)
let chartInst = null; let topicChartInst = null

const gradeColor = s => { const n=Number(s); return n>=3.5?'success':n>=2.5?'info':n>=1.5?'warning':'error' }
const gradeLabel = s => { const n=Number(s); return n>=3.5?'ดีเยี่ยม':n>=2.5?'ดี':n>=1.5?'พอใช้':'ปรับปรุง' }

const renderCharts = () => {
  if(chartInst) chartInst.destroy(); if(topicChartInst) topicChartInst.destroy()
  const es = stats.value.evaluatee_scores || []
  const ts = stats.value.topic_scores || []
  if(chartRef.value && es.length){
    chartInst = new Chart(chartRef.value, { type:'bar', data:{ labels:es.map(e=>e.full_name), datasets:[{label:'คะแนนเฉลี่ย',data:es.map(e=>Number(e.avg_score).toFixed(2)),backgroundColor:'rgba(99,102,241,0.6)',borderColor:'#6366f1',borderWidth:1,borderRadius:8}] },
      options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,max:4,grid:{color:'rgba(255,255,255,0.05)'}}, x:{grid:{display:false}} } } })
  }
  if(topicChartRef.value && ts.length){
    const colors = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']
    topicChartInst = new Chart(topicChartRef.value, { type:'doughnut', data:{ labels:ts.map(t=>t.topic_title), datasets:[{data:ts.map(t=>Number(t.avg_score).toFixed(2)),backgroundColor:colors.slice(0,ts.length),borderWidth:0}] },
      options:{ responsive:true, plugins:{legend:{position:'bottom',labels:{color:'#e2e8f0',padding:12}}} } })
  }
}

const fetchStats = async () => {
  if(!periodId.value) return
  try { const { data } = await api.get(`/reports/statistics/${periodId.value}`); stats.value = data.data||{}; await nextTick(); renderCharts() } catch(e){}
}

onMounted(async () => { try { const { data }=await api.get('/evaluations'); const p=data.data||[]; periodItems.value=p.map(x=>({title:x.title,value:x.id})); if(p.length){periodId.value=p[0].id; await fetchStats()} } catch(e){} })
</script>
