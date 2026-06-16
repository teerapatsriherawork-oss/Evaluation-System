<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div><h1 class="text-h4 font-weight-bold gradient-text">จัดการกรรมการ</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">เพิ่มรายชื่อกรรมการผู้ประเมิน และจัดการข้อมูลผู้รับการประเมิน</p></div>
      <v-spacer />
      <v-btn class="gradient-btn" @click="openDialog()"><v-icon start>mdi-plus</v-icon> เพิ่มผู้ใช้</v-btn>
    </div>
    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="committee"><v-icon start>mdi-gavel</v-icon> กรรมการ</v-tab>
      <v-tab value="evaluatee"><v-icon start>mdi-account</v-icon> ผู้รับการประเมิน</v-tab>
    </v-tabs>

    <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="ค้นหา..." clearable density="compact" class="mb-4" style="max-width:400px" />

    <v-card class="glass-card">
      <v-table density="comfortable" class="bg-transparent">
        <thead><tr><th>ชื่อ-สกุล</th><th>ชื่อผู้ใช้</th><th>อีเมล</th><th>แผนก</th><th>ตำแหน่ง</th><th>บทบาท</th><th width="100">จัดการ</th></tr></thead>
        <tbody>
          <tr v-for="u in filteredUsers" :key="u.id">
            <td>{{ u.full_name }}</td><td>{{ u.username }}</td><td>{{ u.email || '-' }}</td>
            <td>{{ u.department || '-' }}</td><td>{{ u.position || '-' }}</td>
            <td><v-chip size="x-small" :color="roleColor(u.role)" label>{{ roleLabel(u.role) }}</v-chip></td>
            <td>
              <v-btn icon size="x-small" variant="text" @click="openDialog(u)"><v-icon size="small">mdi-pencil</v-icon></v-btn>
              <v-btn icon size="x-small" variant="text" color="error" @click="deleteUser(u.id)"><v-icon size="small">mdi-delete</v-icon></v-btn>
            </td>
          </tr>
          <tr v-if="filteredUsers.length===0"><td colspan="7" class="text-center text-medium-emphasis py-4">ไม่พบข้อมูล</td></tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card class="glass-card pa-6" rounded="xl">
        <v-card-title class="gradient-text font-weight-bold pa-0 mb-4">{{ editMode ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่' }}</v-card-title>
        <v-form @submit.prevent="saveUser" ref="formRef">
          <v-text-field v-model="form.full_name" label="ชื่อ-สกุล *" :rules="[r=>!!r||'กรุณากรอก']" />
          <v-row dense>
            <v-col cols="6"><v-text-field v-model="form.username" label="ชื่อผู้ใช้ *" :rules="[r=>!!r||'กรุณากรอก']" :disabled="editMode" /></v-col>
            <v-col cols="6"><v-text-field v-model="form.password" label="รหัสผ่าน" :type="'password'" :placeholder="editMode?'(ไม่เปลี่ยน)':''" /></v-col>
          </v-row>
          <v-text-field v-model="form.email" label="อีเมล" />
          <v-row dense>
            <v-col cols="4"><v-text-field v-model="form.phone" label="เบอร์โทร" /></v-col>
            <v-col cols="4"><v-text-field v-model="form.department" label="แผนก" /></v-col>
            <v-col cols="4">
              <v-select v-model="form.role" label="บทบาท" :items="[{title:'กรรมการ',value:'committee'},{title:'ผู้รับการประเมิน',value:'evaluatee'},{title:'ฝ่ายบุคลากร',value:'hr'}]" />
            </v-col>
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
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { api } from '../../stores/auth'
const showSnackbar = inject('showSnackbar')
const users = ref([]); const tab = ref('committee'); const search = ref(''); const dialog = ref(false); const editMode = ref(false); const editId = ref(null); const saving = ref(false); const formRef = ref(null)
const form = reactive({ full_name: '', username: '', password: '', email: '', phone: '', department: '', position: '', role: 'committee' })

const filteredUsers = computed(() => {
  let list = users.value.filter(u => u.role === tab.value)
  if (search.value) { const s = search.value.toLowerCase(); list = list.filter(u => u.full_name?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s)) }
  return list
})

const roleColor = r => ({ hr: 'primary', evaluatee: 'secondary', committee: 'warning' }[r] || 'grey')
const roleLabel = r => ({ hr: 'บุคลากร', evaluatee: 'ผู้รับประเมิน', committee: 'กรรมการ' }[r] || r)

const fetchUsers = async () => { try { const { data } = await api.get('/users'); users.value = data.data || [] } catch(e){} }

const openDialog = (u = null) => {
  if (u) { editMode.value = true; editId.value = u.id; Object.assign(form, { ...u, password: '' }) }
  else { editMode.value = false; editId.value = null; Object.assign(form, { full_name: '', username: '', password: '', email: '', phone: '', department: '', position: '', role: tab.value }) }
  dialog.value = true
}

const saveUser = async () => {
  const { valid } = await formRef.value.validate(); if (!valid) return; saving.value = true
  try {
    if (editMode.value) { await api.put(`/users/${editId.value}`, form); if (form.password) await api.put(`/users/${editId.value}/password`, { new_password: form.password }) }
    else { await api.post('/auth/register', form) }
    dialog.value = false; await fetchUsers(); showSnackbar('บันทึกสำเร็จ')
  } catch (e) { showSnackbar(e.response?.data?.message || 'เกิดข้อผิดพลาด', 'error') }
  finally { saving.value = false }
}

const deleteUser = async (id) => { try { await api.delete(`/users/${id}`); await fetchUsers(); showSnackbar('ลบสำเร็จ') } catch(e){ showSnackbar('เกิดข้อผิดพลาด','error') } }
onMounted(fetchUsers)
</script>
