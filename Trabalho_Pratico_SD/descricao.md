# Difusão Confiável baseado em NACK

## 1. Descrição Concisa da Proposta

Este trabalho implementa um **protocolo de difusão confiável baseado em NACK (Negative Acknowledgment)** em uma arquitetura cliente-servidor usando UDP. O sistema garante que todas as mensagens sejam entregues na ordem correta, mesmo em cenários com simulação de perda de pacotes.

### Objetivos:
- Implementar comunicação confiável sobre um meio não confiável (UDP)
- Demonstrar sincronização entre múltiplos processos
- Utilizar exclusão mútua para proteger dados compartilhados
- Recuperar de falhas de transmissão através do mecanismo NACK

---

## 2. Requisitos Funcionais

### Cliente
- **Tipo de Requisição Enviada:** 
  - `DATA`: Envia mensagem para ser difundida
  - `NACK`: Solicita reenvio de pacote perdido
  
- **Tipo de Resposta Recebida:**
  - `BROADCAST`: Mensagem difundida pelo servidor
  - `REPLAY`: Reenvio de pacote via NACK

- **Identificação de Processos:**
  - ID único: `User_XXXX` (gerado aleatoriamente)
  - Exemplo: `User_5432`
  - Associado ao endereço IP e porta UDP

- **Funcionalidades:**
  - Detecta lacunas na sequência de mensagens
  - Mantém buffer ordenado de mensagens fora de ordem
  - Envia NACK para cada pacote perdido
  - Exibe mensagens na ordem correta através da GUI

### Servidor
- **Função Principal:** Broker central de difusão confiável
  
- **Operações:**
  1. Recebe `DATA` dos clientes
  2. Atribui número de sequência global
  3. Armazena no histórico (buffer)
  4. Difunde para todos os clientes conectados
  5. Responde `NACK` com reenvio de pacote do histórico

- **Sincronização:**
  - Usa `threading.Lock()` para proteger estruturas compartilhadas
  - Garante incremento atômico de `sequence_number`

- **Estruturas de Dados:**
  - `clients`: Conjunto de endereços de clientes ativos
  - `sequence_number`: Contador global (começa em 0)
  - `history_buffer`: Dicionário {seq_num: mensagem_completa}

---

## 3. Comunicação entre Cliente e Servidor

### Fluxo de Mensagens Normais (Sucesso)

```
Cliente 1          Servidor          Cliente 2      Cliente 3
   |                  |                  |              |
   |-- DATA -------->|                   |              |
   |      seq=0   |-- BROADCAST seq=0 -->|              |
   |              |-- BROADCAST seq=0 --->|              |
   |              |                  |          OK      |
```

### Fluxo com Perda de Pacote (Recuperação via NACK)

```
Cliente 1          Servidor          Cliente 2
   |                  |                  |
   |-- DATA -------->|                   |
   |   seq=0    |-- BROADCAST seq=0 -->|
   |            |-- BROADCAST seq=1 -->| (PERDIDO!)
   |            |-- BROADCAST seq=2 -->|
   |                  |   ❌ Falta seq=1
   |                  |                  |
   |                  |<-- NACK seq=1 --|
   |            |-- REPLAY seq=1 ----->| (via unicast)
   |                  |                  |     OK
```

### Diagrama de Sequência Detalhado

```
Cliente A          Servidor          Cliente B
   |                  |                  |
   |-- "Olá" ------->|                   |
   |    (DATA)        |                  |
   |          seq=0 |-- BROADCAST ----->|
   |                  |   seq=0          |
   |              ✓ Entregue            |
   |                  |                  |
   |-- "Teste" ----->|                   |
   |    (DATA)        |                  |
   |          seq=1 |-- BROADCAST ----->|  
   |                  |   seq=1 (PERDIDO)| ❌
   |                  |                  |
   |-- "Fim" ------->|                   |
   |    (DATA)        |                  |
   |          seq=2 |-- BROADCAST ----->|
   |                  |   seq=2          |
   |              ✓ Entregue (seq=2)    |
   |              ❌ Falta seq=1         |
   |                  |                  |
   |                  |<-- NACK seq=1 --|
   |                  |   (pedido reenvio)|
   |              |-- REPLAY seq=1 ---->|
   |                  |   (unicast)      |
   |              ✓ Entregue (seq=1)    |
   |                  |                  |
```

---

## 4. Descrição do Serviço

### Servidor: Central Broker (CentralBroker)

O servidor funciona continuamente em um loop que:

1. **Aguarda Conexões:**
   - Escuta na porta 5000
   - Registra automaticamente novos clientes

2. **Processa Mensagens DATA:**
   ```python
   # Ao receber DATA do cliente:
   - Incrementa sequence_number (com proteção de lock)
   - Cria pacote BROADCAST com seq
   - Armazena no history_buffer
   - Envia BROADCAST para todos os clientes
   ```

