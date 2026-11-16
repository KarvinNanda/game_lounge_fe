import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
// Element Plus built-in texts (pagination "/halaman", "Tidak Ada Data", pickers) in Indonesian.
import id from 'element-plus/es/locale/lang/id'
import 'element-plus/dist/index.css'
import '@fontsource-variable/inter'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { installErrorHandlers } from './utils/globalErrors'
import './assets/tokens.css'
import './assets/theme.css'
import './assets/utilities.css'

const app = createApp(App)
if (import.meta.env.PROD) installErrorHandlers(app)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: id })
app.mount('#app')
