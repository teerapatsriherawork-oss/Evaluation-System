<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">ผลการประเมินของฉัน</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">แสดงผลสรุปของรายการที่ประเมินเสร็จแล้ว</p>

    <v-row>
      <v-col v-for="a in completed" :key="a.id" cols="12" md="6">
        <v-card class="glass-card hover-card pa-5">
          <div class="d-flex align-center mb-3">
            <v-avatar color="success" size="48" class="mr-3"><v-icon>mdi-check-decagram</v-icon></v-avatar>
            <div>
              <div class="text-h6 font-weight-medium">{{ a.evaluatee_name }}</div>
              <div class="text-caption text-medium-emphasis">{{ a.department }} | {{ a.position }}</div>
            </div>
          </div>
          <div class="d-flex align-center mb-2 text-body-2">
            <v-icon size="small" class="mr-1" color="primary">mdi-clipboard-text</v-icon> {{ a.period_title }}
          </div>
          <v-chip :color="a.committee_role==='chairman'?'warning':'info'" size="small" label>
            {{ a.committee_role==='chairman'?'ประธาน':'กรรมการ' }}
          </v-chip>
          <v-chip color="success" size="small" label class="ml-2">เสร็จสิ้น</v-chip>
          <v-btn block color="primary" variant="tonal" :to="`/committee/score/${a.id}`" class="mt-3" rounded="lg">
            <v-icon start>mdi-eye</v-icon> ดูรายละเอียด
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-if="completed.length===0" class="glass-card pa-10 text-center">
      <v-icon size="64" color="info" class="mb-3">mdi-clipboard-check-outline</v-icon>
      <h3 class="text-h5 mb-2">ยังไม่มีผลการประเมิน</h3>
      <p class="text-medium-emphasis">ยังไม่ได้ส่งผลการประเมินใดเลย</p>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore, api } from '../../stores/auth'
const auth = useAuthStore(); const completed = ref([])
onMounted(async () => {
  try {
    const { data } = await api.get(`/assignments/committee/${auth.user.id}?all=true`)
    completed.value = (data.data || []).filter(a => a.status === 'completed')
  } catch(e){}
})
</script>
