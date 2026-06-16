<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="400">
    <v-card class="glass-card pa-6" rounded="xl">
      <v-card-title class="text-h6 font-weight-bold text-error pa-0 mb-3">{{ title }}</v-card-title>
      <p class="text-body-1 mb-4">{{ message }}</p>
      <div class="d-flex ga-2 justify-end">
        <v-btn variant="text" @click="$emit('update:modelValue', false)">ยกเลิก</v-btn>
        <v-btn color="error" :loading="loading" @click="$emit('confirm')">ลบ</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'ยืนยันการลบ' },
  message: { type: String, default: 'คุณแน่ใจหรือไม่ที่จะลบรายการนี้?' },
  loading: Boolean
})
defineEmits(['update:modelValue', 'confirm'])
</script>
