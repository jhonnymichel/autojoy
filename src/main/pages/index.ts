import { createApp } from 'vue'
import App from './App.vue'
import IndexPage from './IndexPage.vue'
import PathsPage from './PathsPage.vue'
import ServicePage from './ServicePage.vue'
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
    { path: '/', component: IndexPage },
    { path: '/paths', component: PathsPage },
    { path: '/service', component: ServicePage },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

createApp(App).use(router).mount('#app')
