import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import IndexPage from "./IndexPage.vue";
import PathsPage from "./PathsPage.vue";
import ServicePage from "./ServicePage.vue";
import EndSetupPage from "./setup/EndSetupPage.vue";
import StartSetupPage from "./setup/StartSetupPage.vue";
import AboutPage from "./AboutPage.vue";

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
    { path: "/start-setup", component: StartSetupPage },
    { path: "/finish-setup", component: EndSetupPage },
    ...(platform === "linux"
      ? [{ path: "/service", component: ServicePage }]
      : []),
    { path: "/about", component: AboutPage },
  ];

  const router = createRouter({
    history: createWebHashHistory(),
    routes,
  });

  createApp(App).use(router).mount("#app");
}

start();
