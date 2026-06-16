<template>
  <v-chip :color="statusColor(status)" size="small" variant="flat" label>
    {{ statusLabel(status) }}
  </v-chip>
</template>

<script setup>
import { statusColor, statusLabel } from '../lib/format'
defineProps({ status: { type: String, default: 'pending' } })
</script>
