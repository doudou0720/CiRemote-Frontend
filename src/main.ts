import { createApp } from 'vue'
import './style.css'
import 'layui/dist/css/layui.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// Layui将在需要时动态引入
const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')