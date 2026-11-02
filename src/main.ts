import { createApp } from 'vue'
import { RapiPlugin } from '@/design-system'
import App from '@/docs/App.vue'
import { router } from '@/docs/router'
import '@/docs/docs.css'

createApp(App).use(RapiPlugin).use(router).mount('#app')
