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
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top right" rounded="lg">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">ปิด</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, provide } from 'vue'
import DefaultLayout from './layouts/DefaultLayout.vue'

const snackbar = ref({ show: false, text: '', color: 'success' })

const showSnackbar = (text, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

provide('showSnackbar', showSnackbar)
</script>
