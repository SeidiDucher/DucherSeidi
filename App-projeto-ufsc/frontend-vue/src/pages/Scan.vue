<template>
  <div class="scanner-container">
    <h2>📱 Escanear QR Code</h2>
    <div id="qrcode" class="qrcode-box"></div>

    <div class="buttons">
      <button @click="startScan" :disabled="scanning">▶️ Iniciar Scan</button>
      <button @click="stopScan" :disabled="!scanning">⏹ Parar Scan</button>
    </div>

    <div v-if="scanResult" class="resultado">
      <p><strong>Resultado:</strong> {{ scanResult }}</p>
      <router-link :to="`/projeto/${scanResult}`">🔍 Ver Projeto</router-link>
    </div>

    <div v-if="errorMsg" class="erro">{{ errorMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { Html5Qrcode } from 'html5-qrcode';

let html5QrCode;
const scanResult = ref('');
const errorMsg = ref('');
const scanning = ref(false);

async function startScan() {
  errorMsg.value = '';
  scanResult.value = '';
  if (scanning.value) return;

  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
  } catch {
    errorMsg.value = 'Permissão da câmera negada ou não disponível.';
    return;
  }

  try {
    html5QrCode = new Html5Qrcode('qrcode');
    scanning.value = true;
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 5, qrbox: 200 },
      (decodedText) => {
        scanResult.value = decodedText;
        stopScan();
      },
      (errorMessage) => {
        console.warn('Falha ao escanear (ignorada):', errorMessage);
      }
    );
  } catch (err) {
    errorMsg.value = 'Erro ao iniciar scanner: ' + err;
    scanning.value = false;
  }
}

async function stopScan() {
  if (html5QrCode && scanning.value) {
    try {
      await html5QrCode.stop();
      await html5QrCode.clear();
    } catch {}
    scanning.value = false;
  }
}

onBeforeUnmount(stopScan);
</script>

<style scoped>
.scanner-container {
  padding: 20px;
  font-family: sans-serif;
  text-align: center;
}
.qrcode-box {
  margin: 20px auto;
  width: 300px;
  height: 300px;
  border: 2px dashed #ccc;
}
.buttons button {
  margin: 5px;
  padding: 8px 12px;
  font-size: 14px;
}
.resultado {
  margin-top: 15px;
}
.erro {
  color: red;
  margin-top: 10px;
}
</style>
