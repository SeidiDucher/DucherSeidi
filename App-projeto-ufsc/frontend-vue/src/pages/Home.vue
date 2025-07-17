<template>
  <div class="container">
    <h1 class="titulo">🎓 Projetos da Feira de Ciências</h1>
    <router-link class="btn-scan" to="/scan">📷 Escanear QR Code</router-link>

    <ul class="lista-projetos">
      <li v-for="project in projects" :key="project._id" class="item-projeto">
        <router-link :to="`/projeto/${project._id}`" class="link-projeto">
          {{ project.titulo }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const projects = ref([]);

onMounted(async () => {
  const res = await fetch('/projetos');
  projects.value = await res.json();
});
</script>

<style scoped>
.container {
  padding: 20px;
  font-family: sans-serif;
}
.titulo {
  margin-bottom: 20px;
}
.btn-scan {
  display: inline-block;
  margin-bottom: 20px;
  background-color: #4caf50;
  color: white;
  padding: 8px 12px;
  text-decoration: none;
  border-radius: 4px;
}
.lista-projetos {
  list-style: none;
  padding: 0;
}
.item-projeto {
  margin-bottom: 10px;
}
.link-projeto {
  color: #2196f3;
  text-decoration: none;
}
.link-projeto:hover {
  text-decoration: underline;
}
</style>
