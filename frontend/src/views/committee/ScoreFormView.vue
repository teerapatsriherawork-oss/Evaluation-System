<template>
  <div>
    <div class="d-flex align-center mb-6">
      <v-btn icon variant="text" @click="$router.back()" class="mr-2"><v-icon>mdi-arrow-left</v-icon></v-btn>
      <div><h1 class="text-h4 font-weight-bold gradient-text">{{ isCompleted ? 'ผลการประเมิน' : 'แบบประเมิน' }}</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">{{ isCompleted ? 'ดูรายละเอียดผลการประเมินที่บันทึกไว้' : 'ให้คะแนนผู้รับการประเมินตามตัวชี้วัด' }}</p></div>
    </div>

    <v-alert v-if="isCompleted" type="success" variant="tonal" class="mb-4" rounded="lg">
      <v-icon start>mdi-check-circle</v-icon>
      การประเมินนี้เสร็จสิ้นแล้ว — แสดงผลแบบอ่านอย่างเดียว
    </v-alert>

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

            <!-- คะแนนประเมินตนเองของผู้รับการประเมิน -->
            <v-alert v-if="item.self_score !== null && item.self_score !== undefined" type="info" variant="tonal" density="compact" class="mb-3" rounded="lg">
              <div class="text-body-2">
                <strong>คะแนนประเมินตนเอง:</strong> {{ item.self_score }}
                <span v-if="item.self_data" class="ml-3">| ข้อมูล: {{ item.self_data }}</span>
              </div>
              <div v-if="item.evidence_file" class="mt-1">
                <v-icon size="small" class="mr-1">mdi-paperclip</v-icon>
                <a :href="item.evidence_file" target="_blank" class="text-info">ดูหลักฐาน</a>
              </div>
              <div v-if="item.evidence_url" class="mt-1">
                <v-icon size="small" class="mr-1">mdi-link</v-icon>
                <a :href="item.evidence_url" target="_blank" class="text-info">{{ item.evidence_url }}</a>
              </div>
            </v-alert>

            <!-- คะแนนจากกรรมการ -->
            <div class="mb-2">
              <div class="text-body-2 font-weight-medium mb-1">คะแนนจากกรรมการ:</div>
              <template v-if="item.score_type === 'scale'">
                <v-btn-toggle v-model="scores[item.indicator_id].score" color="primary" rounded="lg" density="compact" :disabled="isCompleted">
                  <v-btn v-for="n in 4" :key="n" :value="n" size="small">{{ n }}</v-btn>
                </v-btn-toggle>
                <div class="text-caption text-medium-emphasis mt-1">
                  <span v-for="(lvl, i) in levelsOf(item)" :key="i" class="mr-3">{{ i + 1 }} = {{ lvl }}</span>
                </div>
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

    <!-- สรุปและลงนาม -->
    <v-card class="glass-card pa-6 mt-4" v-if="Object.keys(groupedScores).length">
      <div class="text-h6 font-weight-medium mb-4"><v-icon color="primary" class="mr-2">mdi-draw-pen</v-icon>สรุปและลงนาม</div>

      <template v-if="isCompleted">
        <div class="mb-4">
          <div class="text-body-2 font-weight-medium mb-1">ความคิดเห็นสรุป:</div>
          <v-card variant="outlined" class="pa-3" rounded="lg"><div class="text-body-1">{{ overallComment || '(ไม่มีความคิดเห็น)' }}</div></v-card>
        </div>
        <div v-if="savedSignature" class="mb-4">
          <div class="text-body-2 font-weight-medium mb-2">ลายเซ็น:</div>
          <div style="border:2px solid rgba(99,102,241,0.3);border-radius:12px;background:rgba(0,0,0,0.2);padding:8px">
            <img :src="savedSignature" alt="ลายเซ็น" style="max-width:100%;height:auto;display:block" />
          </div>
        </div>
        <v-divider class="my-4" />
        <div class="d-flex ga-2 justify-end">
          <v-btn variant="tonal" color="warning" @click="unsubmit" :loading="submitting" rounded="lg">
            <v-icon start>mdi-pencil</v-icon> ยกเลิกลายเซ็น / แก้ไข
          </v-btn>
          <v-btn variant="tonal" color="primary" @click="$router.back()" rounded="lg"><v-icon start>mdi-arrow-left</v-icon> กลับ</v-btn>
        </div>
      </template>

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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../lib/api'
import { useNotify } from '../../composables/useNotify'
import { useConfirm } from '../../composables/useConfirm'
import { parseScoreLevels } from '../../lib/format'

