<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div><h1 class="text-h4 font-weight-bold gradient-text">มอบหมายกรรมการ</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">มอบหมายกรรมการให้ประเมินผู้รับการประเมินแต่ละคน</p></div>
      <v-spacer />
      <v-btn class="gradient-btn" @click="add"><v-icon start>mdi-plus</v-icon> มอบหมาย</v-btn>
    </div>

    <v-row dense class="mb-4">
      <v-col cols="12" sm="4">
        <v-select v-model="filterPeriod" :items="periodItems" label="รอบประเมิน" clearable density="compact" @update:model-value="reload" />
      </v-col>
    </v-row>

    <v-card class="glass-card">
      <v-table density="comfortable" class="bg-transparent">
        <thead><tr><th>ผู้รับการประเมิน</th><th>กรรมการ</th><th>บทบาท</th><th>รอบประเมิน</th><th>สถานะ</th><th width="100">จัดการ</th></tr></thead>
        <tbody>
          <tr v-for="a in items" :key="a.id">
            <td>{{ a.evaluatee_name }}</td>
            <td>{{ a.committee_name }}</td>
            <td><v-chip size="x-small" :color="a.committee_role==='chairman'?'warning':'info'" label>{{ a.committee_role==='chairman'?'ประธาน':'กรรมการ' }}</v-chip></td>
            <td>{{ a.period_title }}</td>
            <td><StatusChip :status="a.status" /></td>
            <td><v-btn icon size="x-small" color="error" variant="text" @click="remove(a.id, { message: `ลบการมอบหมาย: ${a.committee_name} ประเมิน ${a.evaluatee_name}?` })"><v-icon size="small">mdi-delete</v-icon></v-btn></td>
          </tr>
          <tr v-if="items.length===0"><td colspan="6" class="text-center text-medium-emphasis py-4">ไม่พบข้อมูล</td></tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="gradient-text font-weight-bold pa-0 mb-4">มอบหมายกรรมการ</v-card-title>
        <v-form @submit.prevent="onSave" ref="formRef">
          <v-select v-model="form.period_id" :items="periodItems" label="รอบประเมิน *" :rules="[req]" />
          <v-select v-model="form.committee_id" :items="committeeItems" label="กรรมการ *" :rules="[req]" />
          <v-select v-model="form.evaluatee_id" :items="evaluateeItems" label="ผู้รับการประเมิน *" :rules="[req]" />
          <v-select v-model="form.committee_role" :items="roleOptions" label="บทบาทกรรมการ" />
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
import { ref } from 'vue'
import { useCrud } from '../../composables/useCrud'
import { api } from '../../lib/api'
import StatusChip from '../../components/StatusChip.vue'

const req = (v) => !!v || 'กรุณาเลือก'
const roleOptions = [{ title: 'ประธาน', value: 'chairman' }, { title: 'กรรมการร่วม', value: 'member' }]
const { items, saving, dialog, form, openCreate, save, remove, load } =
  useCrud('/assignments', { period_id: null, committee_id: null, evaluatee_id: null, committee_role: 'member' })
const filterPeriod = ref(null)
const formRef = ref(null)
const periodItems = ref([]); const committeeItems = ref([]); const evaluateeItems = ref([])

const reload = () => load(filterPeriod.value ? `?period_id=${filterPeriod.value}` : '')

const loadMasters = async () => {
  const [pRes, uRes] = await Promise.all([api.get('/evaluations'), api.get('/users')])
  periodItems.value = (pRes.data.data || []).map(p => ({ title: p.title, value: p.id }))
  const users = uRes.data.data || []
  committeeItems.value = users.filter(u => u.role === 'committee').map(u => ({ title: u.full_name, value: u.id }))
  evaluateeItems.value = users.filter(u => u.role === 'evaluatee').map(u => ({ title: u.full_name, value: u.id }))
}

const add = () => openCreate({ period_id: filterPeriod.value })
const onSave = async () => { if (await save(formRef.value)) reload() }

loadMasters()
reload()
</script>
