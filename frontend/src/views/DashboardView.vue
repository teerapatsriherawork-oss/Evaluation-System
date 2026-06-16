<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold gradient-text">แดชบอร์ด</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">สวัสดี, {{ auth.userName }} — {{ roleLabel }}</p>
      </div>
      <v-spacer />
      <v-chip color="success" variant="tonal" v-if="activePeriod" prepend-icon="mdi-calendar-check">
        {{ activePeriod.title }}
      </v-chip>
    </div>

    <!-- Stat Cards -->
    <v-row class="mb-6">
      <v-col v-for="(stat, i) in stats" :key="i" cols="12" sm="6" md="3">
        <v-card class="glass-card hover-card pa-4" :class="stat.borderClass">
          <div class="d-flex align-center">
            <v-avatar :color="stat.color" size="48" rounded="lg" class="mr-4">
              <v-icon :icon="stat.icon" color="white" />
            </v-avatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- HR Dashboard -->
    <template v-if="auth.isHR">
      <v-row>
        <v-col cols="12" md="8">
          <v-card class="glass-card pa-5">
            <div class="d-flex align-center mb-4">
              <v-icon color="primary" class="mr-2">mdi-clipboard-list</v-icon>
              <span class="text-h6 font-weight-medium">รอบประเมินล่าสุด</span>
            </div>
            <v-table density="comfortable" class="bg-transparent">
              <thead>
                <tr>
                  <th>ชื่อรอบประเมิน</th>
                  <th>วันเริ่มต้น</th>
                  <th>วันสิ้นสุด</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in periods" :key="p.id">
                  <td>{{ p.title }}</td>
                  <td>{{ formatDate(p.start_date) }}</td>
                  <td>{{ formatDate(p.end_date) }}</td>
                  <td>
                    <v-chip :color="p.is_active ? 'success' : 'grey'" size="small" label>
                      {{ p.is_active ? 'เปิด' : 'ปิด' }}
                    </v-chip>
                  </td>
                </tr>
                <tr v-if="periods.length === 0">
                  <td colspan="4" class="text-center text-medium-emphasis py-4">ยังไม่มีรอบประเมิน</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="glass-card pa-5">
            <div class="d-flex align-center mb-4">
              <v-icon color="secondary" class="mr-2">mdi-lightning-bolt</v-icon>
              <span class="text-h6 font-weight-medium">เมนูด่วน</span>
            </div>
            <v-list density="compact" class="bg-transparent">
              <v-list-item to="/hr/evaluations" prepend-icon="mdi-plus-circle" title="สร้างรอบประเมินใหม่" rounded="lg" />
              <v-list-item to="/hr/committees" prepend-icon="mdi-account-group" title="จัดการกรรมการ" rounded="lg" />
              <v-list-item to="/hr/tracking" prepend-icon="mdi-progress-check" title="ติดตามสถานะ" rounded="lg" />
              <v-list-item to="/hr/statistics" prepend-icon="mdi-chart-bar" title="ดูสถิติ" rounded="lg" />
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Evaluatee Dashboard -->
    <template v-if="auth.isEvaluatee">
      <v-row>
        <v-col cols="12" md="8">
          <v-card class="glass-card pa-5">
            <div class="d-flex align-center mb-4">
              <v-icon color="secondary" class="mr-2">mdi-progress-check</v-icon>
              <span class="text-h6 font-weight-medium">ความคืบหน้าการประเมินตนเอง</span>
            </div>
            <v-progress-linear :model-value="progress.progress" color="secondary" height="24" rounded class="mb-3">
              <strong>{{ progress.progress }}%</strong>
            </v-progress-linear>
            <div class="d-flex justify-space-between text-body-2 text-medium-emphasis">
              <span>เสร็จสิ้น: {{ progress.completed }}/{{ progress.total }}</span>
              <span>ร่าง: {{ progress.draft }}</span>
              <span>เหลือ: {{ progress.remaining }}</span>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="glass-card pa-5">
            <div class="d-flex align-center mb-4">
              <v-icon color="accent" class="mr-2">mdi-lightning-bolt</v-icon>
              <span class="text-h6 font-weight-medium">เมนูด่วน</span>
            </div>
            <v-list density="compact" class="bg-transparent">
              <v-list-item to="/evaluatee/assessment" prepend-icon="mdi-clipboard-check" title="ประเมินตนเอง" rounded="lg" />
              <v-list-item to="/evaluatee/progress" prepend-icon="mdi-chart-timeline" title="ดูความคืบหน้า" rounded="lg" />
              <v-list-item to="/evaluatee/feedback" prepend-icon="mdi-comment-text" title="ดูผลประเมิน" rounded="lg" />
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Committee Dashboard -->
    <template v-if="auth.isCommittee">
      <v-row>
        <v-col cols="12">
          <v-card class="glass-card pa-5">
            <div class="d-flex align-center mb-4">
              <v-icon color="accent" class="mr-2">mdi-format-list-checks</v-icon>
              <span class="text-h6 font-weight-medium">รายการที่ต้องประเมิน</span>
            </div>
            <v-table density="comfortable" class="bg-transparent">
              <thead>
                <tr>
                  <th>ผู้รับการประเมิน</th>
                  <th>แผนก</th>
                  <th>บทบาท</th>
                  <th>สถานะ</th>
                  <th>ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in assignments" :key="a.id">
                  <td>{{ a.evaluatee_name }}</td>
                  <td>{{ a.department }}</td>
                  <td>
                    <v-chip size="x-small" :color="a.committee_role === 'chairman' ? 'warning' : 'info'" label>
                      {{ a.committee_role === 'chairman' ? 'ประธาน' : 'กรรมการ' }}
                    </v-chip>
                  </td>
                  <td>
                    <v-chip size="x-small" :color="statusColor(a.status)" label>{{ statusLabel(a.status) }}</v-chip>
                  </td>
                  <td>
                    <v-btn size="small" color="primary" variant="tonal" :to="`/committee/score/${a.id}`" rounded="lg">
                      <v-icon start size="small">mdi-pencil</v-icon>
                      {{ a.status === 'completed' ? 'ดูผล' : 'ประเมิน' }}
                    </v-btn>
                  </td>
                </tr>
                <tr v-if="assignments.length === 0">
                  <td colspan="5" class="text-center text-medium-emphasis py-4">ยังไม่มีรายการประเมิน</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore, api } from '../stores/auth'

