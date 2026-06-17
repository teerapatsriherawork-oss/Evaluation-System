<template>
  <div>
    <!-- App Bar -->
    <v-app-bar flat class="glass-card" style="border-bottom: 1px solid rgba(99,102,241,0.15)">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title class="gradient-text font-weight-bold">ระบบประเมินบุคลากร</v-toolbar-title>
      <v-spacer />

      <!-- สลับโหมดสว่าง/มืด -->
      <v-btn icon variant="text" @click="toggleDark">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>

      <!-- กระดิ่งแจ้งเตือน -->
      <v-menu :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" @click="fetchNotis">
            <v-badge :content="unread" :model-value="unread > 0" color="error">
              <v-icon>mdi-bell</v-icon>
            </v-badge>
          </v-btn>
        </template>
        <v-card class="glass-card" width="350" max-height="420" rounded="lg">
          <div class="d-flex align-center pa-3">
            <span class="font-weight-medium">การแจ้งเตือน</span>
            <v-spacer />
            <v-btn v-if="unread" size="x-small" variant="text" @click="markAll">อ่านทั้งหมด</v-btn>
          </div>
          <v-divider />
          <v-list density="compact" class="bg-transparent" style="max-height:340px;overflow-y:auto">
            <v-list-item v-for="n in notis" :key="n.id" @click="openNoti(n)" :active="!n.is_read" rounded="lg" class="ma-1">
              <template #prepend>
                <v-icon size="small" :color="n.is_read ? 'grey' : 'primary'">{{ n.is_read ? 'mdi-bell-outline' : 'mdi-bell-ring' }}</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ n.title }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ n.message }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item v-if="!notis.length">
              <v-list-item-title class="text-caption text-center text-medium-emphasis py-2">ไม่มีการแจ้งเตือน</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>

      <v-chip class="mx-3" :color="roleColor(auth.userRole)" variant="flat" size="small" label>
        <v-icon start size="small">{{ roleIcon(auth.userRole) }}</v-icon>
        {{ roleLabel(auth.userRole) }}
      </v-chip>
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text">
            <v-avatar color="primary" size="36"><span class="text-body-2 font-weight-bold">{{ initials }}</span></v-avatar>
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
          <v-list-item to="/hr/activity-logs" prepend-icon="mdi-history" title="ประวัติการใช้งาน" rounded="lg" />
          <v-list-item to="/hr/backup" prepend-icon="mdi-database-cog" title="สำรอง/กู้คืนข้อมูล" rounded="lg" />
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAuthStore } from '../stores/auth'
import { api } from '../lib/api'
import { useConfirm } from '../composables/useConfirm'
import { roleColor, roleLabel, roleIcon } from '../lib/format'

const auth = useAuthStore()
const router = useRouter()
const theme = useTheme()
const confirm = useConfirm()
const drawer = ref(true)
const notis = ref([])

const initials = computed(() => (auth.userName || '').substring(0, 2))
const unread = computed(() => notis.value.filter(n => !n.is_read).length)
const isDark = computed(() => theme.global.current.value.dark)

const toggleDark = () => {
  const next = isDark.value ? 'light' : 'dark'
  theme.global.name.value = next
  localStorage.setItem('theme', next)
}

const fetchNotis = async () => {
  try { notis.value = (await api.get('/notifications')).data.data || [] } catch (e) { /* noop */ }
}
const markAll = async () => { try { await api.patch('/notifications/read-all'); await fetchNotis() } catch (e) { /* noop */ } }
const openNoti = async (n) => {
  if (!n.is_read) { try { await api.patch(`/notifications/${n.id}/read`); n.is_read = true } catch (e) { /* noop */ } }
  if (n.link) router.push(n.link)
}
const handleLogout = async () => {
  if (!(await confirm({ title: 'ออกจากระบบ', message: 'ต้องการออกจากระบบหรือไม่?', color: 'primary', confirmText: 'ออกจากระบบ', icon: 'mdi-logout' }))) return
  await auth.logout(); router.push('/login')
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) theme.global.name.value = saved
  fetchNotis()
})
</script>