3. **Processa Mensagens NACK:**
   ```python
   # Ao receber NACK do cliente:
   - Consulta seq no history_buffer
   - Reenvia via unicast apenas para esse cliente
   - Registra o reenvio no log
   ```

4. **Gerenciamento de Threads:**
   - Thread principal: recebe pacotes
   - Thread por pacote: processa em paralelo
   - Lock garante sincronização

### Exemplo de Execução

```bash
$ python servidor.py
[*] Servidor de Difusão rodando em 127.0.0.1:5000
[DATA] Recebido de User_5432. Difundindo seq=0
[DATA] Recebido de User_8901. Difundindo seq=1
[NACK] Cliente (127.0.0.1, 54321) solicitou reenvio da seq=0
[REPLAY] seq=0 reenviada para (127.0.0.1, 54321)
```

---

## 5. Blocos de Código Relevantes

### Cliente: Envio de Mensagem (DATA)

```python
def send_message(self):
    content = self.entry_msg.get().strip()
    if not content:
        return
        
    # Monta pacote de dados
    packet = {
        "type": "DATA",
        "sender": self.client_name,  # ID único: User_5432
        "content": content
    }
    
    # Envia para o servidor
    try:
        self.socket.sendto(
            json.dumps(packet).encode('utf-8'), 
            (SERVER_HOST, SERVER_PORT)
        )
        self.entry_msg.delete(0, tk.END)
    except Exception as e:
        self.log(f"[-] Erro ao enviar mensagem: {e}")
```

**O que acontece:**
- Cria pacote JSON com tipo "DATA"
- Identifica o remetente com seu ID único
- Envia via UDP para o servidor (127.0.0.1:5000)

---

### Cliente: Detecção de NACK (Perda)

```python
def process_packet(self, packet):
    seq = packet.get("seq")
    
    # Se a sequência for exatamente a esperada
    if seq == self.expected_seq:
        self.log(f"[{packet['sender']}]: {packet['content']} (seq={seq})")
        self.expected_seq += 1
        # Processa buffer de fora de ordem
        while self.expected_seq in self.out_of_order_buffer:
            next_packet = self.out_of_order_buffer.pop(self.expected_seq)
            self.log(f"[{next_packet['sender']}]: {next_packet['content']}")
            self.expected_seq += 1
    
    # Se veio uma sequência maior: DETECTOU BURACO!
    elif seq > self.expected_seq:
        self.out_of_order_buffer[seq] = packet
        self.log(f"❓ Detectado buraco! Esperado: {self.expected_seq}, Recebido: {seq}")
        
        # Dispara NACK para cada pacote perdido
        for missing_seq in range(self.expected_seq, seq):
            nack_packet = {
                "type": "NACK",
                "seq": missing_seq
            }
            self.socket.sendto(
                json.dumps(nack_packet).encode('utf-8'), 
                (SERVER_HOST, SERVER_PORT)
            )
```

**O que acontece:**
- Verifica se `seq` recebido é o esperado
- Se há lacuna (seq > expected): armazena no buffer
- Envia NACK para cada seq perdida
- Aguarda resposta via REPLAY

---

### Servidor: Resposta a NACK

```python
elif packet_type == "NACK":
    # Cliente detectou perda e pede reenvio
    requested_seq = packet.get("seq")
    print(f"[NACK] Cliente {addr} solicitou reenvio da seq={requested_seq}")
    
    with self.lock:  # Proteção contra condição de corrida
        if requested_seq in self.history_buffer:
            # Reenvia via unicast apenas para esse cliente
            self.server_socket.sendto(
                json.dumps(self.history_buffer[requested_seq]).encode('utf-8'), 
                addr
            )
            print(f"[REPLAY] seq={requested_seq} reenviada para {addr}")
        else:
            print(f"[AVISO] seq={requested_seq} não encontrada no histórico.")
```

**O que acontece:**
- Recebe pedido NACK com número de sequência
- Consulta o histórico (history_buffer)
- Reenvia apenas para o cliente que pediu (unicast)
- Se não existe no histórico, avisa

---

### Servidor: Exclusão Mútua

```python
def handle_packet(self, data, addr):
    try:
        packet = json.loads(data.decode('utf-8'))
        
        if packet_type == "DATA":
            # SEÇÃO CRÍTICA: Incrementa sequence_number
            with self.lock:  # ← LOCK ADQUIRIDO
                seq = self.sequence_number
                self.sequence_number += 1  # Acesso exclusivo
                
                broadcast_packet = {
                    "type": "BROADCAST",
                    "seq": seq,
                    "sender": packet["sender"],
                    "content": packet["content"]
                }
                
                # Salva no histórico
                self.history_buffer[seq] = broadcast_packet
            # ← LOCK LIBERADO
            
            print(f"[DATA] Difundindo seq={seq}")
            self.broadcast(broadcast_packet)
```

**Por que o lock é necessário:**
- Múltiplos clientes enviam mensagens simultaneamente
- Sem lock: duas threads podem ler sequence_number como 0, ambas criam seq=0 (ERRO!)
- Com lock: apenas uma thread incrementa por vez, garantindo seq único

