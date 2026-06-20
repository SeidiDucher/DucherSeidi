import socket
import threading
import json
import time

HOST = '127.0.0.1'
PORT = 5000
MONITOR_HOST = '127.0.0.1'
MONITOR_PORT = 5001


class CentralBroker:
    def __init__(self):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.server_socket.bind((HOST, PORT))
        self.monitor_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

        self.clients = {}          # Armazena {addr: client_name}
        self.sequence_number = 0   # Contador global de sequência
        self.history_buffer = {}   # Buffer de Histórico
        self.lock = threading.Lock()

    def emit_event(self, event_type, data):
        """Envia evento para o monitor"""
        try:
            monitor_packet = json.dumps(
                {"type": event_type, "data": data}).encode('utf-8')
            self.monitor_socket.sendto(
                monitor_packet, (MONITOR_HOST, MONITOR_PORT))
        except Exception:
            pass  # Se o monitor não estiver rodando, ignora

    def start(self):
        print(f"[*] Servidor de Difusão rodando em {HOST}:{PORT}")
        print(
            f"[*] Para visualizar: execute 'python monitor_integrado.py' em outro terminal")

        while True:
            try:
                data, addr = self.server_socket.recvfrom(1024)

                # Registra novo cliente
                if addr not in self.clients:
                    try:
                        packet = json.loads(data.decode('utf-8'))
                        client_name = packet.get(
                            "sender", f"Unknown_{addr[1]}")
                        self.clients[addr] = client_name
                        self.emit_event("CLIENT_CONNECTED", {
                            "addr": addr,
                            "name": client_name
                        })
                    except:
                        pass

                # Processa pacote em thread separada
                threading.Thread(target=self.handle_packet,
                                 args=(data, addr), daemon=True).start()

            except OSError as e:
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

                    # Salva no histórico
                    self.history_buffer[seq] = broadcast_packet

                # Emite evento para monitor
                self.emit_event("DATA_RECEIVED", {
                    "sender": packet["sender"],
                    "seq": seq,
                    "content": packet["content"]
                })

                print(
                    f"[DATA] Recebido de {packet['sender']}. Difundindo seq={seq}")
                self.broadcast(broadcast_packet)

            elif packet_type == "NACK":
                # Cliente detectou perda e pediu reenvio
                requested_seq = packet.get("seq")

                # Emite evento para monitor
                self.emit_event("NACK_RECEIVED", {
                    "addr": addr,
                    "seq": requested_seq
                })

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

                        # Emite evento para monitor
                        self.emit_event("REPLAY_SENT", {
                            "addr": addr,
                            "seq": requested_seq
                        })

                        print(
                            f"[REPLAY] seq={requested_seq} reenviada para {addr}")
                    else:
                        print(
                            f"[AVISO] seq={requested_seq} não encontrada no histórico.")

        except Exception as e:
            print(f"[-] Erro ao processar pacote: {e}")

    def broadcast(self, packet):
        """Envia pacote para todos os clientes"""
        encoded_packet = json.dumps(packet).encode('utf-8')

        # Emite evento de broadcast
        self.emit_event("BROADCAST_SENT", {
            "seq": packet["seq"],
            "num_clients": len(self.clients)
        })

        # Envia para todos
        for client_addr in list(self.clients.keys()):
            try:
                self.server_socket.sendto(encoded_packet, client_addr)
            except Exception:
                if client_addr in self.clients:
                    del self.clients[client_addr]


if __name__ == "__main__":
    server = CentralBroker()
    server.start()
