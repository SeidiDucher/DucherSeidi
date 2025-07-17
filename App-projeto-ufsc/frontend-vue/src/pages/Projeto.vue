<template>
  <div class="projeto-container" v-if="projeto">
    <h2>{{ projeto.titulo }}</h2>
    <iframe
      v-if="projeto.videoUrl"
      :src="projeto.videoUrl"
      width="320"
      height="180"
      allowfullscreen
    ></iframe>
    <p class="descricao">{{ projeto.descricao }}</p>
    <p><strong>Votos:</strong> {{ projeto.votos }}</p>
    <button @click="votar">🗳 Votar</button>
    <br />
    <router-link to="/" class="voltar">⬅ Voltar</router-link>
  </div>
  <div v-else class="carregando">
    <p>⏳ Carregando...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const projeto = ref(null);

async function carregar() {
  try {
    const res = await fetch(`/projetos/${route.params.id}`);
    if (!res.ok) throw new Error(`Erro ${res.status}: Projeto não encontrado.`);
    projeto.value = await res.json();
  } catch (err) {
    console.error('Erro ao carregar projeto:', err);
    alert('Erro ao carregar projeto. Verifique o ID ou o servidor.');
  }
}

onMounted(carregar);

async function votar() {
  try {
    const res = await fetch(`/projetos/${route.params.id}/voto`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Erro ao votar: ${res.status}`);
    await carregar();
  } catch (err) {
    console.error('Erro ao votar:', err);
    alert('Erro ao registrar voto. Verifique a conexão ou o servidor.');
  }
}
</script>

<style scoped>
.projeto-container {
  padding: 20px;
  font-family: sans-serif;
}
.descricao {
  margin: 10px 0;
}
button {
  margin-top: 10px;
  padding: 8px 14px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
}
.voltar {
  display: inline-block;
  margin-top: 15px;
  color: #555;
}
.carregando {
  padding: 20px;
  text-align: center;
}
</style>
