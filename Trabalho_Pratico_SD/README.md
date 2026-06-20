# 🔄 Difusão Confiável baseado em NACK

Sistema de **broadcast confiável com reconhecimento negativo (NACK)** implementado em Python com arquitetura cliente-servidor usando UDP.

## 📌 Quick Start

### Terminal 1: Inicie o Servidor
```bash
python servidor.py
```

### Terminal 2+: Inicie Clientes (abra quantos quiser)
```bash
python cliente.py
```

Isso é tudo! Agora cada cliente tem uma janela GUI onde pode digitar mensagens.

---

## ✅ Requisitos

- **Python 3.8+** (verificar com `python --version`)
- **Tkinter** (geralmente vem com Python)
- **Nenhuma dependência externa** (usa apenas stdlib)

### Verificar se Tkinter está instalado
```bash
python -m tkinter
```
Se abrir uma janela pequena → OK ✓

---

## 🚀 Modo de Uso Completo

### 1. Abra um Terminal e execute o Servidor
```bash
cd Trabalho_Pratico_SD
python servidor.py
```

**Saída esperada:**
```
[*] Servidor de Difusão rodando em 127.0.0.1:5000
```

### 2. Abra outro Terminal(is) para Cliente(s)
```bash
cd Trabalho_Pratico_SD
python cliente.py
```

**Saída esperada:**
- Uma janela GUI abre
- No topo mostra seu ID (ex: "Seu ID: User_5432")
- Área de mensagens no centro
- Campo de texto + botão "Enviar" na base

### 3. Teste a Difusão
1. Digite uma mensagem no **Cliente 1**
2. Clique em "Enviar" ou aperte Enter
3. **Todos os clientes** (inclusive Cliente 1) recebem a mensagem
4. Veja o identificador de sequência: `(seq=0), (seq=1)`, etc.

### 4. Veja o Protocolo NACK em Ação
- 25% de chance de uma mensagem ser "perdida" propositalmente
- Quando isso acontece, o cliente:
  - ⚠️ Mostra: `[SIMULAÇÃO] Pacote seq=X foi perdido`
  - 🔄 Dispara NACK pedindo reenvio
  - Servidor reenvia
  - Cliente recupera a mensagem

---

## 📊 Exemplo de Execução Prática

### Cenário: 3 Clientes Comunicando

**Terminal 1 (Servidor):**
```
[*] Servidor de Difusão rodando em 127.0.0.1:5000
[DATA] Recebido de User_1234. Difundindo seq=0
[DATA] Recebido de User_5678. Difundindo seq=1
[NACK] Cliente (127.0.0.1, 54321) solicitou reenvio da seq=1
[REPLAY] seq=1 reenviada para (127.0.0.1, 54321)
```

**Terminal 2 (Cliente 1 - User_1234):**
```
Seu ID: User_1234
```
[Digitou "Olá"]
```
[User_1234]: Olá (seq=0)
[User_5678]: Tudo bem? (seq=1)
[User_9999]: Olá para todos! (seq=2)
```

**Terminal 3 (Cliente 2 - User_5678):**
```
Seu ID: User_5678
```
[Digitou "Tudo bem?"]
```
[User_1234]: Olá (seq=0)
[User_5678]: Tudo bem? (seq=1)
❓ Detectado buraco na sequência! Esperado: 2, Recebido: 3
🔄 Disparando NACK pedindo seq=2...
📦 Resposta de NACK recebida! Tratando seq=2
[User_9999]: Olá para todos! (seq=2)
```

---

## 🔧 Arquivos do Projeto

```
Trabalho_Pratico_SD/
├── servidor.py           # Broker central de difusão
├── cliente.py            # GUI cliente com protocolo NACK
├── descricao.md          # Documentação técnica completa
├── ANALISE_REQUISITOS.md # Análise de conformidade
└── README.md             # Este arquivo
```

---

## 📋 Estrutura de Mensagens

### Tipo: DATA (Cliente → Servidor)
```json
{
  "type": "DATA",
  "sender": "User_5432",
  "content": "Minha mensagem"
}
```

### Tipo: BROADCAST (Servidor → Clientes)
```json
{
  "type": "BROADCAST",
  "seq": 0,
  "sender": "User_5432",
  "content": "Minha mensagem"
}
```

### Tipo: NACK (Cliente → Servidor)
```json
{
  "type": "NACK",
  "seq": 5
}
```

### Tipo: REPLAY (Servidor → Cliente)
```json
{
  "type": "BROADCAST",
  "seq": 5,
  "sender": "User_5432",
  "content": "Mensagem anterior perdida"
}
```

---

## 🎯 Conceitos Implementados

