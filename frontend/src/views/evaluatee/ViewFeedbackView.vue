<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">ผลประเมินจากกรรมการ</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">ดูความคิดเห็นของกรรมการที่ประเมินของตนเอง</p>

    <v-row>
      <v-col v-for="fb in feedbacks" :key="fb.id" cols="12" md="6">
        <v-card class="glass-card hover-card pa-5">
          <div class="d-flex align-center mb-3">
            <v-avatar :color="fb.committee_role==='chairman'?'warning':'info'" size="40" class="mr-3">
              <v-icon>mdi-gavel</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ fb.committee_name }}</div>
              <div class="text-caption text-medium-emphasis">{{ fb.committee_position || '' }} — {{ fb.committee_role==='chairman'?'ประธาน':'กรรมการ' }}</div>
            </div>
            <v-spacer />
            <v-chip size="small" color="primary" variant="tonal" label>{{ fb.total_score }} คะแนน</v-chip>
          </div>
          <v-divider class="mb-3" />
          <div class="text-body-2 mb-2"><strong>ความคิดเห็นรวม:</strong></div>
          <p class="text-body-2 text-medium-emphasis">{{ fb.overall_comment || 'ไม่มีความคิดเห็น' }}</p>
          <div class="text-caption text-medium-emphasis mt-2" v-if="fb.submitted_at">
            <v-icon size="x-small" class="mr-1">mdi-clock</v-icon> ส่งเมื่อ {{ new Date(fb.submitted_at).toLocaleString('th-TH') }}
          </div>
          <div v-if="fb.signature_image" class="mt-3">
            <div class="text-caption mb-1">ลายเซ็น:</div>
            <img :src="fb.signature_image" style="max-width:200px;max-height:80px;border:1px solid rgba(255,255,255,0.1);border-radius:8px" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <EmptyState v-if="feedbacks.length===0 && !loading" icon="mdi-comment-text-outline"
      title="ยังไม่มีผลประเมิน" subtitle="รอกรรมการส่งผลการประเมิน" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/api'
import EmptyState from '../../components/EmptyState.vue'

const auth = useAuthStore()
const feedbacks = ref([])
const loading = ref(true)

onMounted(async () => {
  try { feedbacks.value = (await api.get(`/scores/feedback/${auth.user.id}`)).data.data || [] }
  catch (e) { /* noop */ } finally { loading.value = false }
})
</script>
