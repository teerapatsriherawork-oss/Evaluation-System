<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div><h1 class="text-h4 font-weight-bold gradient-text">มอบหมายกรรมการ</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">มอบหมายกรรมการให้ประเมินผู้รับการประเมินแต่ละคน</p></div>
      <v-spacer />
      <v-btn class="gradient-btn" @click="openDialog()"><v-icon start>mdi-plus</v-icon> มอบหมาย</v-btn>
    </div>

    <v-row dense class="mb-4">
      <v-col cols="12" sm="4">
        <v-select v-model="filterPeriod" :items="periodItems" label="รอบประเมิน" clearable density="compact" @update:model-value="fetchAssignments" />
      </v-col>
    </v-row>

    <v-card class="glass-card">
      <v-table density="comfortable" class="bg-transparent">
        <thead><tr><th>ผู้รับการประเมิน</th><th>กรรมการ</th><th>บทบาท</th><th>รอบประเมิน</th><th>สถานะ</th><th width="100">จัดการ</th></tr></thead>
        <tbody>
          <tr v-for="a in assignments" :key="a.id">
            <td>{{ a.evaluatee_name }}</td>
            <td>{{ a.committee_name }}</td>
            <td><v-chip size="x-small" :color="a.committee_role==='chairman'?'warning':'info'" label>{{ a.committee_role==='chairman'?'ประธาน':'กรรมการ' }}</v-chip></td>
            <td>{{ a.period_title }}</td>
            <td><v-chip size="x-small" :color="statusColor(a.status)" label>{{ statusLabel(a.status) }}</v-chip></td>
            <td><v-btn icon size="x-small" color="error" variant="text" @click="deleteAssignment(a.id)"><v-icon size="small">mdi-delete</v-icon></v-btn></td>
          </tr>
          <tr v-if="assignments.length===0"><td colspan="6" class="text-center text-medium-emphasis py-4">ไม่พบข้อมูล</td></tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="gradient-text font-weight-bold pa-0 mb-4">มอบหมายกรรมการ</v-card-title>
        <v-form @submit.prevent="saveAssignment" ref="formRef">
          <v-select v-model="form.period_id" :items="periodItems" label="รอบประเมิน *" :rules="[r=>!!r||'กรุณาเลือก']" />
          <v-select v-model="form.committee_id" :items="committeeItems" label="กรรมการ *" :rules="[r=>!!r||'กรุณาเลือก']" />
          <v-select v-model="form.evaluatee_id" :items="evaluateeItems" label="ผู้รับการประเมิน *" :rules="[r=>!!r||'กรุณาเลือก']" />
          <v-select v-model="form.committee_role" :items="[{title:'ประธาน',value:'chairman'},{title:'กรรมการร่วม',value:'member'}]" label="บทบาทกรรมการ" />
          <div class="d-flex ga-2 justify-end mt-2">
            <v-btn variant="text" @click="dialog=false">ยกเลิก</v-btn>
            <v-btn type="submit" class="gradient-btn" :loading="saving">บันทึก</v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { api } from '../../stores/auth'
const showSnackbar = inject('showSnackbar')
const assignments = ref([]); const periods = ref([]); const committees = ref([]); const evaluatees = ref([])
const filterPeriod = ref(null); const dialog = ref(false); const saving = ref(false); const formRef = ref(null)
const form = reactive({ period_id: null, committee_id: null, evaluatee_id: null, committee_role: 'member' })

const periodItems = ref([]); const committeeItems = ref([]); const evaluateeItems = ref([])

const statusColor = s => ({pending:'grey',in_progress:'warning',completed:'success'}[s]||'grey')
const statusLabel = s => ({pending:'รอดำเนินการ',in_progress:'กำลังประเมิน',completed:'เสร็จสิ้น'}[s]||s)

const fetchAssignments = async () => {
  try {
    let url = '/assignments'; if (filterPeriod.value) url += `?period_id=${filterPeriod.value}`
    const { data } = await api.get(url); assignments.value = data.data || []
  } catch(e){}
}

const fetchData = async () => {
  try {
    const [pRes, uRes] = await Promise.all([api.get('/evaluations'), api.get('/users')])
    periods.value = pRes.data.data || []
    periodItems.value = periods.value.map(p => ({ title: p.title, value: p.id }))
    const users = uRes.data.data || []
    committeeItems.value = users.filter(u=>u.role==='committee').map(u=>({title:u.full_name,value:u.id}))
    evaluateeItems.value = users.filter(u=>u.role==='evaluatee').map(u=>({title:u.full_name,value:u.id}))
  } catch(e){}
}

const openDialog = () => { Object.assign(form, { period_id: filterPeriod.value, committee_id: null, evaluatee_id: null, committee_role: 'member' }); dialog.value = true }

const saveAssignment = async () => {
  const { valid } = await formRef.value.validate(); if (!valid) return; saving.value = true
  try { await api.post('/assignments', form); dialog.value = false; await fetchAssignments(); showSnackbar('มอบหมายสำเร็จ') }
  catch(e){ showSnackbar(e.response?.data?.message||'เกิดข้อผิดพลาด','error') } finally { saving.value = false }
}

const deleteAssignment = async id => {
  try { await api.delete(`/assignments/${id}`); await fetchAssignments(); showSnackbar('ลบสำเร็จ') } catch(e){ showSnackbar('เกิดข้อผิดพลาด','error') }
}

onMounted(async () => { await fetchData(); await fetchAssignments() })
</script>
