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
            <StatusChip :status="a.status" />
          </div>
          <v-btn block :color="a.status==='completed'?'success':'primary'" variant="tonal" :to="`/committee/score/${a.id}`" rounded="lg">
            <v-icon start>{{ a.status==='completed'?'mdi-eye':'mdi-pencil' }}</v-icon>
            {{ a.status==='completed'?'ดูผลการประเมิน':'เริ่มประเมิน' }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <EmptyState v-if="assignments.length===0 && !loading" icon="mdi-clipboard-check-outline" color="info"
      title="ยังไม่มีรายการประเมิน" subtitle="รอฝ่ายบุคลากรมอบหมายรายการ" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/api'
import StatusChip from '../../components/StatusChip.vue'
import EmptyState from '../../components/EmptyState.vue'

const auth = useAuthStore()
const assignments = ref([])
const loading = ref(true)

onMounted(async () => {
  try { assignments.value = (await api.get(`/assignments/committee/${auth.user.id}`)).data.data || [] }
  catch (e) { /* noop */ } finally { loading.value = false }
})
</script>
