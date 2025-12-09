import { createApp } from "vue";
import App from "./App.vue";
import IndexPage from "./IndexPage.vue";
import PathsPage from "./PathsPage.vue";
import ServicePage from "./ServicePage.vue";
import { createRouter, createWebHashHistory } from "vue-router";

declare global {
  interface Window {
    electron: {
      getPlatform: () => Promise<string>;
    };
  }
}

async function start() {
  const platform = await window.electron.getPlatform();
  const routes = [
    { path: "/", component: IndexPage },
    { path: "/paths", component: PathsPage },
    ...(platform === "linux"
      ? [{ path: "/service", component: ServicePage }]
      : []),
  ];

  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  });

  createApp(App).use(router).mount("#app");
}

start();
