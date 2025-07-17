import { createRouter, createWebHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Projeto from './pages/Projeto.vue';
import Scan from './pages/Scan.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/projeto/:id', component: Projeto},
  { path: '/scan', component: Scan },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
