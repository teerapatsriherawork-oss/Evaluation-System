<template>
  <div>
    <h1 class="text-h4 font-weight-bold gradient-text mb-2">ข้อมูลส่วนตัว</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">บันทึก และแก้ไขข้อมูลส่วนตัวเบื้องต้น</p>

    <v-card class="glass-card pa-6" max-width="600">
      <v-form @submit.prevent="saveProfile" ref="formRef">
        <v-text-field v-model="form.full_name" label="ชื่อ-สกุล *" prepend-inner-icon="mdi-account" :rules="[req]" class="mb-2" />
        <v-text-field v-model="form.email" label="อีเมล" prepend-inner-icon="mdi-email" :rules="[emailRule]" class="mb-2" />
        <v-row dense>
          <v-col cols="6"><v-text-field v-model="form.phone" label="เบอร์โทร" prepend-inner-icon="mdi-phone" /></v-col>
          <v-col cols="6"><v-text-field v-model="form.department" label="แผนก/หน่วยงาน" prepend-inner-icon="mdi-domain" /></v-col>
        </v-row>
        <v-text-field v-model="form.position" label="ตำแหน่ง" prepend-inner-icon="mdi-briefcase" class="mb-4" />
        <v-btn type="submit" class="gradient-btn" :loading="saving" block size="large"><v-icon start>mdi-content-save</v-icon>บันทึกข้อมูล</v-btn>
      </v-form>
    </v-card>

    <!-- เปลี่ยนรหัสผ่าน -->
    <v-card class="glass-card pa-6 mt-4" max-width="600">
      <div class="text-h6 font-weight-medium mb-3"><v-icon color="warning" class="mr-2">mdi-lock-reset</v-icon>เปลี่ยนรหัสผ่าน</div>
      <v-form @submit.prevent="changePassword" ref="pwFormRef">
        <v-text-field v-model="pw.old_password" label="รหัสผ่านเดิม *" type="password" prepend-inner-icon="mdi-lock" :rules="[req]" class="mb-2" />
        <v-text-field v-model="pw.new_password" label="รหัสผ่านใหม่ *" type="password" prepend-inner-icon="mdi-lock-plus" :rules="[req, minLen6]" class="mb-3" />
        <v-btn type="submit" color="warning" variant="tonal" :loading="pwSaving"><v-icon start>mdi-lock-reset</v-icon>เปลี่ยนรหัสผ่าน</v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../lib/api'
import { useNotify } from '../../composables/useNotify'

const auth = useAuthStore()
const { success, error } = useNotify()
const saving = ref(false)
const formRef = ref(null)
const form = reactive({ full_name: '', email: '', phone: '', department: '', position: '' })
const req = (v) => !!v || 'กรุณากรอกข้อมูล'
const minLen6 = (v) => (!!v && v.length >= 6) || 'อย่างน้อย 6 ตัวอักษร'
const emailRule = (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || 'รูปแบบอีเมลไม่ถูกต้อง'

// เปลี่ยนรหัสผ่านตนเอง (เกณฑ์ 8.6)
const pw = reactive({ old_password: '', new_password: '' })
const pwFormRef = ref(null)
const pwSaving = ref(false)
const changePassword = async () => {
  const { valid } = await pwFormRef.value.validate(); if (!valid) return
  pwSaving.value = true
  try {
    await api.put('/users/me/password', pw)
    success('เปลี่ยนรหัสผ่านสำเร็จ'); pw.old_password = ''; pw.new_password = ''
  } catch (e) { error(e.response?.data?.message) } finally { pwSaving.value = false }
}

onMounted(async () => {
  try { Object.assign(form, (await api.get('/auth/me')).data.data) } catch (e) { /* noop */ }
})

const saveProfile = async () => {
  const { valid } = await formRef.value.validate(); if (!valid) return
  saving.value = true
  try { await api.put('/users/profile', form); await auth.fetchMe(); success('บันทึกสำเร็จ') }
  catch (e) { error() } finally { saving.value = false }
}
</script>
