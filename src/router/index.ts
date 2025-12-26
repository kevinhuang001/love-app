import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import AuthLayout from '../layouts/AuthLayout.vue'
import AppLayout from '../layouts/AppLayout.vue'

import { useUserStore } from '../stores/user-store'

const routes: Array<RouteRecordRaw> = [
  {
    name: 'admin',
    path: '/',
    component: AppLayout,
    redirect: { name: 'love-dashboard' },
    meta: { requiresAuth: true },
    children: [
      {
        name: 'love-dashboard',
        path: 'love/dashboard',
        component: () => import('../pages/love-app/LoveDashboard.vue'),
      },
      {
        name: 'love-timeline',
        path: 'love/timeline',
        component: () => import('../pages/love-app/LoveTimeline.vue'),
      },
      {
        name: 'love-messages',
        path: 'love/messages',
        component: () => import('../pages/love-app/LoveMessages.vue'),
      },
      {
        name: 'love-profile',
        path: 'love/profile',
        component: () => import('../pages/love-app/LoveProfile.vue'),
      },
      {
        name: 'love-pairing',
        path: 'love/pairing',
        component: () => import('../pages/love-app/LovePairing.vue'),
      },
      {
        name: 'love-settings',
        path: 'love/settings',
        component: () => import('../pages/love-app/LoveSettings.vue'),
      },
    ],
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        name: 'login',
        path: 'login',
        component: () => import('../pages/auth/Login.vue'),
      },
      {
        name: 'signup',
        path: 'signup',
        component: () => import('../pages/auth/Signup.vue'),
      },
      {
        name: 'recover-password',
        path: 'recover-password',
        component: () => import('../pages/auth/RecoverPassword.vue'),
      },
      {
        name: 'recover-password-email',
        path: 'recover-password-email',
        component: () => import('../pages/auth/CheckTheEmail.vue'),
      },
      {
        path: '',
        redirect: { name: 'login' },
      },
    ],
  },
  {
    name: '404',
    path: '/404',
    component: () => import('../pages/404.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'love-dashboard' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    // For some reason using documentation example doesn't scroll on page navigation.
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    } else {
      window.scrollTo(0, 0)
    }
  },
  routes,
})

router.beforeEach(async (to, from, next) => {
  const store = useUserStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !store.token) {
    next({ name: 'login' })
  } else {
    // If we have a token but no user data, try to fetch it
    if (store.token && !store.id) {
      await store.checkAuth()
      if (!store.id) {
        // Token invalid
        next({ name: 'login' })
        return
      }
    }

    if (requiresAuth && !store.partnerId && to.name !== 'love-pairing' && to.name !== 'love-profile') {
      next({ name: 'love-pairing' })
      return
    }

    if (to.name === 'love-pairing' && store.partnerId) {
      next({ name: 'love-dashboard' })
      return
    }

    next()
  }
})

export default router
