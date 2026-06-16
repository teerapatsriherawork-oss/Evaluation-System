<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">ประเมินตนเอง</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">เพิ่มข้อมูล หลักฐาน และกรอกคะแนนประเมินตนเองในแต่ละตัวชี้วัด</p>

    <v-expansion-panels variant="accordion">
      <v-expansion-panel v-for="(group, topicTitle) in groupedIndicators" :key="topicTitle" class="glass-card mb-3" rounded="xl">
        <v-expansion-panel-title>
          <v-icon color="primary" class="mr-3">mdi-folder-open</v-icon>
          <span class="text-h6 font-weight-medium">{{ topicTitle }}</span>
          <v-spacer />
          <v-chip size="small" color="secondary" variant="tonal" class="mr-2">{{ completedCount(group) }}/{{ group.length }}</v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-card v-for="ind in group" :key="ind.id" class="mb-3 pa-4" variant="outlined" rounded="lg" :class="{'border-success': assessments[ind.id]?.status === 'submitted'}">
            <div class="d-flex align-center mb-2">
              <v-icon size="small" :color="assessments[ind.id]?.status==='submitted'?'success':'grey'" class="mr-2">
                {{ assessments[ind.id]?.status==='submitted' ? 'mdi-check-circle' : 'mdi-circle-outline' }}
              </v-icon>
              <span class="font-weight-medium">{{ ind.name }}</span>
              <v-spacer />
              <v-chip size="x-small" color="primary" label class="mr-1">น้ำหนัก: {{ ind.weight }}</v-chip>
              <v-chip size="x-small" :color="ind.score_type==='scale'?'info':'secondary'" label>{{ ind.score_type==='scale'?'สเกล 1-4':'มี/ไม่มี' }}</v-chip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-3" v-if="ind.description">{{ ind.description }}</p>

            <!-- Score Input -->
            <div class="mb-3">
              <template v-if="ind.score_type === 'scale'">
                <div class="text-body-2 mb-1 font-weight-medium">คะแนนประเมินตนเอง:</div>
                <v-btn-toggle v-model="assessments[ind.id].self_score" color="primary" rounded="lg" density="compact">
                  <v-btn :value="1" size="small">1<div class="text-caption">ต่ำกว่ามาก</div></v-btn>
                  <v-btn :value="2" size="small">2<div class="text-caption">ต่ำกว่า</div></v-btn>
                  <v-btn :value="3" size="small">3<div class="text-caption">ตามคาดหวัง</div></v-btn>
                  <v-btn :value="4" size="small">4<div class="text-caption">สูงกว่า</div></v-btn>
                </v-btn-toggle>
              </template>
              <template v-else>
                <v-switch v-model="assessments[ind.id].self_score" :true-value="1" :false-value="0" label="มี / ไม่มี" color="success" />
              </template>
            </div>

            <!-- Data / Evidence -->
            <v-textarea v-model="assessments[ind.id].self_data" label="ข้อมูลเพิ่มเติม / รายละเอียด" rows="2" density="compact" class="mb-2" />

            <v-row dense v-if="ind.evidence_type !== 'url'">
              <v-col cols="12" sm="6">
                <v-file-input v-model="assessments[ind.id]._file" label="แนบไฟล์หลักฐาน (PDF/รูปภาพ)" prepend-icon="mdi-paperclip" density="compact" accept=".pdf,.jpg,.jpeg,.png" @update:model-value="uploadEvidence(ind.id)" />
              </v-col>
              <v-col cols="12" sm="6" v-if="assessments[ind.id].evidence_file">
                <v-chip color="success" variant="tonal" size="small" prepend-icon="mdi-file-check">{{ assessments[ind.id].evidence_file }}</v-chip>
              </v-col>
            </v-row>

            <v-text-field v-if="ind.evidence_type !== 'file'" v-model="assessments[ind.id].evidence_url" label="URL หลักฐาน" prepend-inner-icon="mdi-link" density="compact" class="mb-2" />

            <div class="d-flex ga-2 justify-end">
              <v-btn size="small" variant="tonal" @click="saveAssessment(ind.id, 'draft')" :loading="assessments[ind.id]._saving">
                <v-icon start size="small">mdi-content-save</v-icon>บันทึกร่าง
              </v-btn>
              <v-btn size="small" color="success" variant="flat" @click="saveAssessment(ind.id, 'submitted')" :loading="assessments[ind.id]._saving">
                <v-icon start size="small">mdi-send</v-icon>ส่ง
              </v-btn>
            </div>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card v-if="!Object.keys(groupedIndicators).length && !loading" class="glass-card pa-10 text-center">
      <v-icon size="64" color="secondary" class="mb-3">mdi-clipboard-text-clock</v-icon>
      <h3 class="text-h5 mb-2">ยังไม่มีตัวชี้วัด</h3>
      <p class="text-medium-emphasis">รอฝ่ายบุคลากรเพิ่มรอบประเมินและตัวชี้วัด</p>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useAuthStore, api } from '../../stores/auth'
const auth = useAuthStore(); const showSnackbar = inject('showSnackbar')
const loading = ref(false); const indicators = ref([]); const assessments = reactive({})

const groupedIndicators = computed(() => {
  const groups = {}
  indicators.value.forEach(ind => {
    const title = ind.topic_title || 'ไม่ระบุหัวข้อ'
    if (!groups[title]) groups[title] = []
    groups[title].push(ind)
  })
  return groups
})

const completedCount = group => group.filter(ind => assessments[ind.id]?.status === 'submitted').length

const fetchData = async () => {
  loading.value = true
  try {
    const pRes = await api.get('/evaluations?is_active=true')
    const activePeriods = pRes.data.data || []
    if (activePeriods.length === 0) { loading.value = false; return }
    const indRes = await api.get(`/indicators/period/${activePeriods[0].id}`)
    indicators.value = indRes.data.data || []

    // Initialize assessments
    indicators.value.forEach(ind => {
      if (!assessments[ind.id]) {
        assessments[ind.id] = { self_score: null, self_data: '', evidence_file: '', evidence_url: '', status: 'draft', _file: null, _saving: false }
      }
    })

    // Fetch existing self-assessments
    const saRes = await api.get(`/self-assessments/${auth.user.id}`)
    const existing = saRes.data.data || []
    existing.forEach(sa => {
      if (assessments[sa.indicator_id]) {
        Object.assign(assessments[sa.indicator_id], { self_score: sa.self_score, self_data: sa.self_data, evidence_file: sa.evidence_file, evidence_url: sa.evidence_url, status: sa.status })
      }
    })
  } catch(e){ console.error(e) } finally { loading.value = false }
}

const uploadEvidence = async (indId) => {
  const file = assessments[indId]._file
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    assessments[indId].evidence_file = data.data.file_path
    showSnackbar('อัปโหลดสำเร็จ')
  } catch(e){ showSnackbar('อัปโหลดล้มเหลว','error') }
}

const saveAssessment = async (indId, status) => {
  assessments[indId]._saving = true
  try {
    await api.post('/self-assessments', {
      indicator_id: indId,
      self_score: assessments[indId].self_score,
      self_data: assessments[indId].self_data,
      evidence_file: assessments[indId].evidence_file,
      evidence_url: assessments[indId].evidence_url,
      status
    })
    assessments[indId].status = status
    showSnackbar(status === 'submitted' ? 'ส่งสำเร็จ' : 'บันทึกร่างสำเร็จ')
  } catch(e){ showSnackbar('เกิดข้อผิดพลาด','error') }
  finally { assessments[indId]._saving = false }
}

onMounted(fetchData)
</script>
