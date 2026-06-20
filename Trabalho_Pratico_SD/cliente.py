import socket
import threading
import json
import tkinter as tk
from tkinter import messagebox, scrolledtext
import random
import time

SERVER_HOST = '127.0.0.1'
SERVER_PORT = 5000
CHANCE_DE_PERDA = 0.25  # 25% de chance de simular perda de pacote na difusão


class ClientGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Cliente - Difusão Confiável (NACK)")
        self.root.geometry("500x500")

        # Estado do Protocolo de Confiavel
        self.client_name = f"User_{random.randint(1000, 9999)}"
        self.expected_seq = 0
        self.out_of_order_buffer = {}  # Guarda pacotes futuros: {seq: pacote}

        # Configuração do Socket
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

        # Elementos da Interface UI
        self.create_widgets()

        # Thread para escutar o servidor em background
        threading.Thread(target=self.receive_messages, daemon=True).start()

    def create_widgets(self):
        # Nome do usuário
        lbl_name = tk.Label(
            self.root, text=f"Seu ID: {self.client_name}", font=("Arial", 10, "bold"))
        lbl_name.pack(pady=5)

        # Área de log/mensagens
        self.chat_area = scrolledtext.ScrolledText(
            self.root, wrap=tk.WORD, height=18)
        self.chat_area.pack(padx=10, pady=5, fill=tk.BOTH, expand=True)
        self.chat_area.config(state=tk.DISABLED)

        # Entrada de texto e botão de envio
        frame_input = tk.Frame(self.root)
        frame_input.pack(fill=tk.X, padx=10, pady=10)

        self.entry_msg = tk.Entry(frame_input, font=("Arial", 11))
        self.entry_msg.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        self.entry_msg.bind("<Return>", lambda event: self.send_message())

        btn_send = tk.Button(frame_input, text="Enviar",
                             command=self.send_message, bg="#4CAF50", fg="white")
        btn_send.pack(side=tk.RIGHT)

    def log(self, text):
        # Atualiza a área de texto de forma segura entre threads
        self.chat_area.config(state=tk.NORMAL)
        self.chat_area.insert(tk.END, text + "\n")
        self.chat_area.yview(tk.END)
        self.chat_area.config(state=tk.DISABLED)

    def send_message(self):
        content = self.entry_msg.get().strip()
        if not content:
            return

        packet = {
            "type": "DATA",
            "sender": self.client_name,
            "content": content
        }

        try:
            self.socket.sendto(json.dumps(packet).encode(
                'utf-8'), (SERVER_HOST, SERVER_PORT))
            self.entry_msg.delete(0, tk.END)
        except Exception as e:
            self.log(f"[-] Erro ao enviar mensagem: {e}")

    def receive_messages(self):
        # Envia uma mensagem inicial vazia apenas para registrar o cliente no servidor
        init_packet = {"type": "DATA", "sender": self.client_name,
                       "content": "Entrou no grupo."}
        self.socket.sendto(json.dumps(init_packet).encode(
            'utf-8'), (SERVER_HOST, SERVER_PORT))

        while True:
            try:
                data, _ = self.socket.recvfrom(1024)
                packet = json.loads(data.decode('utf-8'))

                # SIMULAÇÃO DE PERDA (Apenas para mensagens tipo BROADCAST originais)
                # Não dropamos respostas de reenvio direto para não quebrar o teste infinitamente
                if packet.get("type") == "BROADCAST" and random.random() < CHANCE_DE_PERDA:
                    self.log(
                        f"⚠️ [SIMULAÇÃO] Pacote seq={packet['seq']} foi perdido/ignorado de propósito!")
                    continue

                self.process_packet(packet)

            except Exception as e:
                self.log(f"[-] Erro na recepção: {e}")
                break

    def process_packet(self, packet):
        seq = packet.get("seq")

        # Se for o número de sequência esperado
        if seq == self.expected_seq:
            self.log(f"[{packet['sender']}]: {packet['content']} (seq={seq})")
            self.expected_seq += 1

            # Verifica se as próximas sequências já estão no buffer de fora de ordem
            while self.expected_seq in self.out_of_order_buffer:
                next_packet = self.out_of_order_buffer.pop(self.expected_seq)
                self.log(
                    f"[{next_packet['sender']}]: {next_packet['content']} (seq={self.expected_seq}) [Recuperado do Buffer]")
                self.expected_seq += 1

        # Se veio uma sequência MAIOR, temos um GAP (perda detectada!)
        elif seq > self.expected_seq:
            # Guarda o pacote atual que veio adiantado
            self.out_of_order_buffer[seq] = packet
            self.log(
                f"❓ Detectado buraco na sequência! Esperado: {self.expected_seq}, Recebido: {seq}")

            # Dispara NACKs para todos os pacotes perdidos no intervalo
            for missing_seq in range(self.expected_seq, seq):
                self.log(f"🔄 Disparando NACK pedindo seq={missing_seq}...")
                nack_packet = {
                    "type": "NACK",
                    "seq": missing_seq
                }
                self.socket.sendto(json.dumps(nack_packet).encode(
                    'utf-8'), (SERVER_HOST, SERVER_PORT))

        # Se veio uma sequência MENOR (provavelmente resposta de um NACK antigo)
        else:
            # Caso essa mensagem resolva algo que estávamos esperando tardiamente
            if seq < self.expected_seq:
                # O processamento direto já ocorreu ou ela é reinserida se encaixar na lógica do buffer.
                # Como guardamos no buffer de fora de ordem, se o Nack chegar, tratamos aqui:
                self.log(f"📦 Resposta de NACK recebida! Tratando seq={seq}")
                # Exibe na tela (pode ficar fora de ordem visual na UI do chat, mas o protocolo ordenou internamente)
                self.log(
                    f"[{packet['sender']}]: {packet['content']} (seq={seq}) [NACK RECOVERY]")


if __name__ == "__main__":
    root = tk.Tk()
    app = ClientGUI(root)
    root.mainloop()
