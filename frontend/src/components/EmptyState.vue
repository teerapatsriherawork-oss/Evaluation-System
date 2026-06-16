<template>
  <v-card class="glass-card pa-10 text-center" rounded="xl">
    <v-icon :size="72" :color="color" class="mb-4">{{ icon }}</v-icon>
    <h3 class="text-h5 mb-2">{{ title }}</h3>
    <p class="text-medium-emphasis mb-4">{{ subtitle }}</p>
    <slot />
  </v-card>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'mdi-inbox-outline' },
  color: { type: String, default: 'primary' },
  title: { type: String, default: 'ยังไม่มีข้อมูล' },
  subtitle: { type: String, default: '' }
})
</script>
