import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true, layout: 'auth' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guest: true, layout: 'auth' }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  // ============ HR Routes ============
  {
    path: '/hr/evaluations',
    name: 'EvaluationManage',
    component: () => import('../views/hr/EvaluationManageView.vue'),
    meta: { requiresAuth: true, role: 'hr' }
  },
  {
    path: '/hr/indicators/:periodId',
    name: 'IndicatorManage',
    component: () => import('../views/hr/IndicatorManageView.vue'),
    meta: { requiresAuth: true, role: 'hr' }
  },
  {
    path: '/hr/committees',
    name: 'CommitteeManage',
    component: () => import('../views/hr/CommitteeManageView.vue'),
    meta: { requiresAuth: true, role: 'hr' }
  },
  {
    path: '/hr/assignments',
    name: 'AssignCommittee',
    component: () => import('../views/hr/AssignCommitteeView.vue'),
    meta: { requiresAuth: true, role: 'hr' }
  },
  {
    path: '/hr/tracking',
    name: 'Tracking',
    component: () => import('../views/hr/TrackingView.vue'),
    meta: { requiresAuth: true, role: 'hr' }
  },
  {
    path: '/hr/reports',
    name: 'ReportSummary',
    component: () => import('../views/hr/ReportSummaryView.vue'),
    meta: { requiresAuth: true, role: 'hr' }
  },
  {
    path: '/hr/statistics',
    name: 'Statistics',
    component: () => import('../views/hr/StatisticsView.vue'),
    meta: { requiresAuth: true, role: 'hr' }
  },
  // ============ Evaluatee Routes ============
  {
    path: '/evaluatee/profile',
    name: 'EvaluateeProfile',
    component: () => import('../views/evaluatee/ProfileView.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  {
    path: '/evaluatee/assessment',
    name: 'SelfAssessment',
    component: () => import('../views/evaluatee/SelfAssessmentView.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  {
    path: '/evaluatee/progress',
    name: 'EvaluateeProgress',
    component: () => import('../views/evaluatee/ProgressView.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  {
    path: '/evaluatee/feedback',
    name: 'ViewFeedback',
    component: () => import('../views/evaluatee/ViewFeedbackView.vue'),
    meta: { requiresAuth: true, role: 'evaluatee' }
  },
  // ============ Committee Routes ============
  {
    path: '/committee/evaluations',
    name: 'EvaluationList',
    component: () => import('../views/committee/EvaluationListView.vue'),
    meta: { requiresAuth: true, role: 'committee' }
  },
  {
    path: '/committee/score/:assignmentId',
    name: 'ScoreForm',
    component: () => import('../views/committee/ScoreFormView.vue'),
    meta: { requiresAuth: true, role: 'committee' }
  },
  {
    path: '/committee/results',
    name: 'CommitteeResults',
    component: () => import('../views/committee/ResultsView.vue'),
    meta: { requiresAuth: true, role: 'committee' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return next('/')
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return next('/')
  }

  next()
})

export default router
