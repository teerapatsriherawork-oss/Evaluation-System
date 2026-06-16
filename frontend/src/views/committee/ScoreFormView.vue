<template>
  <div>
    <div class="d-flex align-center mb-6">
      <v-btn icon variant="text" @click="$router.back()" class="mr-2"><v-icon>mdi-arrow-left</v-icon></v-btn>
      <div><h1 class="text-h4 font-weight-bold gradient-text">{{ isCompleted ? 'ผลการประเมิน' : 'แบบประเมิน' }}</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">{{ isCompleted ? 'ดูรายละเอียดผลการประเมินที่บันทึกไว้' : 'ให้คะแนนผู้รับการประเมินตามตัวชี้วัด' }}</p></div>
    </div>

    <!-- Completed badge -->
    <v-alert v-if="isCompleted" type="success" variant="tonal" class="mb-4" rounded="lg">
      <v-icon start>mdi-check-circle</v-icon>
      การประเมินนี้เสร็จสิ้นแล้ว — แสดงผลแบบอ่านอย่างเดียว
    </v-alert>

    <!-- Scoring Form -->
    <v-expansion-panels variant="accordion">
      <v-expansion-panel v-for="(group, topicTitle) in groupedScores" :key="topicTitle" class="glass-card mb-3" rounded="xl">
        <v-expansion-panel-title>
          <v-icon color="primary" class="mr-3">mdi-folder-open</v-icon>
          <span class="text-h6 font-weight-medium">{{ topicTitle }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-card v-for="item in group" :key="item.indicator_id" class="mb-3 pa-4" variant="outlined" rounded="lg">
            <div class="d-flex align-center mb-2">
              <span class="font-weight-medium flex-grow-1">{{ item.indicator_name }}</span>
              <v-chip size="x-small" color="primary" label class="mr-1">น้ำหนัก: {{ item.weight }}</v-chip>
              <v-chip size="x-small" :color="item.score_type==='scale'?'info':'secondary'" label>{{ item.score_type==='scale'?'สเกล 1-4':'มี/ไม่มี' }}</v-chip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-2" v-if="item.indicator_desc">{{ item.indicator_desc }}</p>

            <!-- Self-assessment info -->
            <v-alert v-if="item.self_score !== null && item.self_score !== undefined" type="info" variant="tonal" density="compact" class="mb-3" rounded="lg">
              <div class="text-body-2">
                <strong>คะแนนประเมินตนเอง:</strong> {{ item.self_score }}
                <span v-if="item.self_data" class="ml-3">| ข้อมูล: {{ item.self_data }}</span>
              </div>
              <div v-if="item.evidence_file" class="mt-1">
                <v-icon size="small" class="mr-1">mdi-paperclip</v-icon>
                <a :href="`/api/uploads/file/${item.evidence_file}`" target="_blank" class="text-info">ดูหลักฐาน</a>
              </div>
              <div v-if="item.evidence_url" class="mt-1">
                <v-icon size="small" class="mr-1">mdi-link</v-icon>
                <a :href="item.evidence_url" target="_blank" class="text-info">{{ item.evidence_url }}</a>
              </div>
            </v-alert>

            <!-- Committee Score -->
            <div class="mb-2">
              <div class="text-body-2 font-weight-medium mb-1">คะแนนจากกรรมการ:</div>
              <template v-if="item.score_type === 'scale'">
                <v-btn-toggle v-model="scores[item.indicator_id].score" color="primary" rounded="lg" density="compact" :disabled="isCompleted">
                  <v-btn :value="1" size="small">1<div class="text-caption">ต่ำมาก</div></v-btn>
                  <v-btn :value="2" size="small">2<div class="text-caption">ต่ำ</div></v-btn>
                  <v-btn :value="3" size="small">3<div class="text-caption">ตามคาดหวัง</div></v-btn>
                  <v-btn :value="4" size="small">4<div class="text-caption">สูงกว่า</div></v-btn>
                </v-btn-toggle>
              </template>
              <template v-else>
                <v-switch v-model="scores[item.indicator_id].score" :true-value="1" :false-value="0" label="มี / ไม่มี" color="success" :disabled="isCompleted" />
              </template>
            </div>
            <v-textarea v-model="scores[item.indicator_id].comment" label="ความคิดเห็น" rows="2" density="compact" :readonly="isCompleted" />
            <div class="d-flex justify-end" v-if="!isCompleted">
              <v-btn size="small" color="primary" variant="tonal" @click="saveScore(item.indicator_id)" :loading="scores[item.indicator_id]._saving" rounded="lg">
                <v-icon start size="small">mdi-content-save</v-icon>บันทึก
              </v-btn>
            </div>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Overall + Signature -->
    <v-card class="glass-card pa-6 mt-4" v-if="Object.keys(groupedScores).length">
      <div class="text-h6 font-weight-medium mb-4"><v-icon color="primary" class="mr-2">mdi-draw-pen</v-icon>สรุปและลงนาม</div>

      <!-- Read-only mode: show saved data -->
      <template v-if="isCompleted">
        <div class="mb-4">
          <div class="text-body-2 font-weight-medium mb-1">ความคิดเห็นสรุป:</div>
          <v-card variant="outlined" class="pa-3" rounded="lg">
            <div class="text-body-1">{{ overallComment || '(ไม่มีความคิดเห็น)' }}</div>
          </v-card>
        </div>
        <div v-if="savedSignature" class="mb-4">
          <div class="text-body-2 font-weight-medium mb-2">ลายเซ็น:</div>
          <div style="border:2px solid rgba(99,102,241,0.3);border-radius:12px;background:rgba(0,0,0,0.2);padding:8px">
            <img :src="savedSignature" alt="ลายเซ็น" style="max-width:100%;height:auto;display:block" />
          </div>
        </div>
        <v-divider class="my-4" />
        <div class="d-flex justify-end">
          <v-btn variant="tonal" color="primary" @click="$router.back()" rounded="lg">
            <v-icon start>mdi-arrow-left</v-icon> กลับ
          </v-btn>
        </div>
      </template>

      <!-- Edit mode: draw signature -->
      <template v-else>
        <v-textarea v-model="overallComment" label="ความคิดเห็นสรุปโดยภาพรวมของการประเมิน" rows="3" class="mb-3" />

        <div class="text-body-2 font-weight-medium mb-2">ลงนามการประเมิน (วาดลายเซ็น):</div>
        <div style="border:2px solid rgba(99,102,241,0.3);border-radius:12px;background:rgba(0,0,0,0.2)">
          <canvas ref="signCanvas" width="500" height="150" @mousedown="startDraw" @mousemove="draw" @mouseup="endDraw" @mouseleave="endDraw" style="cursor:crosshair;display:block;width:100%;height:150px" />
        </div>
        <div class="d-flex ga-2 mt-2">
          <v-btn size="small" variant="text" @click="clearSignature"><v-icon start size="small">mdi-eraser</v-icon>ล้าง</v-btn>
        </div>

        <v-divider class="my-4" />
        <div class="d-flex ga-2 justify-end">
          <v-btn variant="text" @click="$router.back()">ยกเลิก</v-btn>
          <v-btn color="success" class="gradient-btn" @click="submitEvaluation" :loading="submitting" size="large">
            <v-icon start>mdi-send-check</v-icon> ยืนยันและส่งผลการประเมิน
          </v-btn>
        </div>
      </template>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../stores/auth'

const route = useRoute(); const router = useRouter(); const showSnackbar = inject('showSnackbar')
const assignmentId = route.params.assignmentId
const items = ref([]); const scores = reactive({}); const overallComment = ref(''); const submitting = ref(false)
const signCanvas = ref(null); let drawing = false; let ctx = null
const isCompleted = ref(false); const savedSignature = ref(null)

const groupedScores = computed(() => {
  const groups = {}
  items.value.forEach(item => {
    const title = item.topic_title || 'ไม่ระบุ'
    if (!groups[title]) groups[title] = []
    groups[title].push(item)
  })
  return groups
})

const ensureCtx = () => {
  if (!ctx && signCanvas.value) {
    ctx = signCanvas.value.getContext('2d')
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
  }
  return ctx
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/scores/assignment/${assignmentId}`)
    items.value = data.data || []
    items.value.forEach(item => {
      scores[item.indicator_id] = { score: item.score, comment: item.comment || '', _saving: false }
    })
  } catch(e){ console.error(e) }

  // Check if assignment is completed and load saved result
  try {
    const { data: assignData } = await api.get(`/assignments/committee/check/${assignmentId}`)
    if (assignData.data && assignData.data.status === 'completed') {
      isCompleted.value = true
      // Load saved evaluation result
      const { data: resultData } = await api.get(`/scores/result/${assignmentId}`)
      if (resultData.data) {
        overallComment.value = resultData.data.overall_comment || ''
        savedSignature.value = resultData.data.signature_image || null
      }
    }
  } catch(e){ console.error('load result error:', e) }
})

const saveScore = async (indicatorId) => {
  scores[indicatorId]._saving = true
  try {
    await api.post('/scores', { assignment_id: parseInt(assignmentId), indicator_id: indicatorId, score: scores[indicatorId].score, comment: scores[indicatorId].comment })
    showSnackbar('บันทึกคะแนนสำเร็จ')
  } catch(e){ showSnackbar('เกิดข้อผิดพลาด','error') }
  finally { scores[indicatorId]._saving = false }
}

const startDraw = (e) => {
  const c = ensureCtx()
  if (!c) return
  drawing = true
  const r = signCanvas.value.getBoundingClientRect()
  const scaleX = signCanvas.value.width / r.width
  const scaleY = signCanvas.value.height / r.height
  c.beginPath()
  c.moveTo((e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY)
}
const draw = (e) => {
  if (!drawing) return
  const c = ensureCtx()
  if (!c) return
  const r = signCanvas.value.getBoundingClientRect()
  const scaleX = signCanvas.value.width / r.width
  const scaleY = signCanvas.value.height / r.height
  c.lineTo((e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY)
  c.stroke()
}
const endDraw = () => { drawing = false }
const clearSignature = () => { const c = ensureCtx(); if (c) c.clearRect(0, 0, signCanvas.value.width, signCanvas.value.height) }

const submitEvaluation = async () => {
  submitting.value = true
  try {
    const sigData = signCanvas.value ? signCanvas.value.toDataURL() : null
    await api.post(`/scores/submit/${assignmentId}`, { overall_comment: overallComment.value, signature_image: sigData })
    showSnackbar('ส่งผลการประเมินสำเร็จ!', 'success')
    router.push('/committee/evaluations')
  } catch(e){ showSnackbar('เกิดข้อผิดพลาด','error') }
  finally { submitting.value = false }
}
</script>