---

## 6. Instruções de Instalação e Execução

### Requisitos
- **Python:** 3.8 ou superior
- **Bibliotecas:** socket, threading, json, tkinter (todas incluídas na stdlib do Python)
- **Sistema Operacional:** Windows, Linux, macOS
- **Conexão:** Localhost (127.0.0.1) ou rede local

### Instalação

1. **Verificar Python instalado:**
   ```bash
   python --version
   # Deve retornar: Python 3.8.x ou superior
   ```

2. **Clonar ou baixar os arquivos:**
   ```bash
   # Coloque os arquivos em um diretório
   - servidor.py
   - cliente.py
   ```

### Execução

#### Terminal 1: Iniciar o Servidor
```bash
python servidor.py
```

**Saída esperada:**
```
[*] Servidor de Difusão rodando em 127.0.0.1:5000
```

#### Terminal 2+: Iniciar Cliente(s)
```bash
python cliente.py
```

**Saída esperada:**
- Abre janela GUI com ID do cliente (ex: "User_5432")
- Pronto para enviar mensagens

#### Testando o Protocolo

1. **Abra pelo menos 2 clientes** (em terminais diferentes)
2. **Cliente 1:** Digita "Olá" e aperta Enter
3. **Servidor registra:** `[DATA] Recebido de User_5432. Difundindo seq=0`
4. **Cliente 2 recebe:** `[User_5432]: Olá (seq=0)`
5. **Cliente 1:** Digita "Teste"
6. **Simulação de perda:** 25% de chance de ser ignorado
   - Se perdido: Cliente 2 vê ⚠️ [SIMULAÇÃO] Pacote seq=1 foi perdido
   - Cliente 2 envia NACK
   - Servidor reenvia
7. **Cliente 2 recupera:** `[NACK] Cliente solicitou reenvio da seq=1`

---

## 7. Diagrama da Arquitetura

```
┌─────────────────────────────────────────────┐
│           REDE UDP (127.0.0.1)              │
└─────────────────────────────────────────────┘
              ↓             ↓             ↓
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Cliente1 │   │ Cliente2 │   │ Cliente3 │
        │GUI       │   │GUI       │   │GUI       │
        │          │   │          │   │          │
        │ ID:User_ │   │ ID:User_ │   │ ID:User_ │
        │ Expected │   │ Expected │   │ Expected │
        │ seq: 0   │   │ seq: 0   │   │ seq: 0   │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             └──────────────┬──────────────┘
                            ↓
                    ┌───────────────────┐
                    │ Servidor Central  │
                    │ (CentralBroker)   │
                    │                   │
                    │ Porta: 5000       │
                    │                   │
                    │ Estruturas:       │
                    │ - clients: set    │
                    │ - seq_number: 0   │
                    │ - history: {}     │
                    │ - lock: mutex     │
                    └───────────────────┘
```

---

## 8. Protocolo NACK em Detalhes

### Máquina de Estados do Cliente

```
        ┌──────────────┐
        │    RECEBER   │
        └──────┬───────┘
               │ BROADCAST
               ↓
        ┌──────────────┐
    ┌──→│ seq ==       │
    │   │ expected?    │
    │   └──────┬───────┘
    │          │
    │    ┌─────┴─────┐
    │    ↓           ↓
    │   SIM         NÃO
    │    │           │
    │    ↓           ↓
    │ ┌──────┐  ┌──────────────┐
    │ │EXIBIR│  │ seq >        │
    │ │      │  │ expected?    │
    │ └──┬───┘  └──────┬───────┘
    │    │             │
    │    │        ┌────┴────┐
    │    │        ↓         ↓
    │    │      SIM        NÃO
    │    │       │          │
    │    │       ↓          ↓
    │    │  ┌─────────┐  ┌──────┐
    │    │  │GUARDAR  │  │ENVIAR│
    │    │  │BUFFER   │  │NACK  │
    │    │  └────┬────┘  └──────┘
    │    │       │
    └────┴───────┘
         ↑
         └─ PRÓXIMA MENSAGEM
```

### Garantias do Protocolo

| Propriedade | Garantida | Como |
|-------------|-----------|------|
| Ordenação | ✓ | Cliente reordena com buffer |
| Confiabilidade | ✓ | NACK detecta e pede reenvio |
| Exclusão Mútua | ✓ | Lock protege seq_number |
| Sem Duplicatas | ✓ | NACK apenas para perdidas |

---

## 9. Possíveis Extensões

- [ ] Implementar timeout nos NACK
- [ ] Persistent storage do history_buffer
- [ ] Suporte a múltiplos servidores (eleição de líder)
- [ ] Compressão de mensagens
- [ ] Criptografia end-to-end

---

## Conclusão

Este trabalho demonstra a aplicação prática dos conceitos de **sincronização**, **exclusão mútua**, **cliente-servidor**, e **protocolo de confiabilidade** em um sistema distribuído real, utilizando Python e UDP.