const route = useRoute()
const router = useRouter()
const { success, error } = useNotify()
const confirm = useConfirm()
const assignmentId = route.params.assignmentId
const items = ref([])
const scores = reactive({})
const overallComment = ref('')
const submitting = ref(false)
const signCanvas = ref(null)
const isCompleted = ref(false)
const savedSignature = ref(null)
const hasSigned = ref(false)
let drawing = false
let ctx = null

const groupedScores = computed(() => {
  const groups = {}
  items.value.forEach(item => {
    const title = item.topic_title || 'ไม่ระบุ'
    ;(groups[title] ||= []).push(item)
  })
  return groups
})

const levelsOf = (item) => parseScoreLevels(item.score_levels)

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
    items.value = (await api.get(`/scores/assignment/${assignmentId}`)).data.data || []
    items.value.forEach(item => {
      scores[item.indicator_id] = { score: item.score, comment: item.comment || '', _saving: false }
    })
  } catch (e) { console.error(e) }

  // ถ้าประเมินเสร็จแล้ว → โหลดผล + ลายเซ็นที่บันทึก แล้วแสดงแบบอ่านอย่างเดียว
  try {
    const assign = (await api.get(`/assignments/committee/check/${assignmentId}`)).data.data
    if (assign?.status === 'completed') {
      isCompleted.value = true
      const result = (await api.get(`/scores/result/${assignmentId}`)).data.data
      if (result) {
        overallComment.value = result.overall_comment || ''
        savedSignature.value = result.signature_image || null
      }
    }
  } catch (e) { console.error('load result error:', e) }
})

const saveScore = async (indicatorId) => {
  scores[indicatorId]._saving = true
  try {
    await api.post('/scores', { assignment_id: parseInt(assignmentId), indicator_id: indicatorId, score: scores[indicatorId].score, comment: scores[indicatorId].comment })
    success('บันทึกคะแนนสำเร็จ')
  } catch (e) { error() } finally { scores[indicatorId]._saving = false }
}

// ----- ลายเซ็นบน canvas -----
const pos = (e) => {
  const r = signCanvas.value.getBoundingClientRect()
  return [(e.clientX - r.left) * (signCanvas.value.width / r.width), (e.clientY - r.top) * (signCanvas.value.height / r.height)]
}
const startDraw = (e) => {
  const c = ensureCtx(); if (!c) return
  drawing = true; c.beginPath(); c.moveTo(...pos(e))
}
const draw = (e) => {
  if (!drawing) return
  const c = ensureCtx(); if (!c) return
  c.lineTo(...pos(e)); c.stroke()
  hasSigned.value = true
}
const endDraw = () => { drawing = false }
const clearSignature = () => { const c = ensureCtx(); if (c) c.clearRect(0, 0, signCanvas.value.width, signCanvas.value.height); hasSigned.value = false }

const submitEvaluation = async () => {
  // ต้องให้คะแนนครบทุกตัวชี้วัด + ลงลายเซ็นก่อนส่ง
  const missing = items.value.filter(i => scores[i.indicator_id]?.score == null)
  if (missing.length) return error(`กรุณาให้คะแนนให้ครบทุกตัวชี้วัด (ขาดอีก ${missing.length} รายการ)`)
  if (!hasSigned.value) return error('กรุณาลงลายเซ็นก่อนส่งผลการประเมิน')
  if (!(await confirm({ title: 'ยืนยันส่งผลการประเมิน', message: 'เมื่อส่งแล้วสถานะจะเป็น "เสร็จสิ้น"\n(ยังยกเลิกลายเซ็นเพื่อแก้ไขภายหลังได้)', color: 'success', confirmText: 'ส่งผล', icon: 'mdi-send-check' }))) return
  submitting.value = true
  try {
    const sigData = signCanvas.value ? signCanvas.value.toDataURL() : null
    await api.post(`/scores/submit/${assignmentId}`, { overall_comment: overallComment.value, signature_image: sigData })
    success('ส่งผลการประเมินสำเร็จ!')
    router.push('/committee/evaluations')
  } catch (e) { error() } finally { submitting.value = false }
}

// ยกเลิกการลงนาม → กลับมาแก้ไขได้ (เกณฑ์ 5.3.8)
const unsubmit = async () => {
  if (!(await confirm({ title: 'ยกเลิกการลงนาม', message: 'ผลการประเมินจะกลับมาแก้ไขได้อีกครั้ง', color: 'warning', confirmText: 'ยกเลิกลายเซ็น' }))) return
  submitting.value = true
  try {
    await api.post(`/scores/unsubmit/${assignmentId}`)
    success('ยกเลิกการลงนามแล้ว — กรุณาตรวจคะแนนและลงลายเซ็นใหม่ก่อนส่ง')
    isCompleted.value = false
    savedSignature.value = null
    hasSigned.value = false
  } catch (e) { error() } finally { submitting.value = false }
}
</script>
