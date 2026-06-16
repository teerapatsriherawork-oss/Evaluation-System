<template>
  <div>
    <div class="d-flex align-center mb-6">
      <v-btn icon variant="text" @click="$router.back()" class="mr-2"><v-icon>mdi-arrow-left</v-icon></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text">จัดการตัวชี้วัด</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">หัวข้อและตัวชี้วัดในรอบประเมิน</p>
      </div>
      <v-spacer />
      <v-btn class="gradient-btn mr-2" @click="openTopicDialog()"><v-icon start>mdi-plus</v-icon> เพิ่มหัวข้อ</v-btn>
    </div>

    <!-- Topics + Indicators -->
    <v-expansion-panels variant="accordion" class="mb-4">
      <v-expansion-panel v-for="topic in topics" :key="topic.id" class="glass-card mb-3" rounded="xl">
        <v-expansion-panel-title>
          <div class="d-flex align-center flex-grow-1">
            <v-icon color="primary" class="mr-3">mdi-folder</v-icon>
            <div class="flex-grow-1">
              <span class="text-h6 font-weight-medium">{{ topic.title }}</span>
              <div class="text-caption text-medium-emphasis">{{ topic.indicators?.length || 0 }} ตัวชี้วัด</div>
            </div>
            <v-btn icon size="small" variant="text" @click.stop="openTopicDialog(topic)" class="mr-1"><v-icon size="small">mdi-pencil</v-icon></v-btn>
            <v-btn icon size="small" variant="text" color="error" @click.stop="deleteTopic(topic.id)" class="mr-2"><v-icon size="small">mdi-delete</v-icon></v-btn>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-btn size="small" color="secondary" variant="tonal" @click="openIndicatorDialog(topic.id)" class="mb-3">
            <v-icon start size="small">mdi-plus</v-icon> เพิ่มตัวชี้วัด
          </v-btn>
          <v-table density="compact" class="bg-transparent">
            <thead><tr><th>ชื่อตัวชี้วัด</th><th>รายละเอียด</th><th>น้ำหนัก</th><th>รูปแบบ</th><th>หลักฐาน</th><th width="100">จัดการ</th></tr></thead>
            <tbody>
              <tr v-for="ind in topic.indicators" :key="ind.id">
                <td>{{ ind.name }}</td>
                <td class="text-truncate" style="max-width:200px">{{ ind.description || '-' }}</td>
                <td>{{ ind.weight }}</td>
                <td>
                  <v-chip size="x-small" :color="ind.score_type === 'scale' ? 'primary' : 'info'" label>
                    {{ ind.score_type === 'scale' ? 'สเกล 1-4' : 'มี/ไม่มี' }}
                  </v-chip>
                </td>
                <td>
                  <v-chip size="x-small" color="secondary" label>{{ evidenceLabel(ind.evidence_type) }}</v-chip>
                </td>
                <td>
                  <v-btn icon size="x-small" variant="text" @click="openIndicatorDialog(topic.id, ind)"><v-icon size="small">mdi-pencil</v-icon></v-btn>
                  <v-btn icon size="x-small" variant="text" color="error" @click="deleteIndicator(ind.id)"><v-icon size="small">mdi-delete</v-icon></v-btn>
                </td>
              </tr>
              <tr v-if="!topic.indicators?.length"><td colspan="6" class="text-center text-medium-emphasis py-3">ยังไม่มีตัวชี้วัด</td></tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Topic Dialog -->
    <v-dialog v-model="topicDlg" max-width="450" persistent>
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="gradient-text font-weight-bold pa-0 mb-4">{{ topicEdit ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่' }}</v-card-title>
        <v-form @submit.prevent="saveTopic" ref="topicFormRef">
          <v-text-field v-model="topicForm.title" label="ชื่อหัวข้อ *" :rules="[r=>!!r||'กรุณากรอก']" />
          <v-textarea v-model="topicForm.description" label="รายละเอียด" rows="2" />
          <v-text-field v-model.number="topicForm.sort_order" label="ลำดับ" type="number" />
          <div class="d-flex ga-2 justify-end mt-2">
            <v-btn variant="text" @click="topicDlg=false">ยกเลิก</v-btn>
            <v-btn type="submit" class="gradient-btn" :loading="saving">บันทึก</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Indicator Dialog -->
    <v-dialog v-model="indDlg" max-width="550" persistent>
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="gradient-text font-weight-bold pa-0 mb-4">{{ indEdit ? 'แก้ไขตัวชี้วัด' : 'เพิ่มตัวชี้วัดใหม่' }}</v-card-title>
        <v-form @submit.prevent="saveIndicator" ref="indFormRef">
          <v-text-field v-model="indForm.name" label="ชื่อตัวชี้วัด *" :rules="[r=>!!r||'กรุณากรอก']" />
          <v-textarea v-model="indForm.description" label="รายละเอียด" rows="2" />
          <v-row dense>
            <v-col cols="4"><v-text-field v-model.number="indForm.weight" label="น้ำหนักคะแนน" type="number" step="0.01" /></v-col>
            <v-col cols="4">
              <v-select v-model="indForm.score_type" label="รูปแบบการประเมิน" :items="[{title:'สเกล 1-4',value:'scale'},{title:'มี/ไม่มี',value:'boolean'}]" />
            </v-col>
            <v-col cols="4">
              <v-select v-model="indForm.evidence_type" label="หลักฐาน" :items="[{title:'ไฟล์',value:'file'},{title:'URL',value:'url'},{title:'ทั้งสอง',value:'both'}]" />
            </v-col>
          </v-row>
          <!-- Scale Description -->
          <v-alert v-if="indForm.score_type === 'scale'" type="info" variant="tonal" density="compact" class="mb-3" rounded="lg">
            <div class="text-body-2">
              <strong>คำอธิบายระดับคะแนน:</strong><br/>
              ระดับ 1 — ปฏิบัติได้ต่ำกว่าระดับที่คาดหวังมาก<br/>
              ระดับ 2 — ปฏิบัติได้ต่ำกว่าระดับที่คาดหวัง<br/>
              ระดับ 3 — ปฏิบัติได้ตามระดับที่คาดหวัง<br/>
              ระดับ 4 — ปฏิบัติได้สูงกว่าระดับที่คาดหวัง
            </div>
          </v-alert>
          <div class="d-flex ga-2 justify-end">
            <v-btn variant="text" @click="indDlg=false">ยกเลิก</v-btn>
            <v-btn type="submit" class="gradient-btn" :loading="saving">บันทึก</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../../stores/auth'

const route = useRoute()
const showSnackbar = inject('showSnackbar')
const periodId = route.params.periodId
const topics = ref([])
const saving = ref(false)

// Topic
const topicDlg = ref(false); const topicEdit = ref(false); const topicEditId = ref(null)
const topicForm = reactive({ title: '', description: '', sort_order: 0 })
const topicFormRef = ref(null)

// Indicator
const indDlg = ref(false); const indEdit = ref(false); const indEditId = ref(null); const indTopicId = ref(null)
const indForm = reactive({ name: '', description: '', weight: 1, score_type: 'scale', evidence_type: 'both', sort_order: 0 })
const indFormRef = ref(null)

const evidenceLabel = t => ({ file: 'ไฟล์', url: 'URL', both: 'ไฟล์+URL' }[t] || t)

const fetchTopics = async () => {
  try {
    const { data } = await api.get(`/evaluations/${periodId}/topics`)
    const topicsData = data.data || []
    for (const t of topicsData) {
      const res = await api.get(`/topics/${t.id}/indicators`)
      t.indicators = res.data.data || []
    }
    topics.value = topicsData
  } catch (e) { console.error(e) }
}

const openTopicDialog = (t = null) => {
  if (t) { topicEdit.value = true; topicEditId.value = t.id; Object.assign(topicForm, { title: t.title, description: t.description, sort_order: t.sort_order }) }
  else { topicEdit.value = false; topicEditId.value = null; Object.assign(topicForm, { title: '', description: '', sort_order: 0 }) }
  topicDlg.value = true
}

const saveTopic = async () => {
  const { valid } = await topicFormRef.value.validate(); if (!valid) return
  saving.value = true
  try {
    if (topicEdit.value) await api.put(`/topics/${topicEditId.value}`, topicForm)
    else await api.post(`/evaluations/${periodId}/topics`, topicForm)
    topicDlg.value = false; await fetchTopics(); showSnackbar('บันทึกสำเร็จ')
  } catch (e) { showSnackbar('เกิดข้อผิดพลาด', 'error') }
  finally { saving.value = false }
}

const deleteTopic = async (id) => {
  try { await api.delete(`/topics/${id}`); await fetchTopics(); showSnackbar('ลบสำเร็จ') }
  catch (e) { showSnackbar('เกิดข้อผิดพลาด', 'error') }
}

const openIndicatorDialog = (topicId, ind = null) => {
  indTopicId.value = topicId
  if (ind) { indEdit.value = true; indEditId.value = ind.id; Object.assign(indForm, ind) }
  else { indEdit.value = false; indEditId.value = null; Object.assign(indForm, { name: '', description: '', weight: 1, score_type: 'scale', evidence_type: 'both', sort_order: 0 }) }
  indDlg.value = true
}

const saveIndicator = async () => {
  const { valid } = await indFormRef.value.validate(); if (!valid) return
  saving.value = true
  try {
    if (indEdit.value) await api.put(`/indicators/${indEditId.value}`, indForm)
    else await api.post(`/topics/${indTopicId.value}/indicators`, indForm)
    indDlg.value = false; await fetchTopics(); showSnackbar('บันทึกสำเร็จ')
  } catch (e) { showSnackbar('เกิดข้อผิดพลาด', 'error') }
  finally { saving.value = false }
}

const deleteIndicator = async (id) => {
  try { await api.delete(`/indicators/${id}`); await fetchTopics(); showSnackbar('ลบสำเร็จ') }
  catch (e) { showSnackbar('เกิดข้อผิดพลาด', 'error') }
}

onMounted(fetchTopics)
</script>
