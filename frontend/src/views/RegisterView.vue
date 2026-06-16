<template>
  <div class="login-bg d-flex align-center justify-center">
    <v-card class="glass-card pa-8" width="500" style="z-index: 1">
      <div class="text-center mb-6">
        <v-icon size="56" color="secondary" class="mb-3">mdi-account-plus</v-icon>
        <h1 class="text-h4 font-weight-bold gradient-text mb-1">ลงทะเบียน</h1>
        <p class="text-body-2 text-medium-emphasis">สร้างบัญชีผู้รับการประเมิน</p>
      </div>
      <v-form @submit.prevent="handleRegister" ref="formRef">
        <v-row dense>
          <v-col cols="12">
            <v-text-field v-model="form.full_name" label="ชื่อ-สกุล *" prepend-inner-icon="mdi-account" :rules="[rules.required]" id="reg-fullname" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.username" label="ชื่อผู้ใช้ *" prepend-inner-icon="mdi-at" :rules="[rules.required, rules.minLen(3)]" id="reg-username" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.password" label="รหัสผ่าน *" prepend-inner-icon="mdi-lock" type="password" :rules="[rules.required, rules.minLen(6)]" id="reg-password" />
          </v-col>
          <v-col cols="12">
            <v-text-field v-model="form.email" label="อีเมล" prepend-inner-icon="mdi-email" :rules="[rules.email]" id="reg-email" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.phone" label="เบอร์โทร" prepend-inner-icon="mdi-phone" id="reg-phone" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="form.department" label="แผนก/หน่วยงาน" prepend-inner-icon="mdi-domain" id="reg-dept" />
          </v-col>
          <v-col cols="12">
            <v-text-field v-model="form.position" label="ตำแหน่ง" prepend-inner-icon="mdi-briefcase" id="reg-position" />
          </v-col>
        </v-row>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4" rounded="lg">{{ error }}</v-alert>
        <v-btn type="submit" block size="large" class="gradient-btn mb-4" :loading="loading" id="reg-submit">
          <v-icon start>mdi-check-circle</v-icon> ลงทะเบียน
        </v-btn>
        <div class="text-center">
          <span class="text-medium-emphasis">มีบัญชีแล้ว?</span>
          <router-link to="/login" class="text-primary text-decoration-none ml-1 font-weight-medium">เข้าสู่ระบบ</router-link>
        </div>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const showSnackbar = inject('showSnackbar')
const formRef = ref(null)
const loading = ref(false)
const error = ref('')

const form = reactive({ full_name: '', username: '', password: '', email: '', phone: '', department: '', position: '' })
const rules = {
  required: v => !!v || 'กรุณากรอกข้อมูล',
  minLen: n => v => (!v || v.length >= n) || `ต้องมีอย่างน้อย ${n} ตัวอักษร`,
  email: v => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || 'รูปแบบอีเมลไม่ถูกต้อง'
}

const handleRegister = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  loading.value = true
  error.value = ''
  try {
    await auth.register({ ...form, role: 'evaluatee' })
    showSnackbar('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ', 'success')
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.message || 'เกิดข้อผิดพลาด'
  } finally { loading.value = false }
}
</script>
