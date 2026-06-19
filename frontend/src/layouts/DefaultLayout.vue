<template>
  <div>
    <!-- App Bar -->
    <v-app-bar flat class="glass-card" style="border-bottom: 1px solid rgba(99,102,241,0.15)">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title class="gradient-text font-weight-bold">
        ระบบประเมินบุคลากร
      </v-toolbar-title>
      <v-spacer />
      <v-chip class="mr-3" :color="roleColor" variant="flat" size="small" label>
        <v-icon start size="small">{{ roleIcon }}</v-icon>
        {{ roleLabel }}
      </v-chip>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon variant="text">
            <v-avatar color="primary" size="36">
              <span class="text-body-2 font-weight-bold">{{ initials }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list density="compact" rounded="lg" class="glass-card">
          <v-list-item prepend-icon="mdi-account" :title="auth.userName" :subtitle="auth.user?.email" />
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" title="ออกจากระบบ" @click="handleLogout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Sidebar -->
    <v-navigation-drawer v-model="drawer" class="sidebar-gradient" width="280">
      <div class="pa-4 text-center">
        <v-avatar size="64" color="primary" class="mb-2">
          <span class="text-h5 font-weight-bold">{{ initials }}</span>
        </v-avatar>
        <div class="text-body-1 font-weight-medium">{{ auth.userName }}</div>
        <div class="text-caption text-medium-emphasis">{{ auth.user?.position || auth.userRole }}</div>
      </div>
      <v-divider class="mb-2" />

      <v-list nav density="compact">
        <v-list-item to="/" prepend-icon="mdi-view-dashboard" title="แดชบอร์ด" rounded="lg" />

        <!-- HR Menu -->
        <template v-if="auth.isHR">
          <v-list-subheader class="text-primary">งานบุคลากร</v-list-subheader>
          <v-list-item to="/hr/evaluations" prepend-icon="mdi-clipboard-text" title="จัดการรอบประเมิน" rounded="lg" />
          <v-list-item to="/hr/committees" prepend-icon="mdi-account-group" title="จัดการกรรมการ" rounded="lg" />
          <v-list-item to="/hr/assignments" prepend-icon="mdi-account-switch" title="มอบหมายกรรมการ" rounded="lg" />
          <v-list-item to="/hr/tracking" prepend-icon="mdi-progress-check" title="ติดตามสถานะ" rounded="lg" />
          <v-list-item to="/hr/reports" prepend-icon="mdi-file-chart" title="สรุปผลประเมิน" rounded="lg" />
          <v-list-item to="/hr/statistics" prepend-icon="mdi-chart-bar" title="สถิติ" rounded="lg" />
        </template>

        <!-- Evaluatee Menu -->
        <template v-if="auth.isEvaluatee">
          <v-list-subheader class="text-secondary">ผู้รับการประเมิน</v-list-subheader>
          <v-list-item to="/evaluatee/profile" prepend-icon="mdi-account-edit" title="ข้อมูลส่วนตัว" rounded="lg" />
          <v-list-item to="/evaluatee/assessment" prepend-icon="mdi-clipboard-check" title="ประเมินตนเอง" rounded="lg" />
          <v-list-item to="/evaluatee/progress" prepend-icon="mdi-progress-clock" title="ความคืบหน้า" rounded="lg" />
          <v-list-item to="/evaluatee/feedback" prepend-icon="mdi-comment-text" title="ผลประเมินจากกรรมการ" rounded="lg" />
        </template>

        <!-- Committee Menu -->
        <template v-if="auth.isCommittee">
          <v-list-subheader class="text-accent">กรรมการผู้ประเมิน</v-list-subheader>
          <v-list-item to="/committee/evaluations" prepend-icon="mdi-format-list-checks" title="รายการประเมิน" rounded="lg" />
          <v-list-item to="/committee/results" prepend-icon="mdi-chart-box" title="ผลการประเมิน" rounded="lg" />
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-6">
        <transition name="fade" mode="out-in">
          <slot />
        </transition>
      </v-container>
    </v-main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const drawer = ref(true)

const initials = computed(() => {
  const name = auth.userName || ''
  return name.substring(0, 2)
})

const roleColor = computed(() => {
  const map = { hr: 'primary', evaluatee: 'secondary', committee: 'accent' }
  return map[auth.userRole] || 'grey'
})

const roleIcon = computed(() => {
  const map = { hr: 'mdi-shield-account', evaluatee: 'mdi-account', committee: 'mdi-gavel' }
  return map[auth.userRole] || 'mdi-account'
})

const roleLabel = computed(() => {
  const map = { hr: 'ฝ่ายบุคลากร', evaluatee: 'ผู้รับการประเมิน', committee: 'กรรมการ' }
  return map[auth.userRole] || ''
})

const handleLogout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>
