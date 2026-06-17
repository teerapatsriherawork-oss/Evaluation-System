<template>
  <v-app>
    <template v-if="$route.meta.layout === 'auth'">
      <router-view />
    </template>
    <template v-else>
      <DefaultLayout>
        <router-view />
      </DefaultLayout>
    </template>

    <!-- Snackbar (แจ้งเตือนผลลัพธ์) -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top right" rounded="lg">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">ปิด</v-btn>
      </template>
    </v-snackbar>

    <!-- Global Confirm Dialog (ยืนยันก่อนทำรายการสำคัญ) -->
    <v-dialog v-model="cf.show" max-width="430" persistent>
      <v-card class="glass-card pa-6" rounded="xl">
        <div class="d-flex align-center mb-3">
          <v-icon :color="cf.color" size="28" class="mr-2">{{ cf.icon }}</v-icon>
          <span class="text-h6 font-weight-bold">{{ cf.title }}</span>
        </div>
        <p class="text-body-1 mb-5" style="white-space: pre-line">{{ cf.message }}</p>
        <div class="d-flex ga-2 justify-end">
          <v-btn variant="text" @click="resolveConfirm(false)">{{ cf.cancelText }}</v-btn>
          <v-btn :color="cf.color" variant="flat" :loading="cf.loading" @click="resolveConfirm(true)">{{ cf.confirmText }}</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, provide } from 'vue'
import DefaultLayout from './layouts/DefaultLayout.vue'

// ===== Snackbar =====
const snackbar = ref({ show: false, text: '', color: 'success' })
const showSnackbar = (text, color = 'success') => { snackbar.value = { show: true, text, color } }
provide('showSnackbar', showSnackbar)

// ===== Global Confirm — คืน Promise<boolean> =====
// ใช้: const confirm = useConfirm(); if (await confirm('ลบรายการนี้?')) { ... }
//      หรือ await confirm({ title, message, color, confirmText, icon })
const DEFAULTS = {
  show: true, title: 'ยืนยันการทำรายการ', message: '',
  color: 'error', icon: 'mdi-alert-circle', confirmText: 'ยืนยัน', cancelText: 'ยกเลิก', loading: false, resolve: null
}
const cf = ref({ ...DEFAULTS, show: false })
const confirm = (opts) => new Promise((res) => {
  const o = typeof opts === 'string' ? { message: opts } : (opts || {})
  cf.value = { ...DEFAULTS, ...o, resolve: res }
})
const resolveConfirm = (val) => { cf.value.resolve?.(val); cf.value.resolve = null; cf.value.show = false }
provide('confirm', confirm)
</script>
