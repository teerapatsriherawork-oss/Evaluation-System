<template>
  <div class="login-bg d-flex align-center justify-center">
    <v-card class="glass-card pa-8" width="440" style="z-index: 1">
      <div class="text-center mb-6">
        <v-icon size="64" color="primary" class="mb-3">mdi-shield-check</v-icon>
        <h1 class="text-h4 font-weight-bold gradient-text mb-1">ระบบประเมินบุคลากร</h1>
        <p class="text-body-2 text-medium-emphasis">Personnel Evaluation System</p>
      </div>

      <v-form @submit.prevent="handleLogin" ref="formRef">
        <v-text-field
          v-model="form.username"
          label="ชื่อผู้ใช้"
          prepend-inner-icon="mdi-account"
          :rules="[rules.required]"
          :error-messages="errors.username"
          class="mb-2"
          id="login-username"
        />
        <v-text-field
          v-model="form.password"
          label="รหัสผ่าน"
          prepend-inner-icon="mdi-lock"
          :type="showPass ? 'text' : 'password'"
          :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPass = !showPass"
          :rules="[rules.required]"
          :error-messages="errors.password"
          class="mb-2"
          id="login-password"
        />

        <v-alert v-if="auth.error" type="error" variant="tonal" density="compact" class="mb-4" rounded="lg">
          {{ auth.error }}
        </v-alert>

        <v-btn
          type="submit"
          block
          size="large"
          class="gradient-btn mb-4"
          :loading="auth.loading"
          id="login-submit"
        >
          <v-icon start>mdi-login</v-icon>
          เข้าสู่ระบบ
        </v-btn>

        <div class="text-center">
          <span class="text-medium-emphasis">ยังไม่มีบัญชี?</span>
          <router-link to="/register" class="text-primary text-decoration-none ml-1 font-weight-medium">ลงทะเบียน</router-link>
        </div>
      </v-form>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const formRef = ref(null)
const showPass = ref(false)

const form = reactive({ username: '', password: '' })
const errors = reactive({ username: '', password: '' })
const rules = { required: v => !!v || 'กรุณากรอกข้อมูล' }

const handleLogin = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  try {
    await auth.login(form.username, form.password)
    router.push('/')
  } catch (e) { /* error handled in store */ }
}
</script>