| Conceito | Localização | Descrição |
|----------|------------|-----------|
| **Sincronização** | `servidor.py` linha 9 | `threading.Lock()` protege sequence_number |
| **Exclusão Mútua** | `servidor.py` linha 31 | `with self.lock:` garante acesso exclusivo |
| **Cliente-Servidor** | Ambos | UDP entre 127.0.0.1:5000 |
| **Protocolo NACK** | `cliente.py` linha 102+ | Detecta buracos e pede reenvio |
| **Identificação** | `cliente.py` linha 17 | ID único User_XXXX por cliente |
| **Números de Sequência** | `servidor.py` linha 7 | Contador global incrementado com lock |

---

## 🐛 Troubleshooting

### Problema: "ModuleNotFoundError: No module named 'tkinter'"
**Solução Windows:**
```bash
pip install tk
```

**Solução Linux (Debian/Ubuntu):**
```bash
sudo apt-get install python3-tk
```

**Solução macOS:**
```bash
brew install python-tk
```

### Problema: "Address already in use"
**Motivo:** Servidor ainda rodando na porta 5000

**Solução:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :5000
kill -9 <PID>
```

### Problema: Cliente não conecta ao servidor
**Verificações:**
1. Servidor está rodando? (veja "Terminal 1" acima)
2. Ambos em localhost (127.0.0.1)? ✓
3. Mesma porta (5000)? Sim, hardcoded
4. Firewall bloqueando? Tente desabilitar temporariamente

### Problema: Mensagens não aparecem
**Causas:**
- Servidor não está rodando
- Cliente não consegue enviar
- Veja console do servidor para erros

---

## 📊 Diagrama de Comunicação

```
┌────────────┐
│ Servidor   │
│  Porta     │  
│  5000      │
└─────┬──────┘
      │ UDP Broadcast
      │
 ┌────┼────┬─────────┐
 │    │    │         │
 ▼    ▼    ▼         ▼
[C1] [C2] [C3]     ...

Fluxo NACK:
1. Cliente recebe seq=0, seq=2 (pula seq=1)
2. Cliente envia NACK(seq=1) ao servidor
3. Servidor busca no history_buffer[seq=1]
4. Servidor reenvia BROADCAST(seq=1) só para aquele cliente
5. Cliente processa em ordem
```

---

## 🧪 Testes Sugeridos

### Teste 1: Difusão Básica
1. Abra 2 clientes
2. Cliente 1 envia "Teste 1"
3. Ambos devem receber
4. Cliente 2 envia "Teste 2"  
5. Ambos devem receber (incluindo Cliente 1)

### Teste 2: Detecção de Perda
1. Abra 1 cliente
2. Envie ~10 mensagens seguidas
3. Observe logs para "SIMULAÇÃO Pacote perdido"
4. Veja cliente enviando NACKs
5. Veja servidor reenviando

### Teste 3: Múltiplos Clientes
1. Abra 4+ clientes
2. Envie mensagens alternando entre eles
3. Todos devem receber todas em ordem
4. Veja sequence_number incrementar no servidor

### Teste 4: Stress
1. Abra 3 clientes
2. Envie mensagens rapidamente
3. Sistema deve manter ordem
4. Nenhuma mensagem deve ser perdida permanentemente

---

## 📝 Protocolo em Alto Nível

```
Operação Normal:
  C1 --DATA--> S (seq atribuído = 0)
  S  --BROADCAST--> C1, C2, C3 (seq=0)
  
Operação com Perda (Simulada):
  C1 --DATA--> S (seq atribuído = 5)
  S  --BROADCAST--> C1, C2 (C3 ignora por chance de 25%)
  C3 detecta falta de seq=5
  C3 --NACK(5)--> S
  S  --REPLAY(seq=5)--> C3 (via unicast)
  C3 recebe e processa
```

---

## 🎓 Conceitos Pedagógicos

Este projeto demonstra:

1. **Sincronização:** Lock garante acesso único ao counter
2. **Exclusão Mútua:** Seção crítica protegida
3. **Cliente-Servidor:** Arquitetura centralizada
4. **Protocolo de Confiabilidade:** NACK-based recovery
5. **Detecção de Falhas:** Via número de sequência
6. **Recuperação:** Buffer fora de ordem + reenvio
7. **UDP:** Sem conexão, mas com confiabilidade em camada aplicação
8. **Threading:** Processamento paralelo de múltiplos clientes

---

## 📚 Referências no Código

- **Sincronização:** `servidor.py:31-35` (with self.lock)
- **NACK:** `cliente.py:102-115` (disparo de NACK)
- **Reenvio:** `servidor.py:50-56` (REPLAY)
- **Reordenação:** `cliente.py:89-99` (buffer)
- **Identificação:** `cliente.py:17` (client_name)

---

## ⚖️ Licença

Trabalho acadêmico - Disciplina de Sistemas Distribuídos

---

## 📞 Suporte

Verifique `descricao.md` para documentação técnica detalhada.
Verifique `ANALISE_REQUISITOS.md` para conformidade com requisitos.