const auth = useAuthStore()
const periods = ref([])
const assignments = ref([])
const progress = ref({ total: 0, completed: 0, draft: 0, remaining: 0, progress: 0 })

const roleLabel = computed(() => {
  const m = { hr: 'ฝ่ายบุคลากร', evaluatee: 'ผู้รับการประเมิน', committee: 'กรรมการผู้ประเมิน' }
  return m[auth.userRole] || ''
})

const activePeriod = computed(() => periods.value.find(p => p.is_active))

const stats = computed(() => {
  if (auth.isHR) return [
    { icon: 'mdi-clipboard-text', label: 'รอบประเมิน', value: periods.value.length, color: 'primary', borderClass: 'stat-card-primary' },
    { icon: 'mdi-check-circle', label: 'เปิดอยู่', value: periods.value.filter(p => p.is_active).length, color: 'success', borderClass: 'stat-card-success' },
    { icon: 'mdi-account-group', label: 'กรรมการ', value: '-', color: 'info', borderClass: 'stat-card-info' },
    { icon: 'mdi-account', label: 'ผู้รับการประเมิน', value: '-', color: 'warning', borderClass: 'stat-card-warning' }
  ]
  if (auth.isEvaluatee) return [
    { icon: 'mdi-format-list-numbered', label: 'ตัวชี้วัดทั้งหมด', value: progress.value.total, color: 'primary', borderClass: 'stat-card-primary' },
    { icon: 'mdi-check-circle', label: 'เสร็จสิ้น', value: progress.value.completed, color: 'success', borderClass: 'stat-card-success' },
    { icon: 'mdi-pencil', label: 'ร่าง', value: progress.value.draft, color: 'warning', borderClass: 'stat-card-warning' },
    { icon: 'mdi-clock', label: 'เหลือ', value: progress.value.remaining, color: 'error', borderClass: 'stat-card-error' }
  ]
  return [
    { icon: 'mdi-account-multiple', label: 'ต้องประเมิน', value: assignments.value.length, color: 'primary', borderClass: 'stat-card-primary' },
    { icon: 'mdi-check-circle', label: 'เสร็จสิ้น', value: assignments.value.filter(a => a.status === 'completed').length, color: 'success', borderClass: 'stat-card-success' },
    { icon: 'mdi-progress-clock', label: 'กำลังทำ', value: assignments.value.filter(a => a.status === 'in_progress').length, color: 'warning', borderClass: 'stat-card-warning' },
    { icon: 'mdi-clock-outline', label: 'รอดำเนินการ', value: assignments.value.filter(a => a.status === 'pending').length, color: 'info', borderClass: 'stat-card-info' }
  ]
})

const formatDate = d => d ? new Date(d).toLocaleDateString('th-TH') : '-'
const statusColor = s => ({ pending: 'grey', in_progress: 'warning', completed: 'success' }[s] || 'grey')
const statusLabel = s => ({ pending: 'รอดำเนินการ', in_progress: 'กำลังประเมิน', completed: 'เสร็จสิ้น' }[s] || s)

onMounted(async () => {
  try {
    if (auth.isHR) {
      const { data } = await api.get('/evaluations')
      periods.value = data.data || []
    }
    if (auth.isEvaluatee) {
      const { data } = await api.get(`/self-assessments/progress/${auth.user.id}`)
      progress.value = data.data || progress.value
    }
    if (auth.isCommittee) {
      const { data } = await api.get(`/assignments/committee/${auth.user.id}`)
      assignments.value = data.data || []
    }
  } catch (e) { console.error(e) }
})
</script>
