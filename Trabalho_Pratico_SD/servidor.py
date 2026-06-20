import socket
import threading
import json
import time

HOST = '127.0.0.1'
PORT = 5000


class CentralBroker:
    def __init__(self):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.server_socket.bind((HOST, PORT))

        self.clients = set()          # Armazena (endereço, porta) dos clientes ativos
        self.sequence_number = 0      # Contador global de sequência
        self.history_buffer = {}      # Buffer de Histórico: {seq_num: mensagem_completa}
        self.lock = threading.Lock()  # Mutex para sincronização das threads

    def start(self):
        print(f"[*] Servidor de Difusão rodando em {HOST}:{PORT}")
        while True:
            try:
                data, addr = self.server_socket.recvfrom(1024)
                # Adiciona o cliente à lista de transmissão se for novo
                if addr not in self.clients:
                    self.clients.add(addr)

                # Executa o processamento do pacote em uma thread separada
                threading.Thread(target=self.handle_packet,
                                 args=(data, addr), daemon=True).start()
            except OSError as e:
                # Ignora erro WinError 10054 (cliente desconectou abruptamente)
                if "10054" not in str(e):
                    print(f"[-] Erro no loop principal: {e}")

    def handle_packet(self, data, addr):
        try:
            packet = json.loads(data.decode('utf-8'))
            packet_type = packet.get("type")

            if packet_type == "DATA":
                # Cliente enviando mensagem para ser difundida
                with self.lock:
                    seq = self.sequence_number
                    self.sequence_number += 1

                    # Monta o pacote de difusão
                    broadcast_packet = {
                        "type": "BROADCAST",
                        "seq": seq,
                        "sender": packet["sender"],
                        "content": packet["content"]
                    }

                    # Salva no histórico para possíveis reenvios (Nack)
                    self.history_buffer[seq] = broadcast_packet

                print(
                    f"[DATA] Recebido de {packet['sender']}. Difundindo seq={seq}")
                self.broadcast(broadcast_packet)

            elif packet_type == "NACK":
                # Cliente detectou perda e pediu reenvio
                requested_seq = packet.get("seq")
                print(
                    f"[NACK] Cliente {addr} solicitou reenvio da seq={requested_seq}")

                with self.lock:
                    if requested_seq in self.history_buffer:
                        # Reenvia via unicast apenas para quem pediu
                        self.server_socket.sendto(
                            json.dumps(self.history_buffer[requested_seq]).encode(
                                'utf-8'),
                            addr
                        )
                        print(
                            f"[REPLAY] seq={requested_seq} reenviada para {addr}")
                    else:
                        print(
                            f"[AVISO] seq={requested_seq} não encontrada no histórico.")

        except Exception as e:
            print(f"[-] Erro ao processar pacote: {e}")

    def broadcast(self, packet):
        encoded_packet = json.dumps(packet).encode('utf-8')
        # Envia para todos os clientes conhecidos
        for client_addr in list(self.clients):
            try:
                self.server_socket.sendto(encoded_packet, client_addr)
            except Exception:
                self.clients.remove(client_addr)  # Remove clientes caídos


if __name__ == "__main__":
    server = CentralBroker()
    server.start()
