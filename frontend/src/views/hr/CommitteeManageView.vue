<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div><h1 class="text-h4 font-weight-bold gradient-text">จัดการกรรมการ</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">เพิ่มรายชื่อกรรมการผู้ประเมิน และจัดการข้อมูลผู้รับการประเมิน</p></div>
      <v-spacer />
      <v-btn class="gradient-btn" @click="add"><v-icon start>mdi-plus</v-icon> เพิ่มผู้ใช้</v-btn>
    </div>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="committee"><v-icon start>mdi-gavel</v-icon> กรรมการ</v-tab>
      <v-tab value="evaluatee"><v-icon start>mdi-account</v-icon> ผู้รับการประเมิน</v-tab>
    </v-tabs>

    <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="ค้นหา..." clearable density="compact" class="mb-4" style="max-width:400px" />

    <v-card class="glass-card">
      <v-table density="comfortable" class="bg-transparent">
        <thead><tr><th>ชื่อ-สกุล</th><th>ชื่อผู้ใช้</th><th>อีเมล</th><th>แผนก</th><th>ตำแหน่ง</th><th>บทบาท</th><th width="100">จัดการ</th></tr></thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id">
            <td>{{ u.full_name }}</td><td>{{ u.username }}</td><td>{{ u.email || '-' }}</td>
            <td>{{ u.department || '-' }}</td><td>{{ u.position || '-' }}</td>
            <td><v-chip size="x-small" :color="roleColor(u.role)" label>{{ roleLabel(u.role) }}</v-chip></td>
            <td>
              <v-btn icon size="x-small" variant="text" @click="openEdit(u)"><v-icon size="small">mdi-pencil</v-icon></v-btn>
              <v-btn icon size="x-small" variant="text" color="error" @click="remove(u.id)"><v-icon size="small">mdi-delete</v-icon></v-btn>
            </td>
          </tr>
          <tr v-if="filtered.length===0"><td colspan="7" class="text-center text-medium-emphasis py-4">ไม่พบข้อมูล</td></tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="gradient-text font-weight-bold pa-0 mb-4">{{ isEdit() ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่' }}</v-card-title>
        <v-form @submit.prevent="saveUser" ref="formRef">
          <v-text-field v-model="form.full_name" label="ชื่อ-สกุล *" :rules="[req]" />
          <v-row dense>
            <v-col cols="6"><v-text-field v-model="form.username" label="ชื่อผู้ใช้ *" :rules="[req]" :disabled="isEdit()" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.password" label="รหัสผ่าน" type="password" :placeholder="isEdit()?'(ไม่เปลี่ยน)':''" /></v-col>
          </v-row>
          <v-text-field v-model="form.email" label="อีเมล" />
          <v-row dense>
            <v-col cols="4"><v-text-field v-model="form.phone" label="เบอร์โทร" /></v-col>
            <v-col cols="4"><v-text-field v-model="form.department" label="แผนก" /></v-col>
            <v-col cols="4"><v-select v-model="form.role" label="บทบาท" :items="roleOptions" /></v-col>
          </v-row>
          <v-text-field v-model="form.position" label="ตำแหน่ง" />
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
import { ref, computed } from 'vue'
import { useCrud } from '../../composables/useCrud'
import { useNotify } from '../../composables/useNotify'
import { api } from '../../lib/api'
import { roleColor, roleLabel } from '../../lib/format'

const req = (v) => !!v || 'กรุณากรอกข้อมูล'
const roleOptions = [
  { title: 'กรรมการ', value: 'committee' },
  { title: 'ผู้รับการประเมิน', value: 'evaluatee' },
  { title: 'ฝ่ายบุคลากร', value: 'hr' }
]
const { items, saving, dialog, form, isEdit, editId, load, openCreate, openEdit, remove } =
  useCrud('/users', { full_name: '', username: '', password: '', email: '', phone: '', department: '', position: '', role: 'committee' })
const { success, error } = useNotify()
const tab = ref('committee')
const search = ref('')
const formRef = ref(null)

const filtered = computed(() => {
  let list = items.value.filter(u => u.role === tab.value)
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(u => u.full_name?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s))
  }
  return list
})

const add = () => openCreate({ role: tab.value })

// save แบบ custom: สร้าง = /auth/register, แก้ไข = /users/:id (+ เปลี่ยนรหัสถ้ากรอก)
const saveUser = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    if (isEdit()) {
      await api.put(`/users/${editId.value}`, form)
      if (form.password) await api.put(`/users/${editId.value}/password`, { new_password: form.password })
    } else {
      await api.post('/auth/register', form)
    }
    dialog.value = false
    await load()
    success('บันทึกสำเร็จ')
  } catch (e) {
    error(e.response?.data?.message)
  } finally {
    saving.value = false
  }
}

load()
</script>
