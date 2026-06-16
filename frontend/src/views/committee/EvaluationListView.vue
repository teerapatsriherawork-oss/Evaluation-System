<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">รายการประเมิน</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">แสดงข้อมูลของผู้รับการประเมินที่ต้องประเมิน</p>

    <v-row>
      <v-col v-for="a in assignments" :key="a.id" cols="12" md="6" lg="4">
        <v-card class="glass-card hover-card pa-5">
          <div class="d-flex align-center mb-3">
            <v-avatar color="secondary" size="48" class="mr-3">
              <span class="text-body-1 font-weight-bold">{{ a.evaluatee_name?.substring(0,2) }}</span>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-h6 font-weight-medium">{{ a.evaluatee_name }}</div>
              <div class="text-caption text-medium-emphasis">{{ a.department || '-' }} | {{ a.position || '-' }}</div>
            </div>
          </div>
          <div class="d-flex align-center mb-2 text-body-2 text-medium-emphasis">
            <v-icon size="small" class="mr-1">mdi-clipboard-text</v-icon> {{ a.period_title }}
          </div>
          <div class="d-flex align-center mb-3">
            <v-chip size="small" :color="a.committee_role==='chairman'?'warning':'info'" label class="mr-2">
              {{ a.committee_role==='chairman'?'ประธาน':'กรรมการ' }}
            </v-chip>
            <v-chip size="small" :color="statusColor(a.status)" label>{{ statusLabel(a.status) }}</v-chip>
          </div>
          <v-btn block :color="a.status==='completed'?'success':'primary'" variant="tonal" :to="`/committee/score/${a.id}`" rounded="lg">
            <v-icon start>{{ a.status==='completed'?'mdi-eye':'mdi-pencil' }}</v-icon>
            {{ a.status==='completed'?'ดูผลการประเมิน':'เริ่มประเมิน' }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-if="assignments.length===0 && !loading" class="glass-card pa-10 text-center">
      <v-icon size="64" color="info" class="mb-3">mdi-clipboard-check-outline</v-icon>
      <h3 class="text-h5 mb-2">ยังไม่มีรายการประเมิน</h3>
      <p class="text-medium-emphasis">รอฝ่ายบุคลากรมอบหมายรายการ</p>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore, api } from '../../stores/auth'
const auth = useAuthStore(); const assignments = ref([]); const loading = ref(true)
const statusColor = s => ({pending:'grey',in_progress:'warning',completed:'success'}[s]||'grey')
const statusLabel = s => ({pending:'รอดำเนินการ',in_progress:'กำลังประเมิน',completed:'เสร็จสิ้น'}[s]||s)
onMounted(async () => { try { const { data } = await api.get(`/assignments/committee/${auth.user.id}`); assignments.value = data.data || [] } catch(e){} finally { loading.value = false } })
</script>
