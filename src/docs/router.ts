import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('./pages/IntroductionPage.vue'), meta: { title: 'Introduction' } },
  { path: '/foundations/colour', component: () => import('./pages/ColourPage.vue'), meta: { title: 'Colour' } },
  { path: '/foundations/typography', component: () => import('./pages/TypographyPage.vue'), meta: { title: 'Typography' } },
  { path: '/foundations/layout', component: () => import('./pages/LayoutPage.vue'), meta: { title: 'Layout & elevation' } },
  { path: '/components/actions', component: () => import('./pages/ActionsPage.vue'), meta: { title: 'Actions' } },
  { path: '/components/forms', component: () => import('./pages/FormsPage.vue'), meta: { title: 'Forms' } },
  { path: '/components/data-display', component: () => import('./pages/DataDisplayPage.vue'), meta: { title: 'Data display' } },
  { path: '/components/navigation', component: () => import('./pages/NavigationPage.vue'), meta: { title: 'Navigation' } },
  { path: '/components/overlays', component: () => import('./pages/OverlaysPage.vue'), meta: { title: 'Overlays' } },
  { path: '/charts', component: () => import('./pages/ChartsPage.vue'), meta: { title: 'Charts' } },
  { path: '/examples', component: () => import('./pages/ExamplesPage.vue'), meta: { title: 'Examples' } },
  {
    path: '/examples/sales',
    component: () => import('./examples/SalesOverview.vue'),
    meta: { title: 'Sales overview', bare: true },
  },
  {
    path: '/examples/projects',
    component: () => import('./examples/ProjectsList.vue'),
    meta: { title: 'Projects', bare: true, ownsModK: true },
  },
  {
    path: '/examples/schedule',
    component: () => import('./examples/WeeklySchedule.vue'),
    meta: { title: 'Weekly schedule', bare: true },
  },
  { path: '/references', component: () => import('./pages/ReferencesPage.vue'), meta: { title: 'References' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 88, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title && to.path !== '/' ? `${title} · Rapi` : 'Rapi Design System'
})

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    bare?: boolean
    /** The page handles ⌘K itself (e.g. to focus its own search). */
    ownsModK?: boolean
  }
}
