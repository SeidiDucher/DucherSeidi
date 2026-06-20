import socket
import tkinter as tk
from tkinter import scrolledtext
import threading
import json
from datetime import datetime

MONITOR_HOST = '127.0.0.1'
MONITOR_PORT = 5001


class ServerMonitorIntegrated:
    def __init__(self, root):
        self.root = root
        self.root.title(
            "🔍 Monitor de Servidor - Difusão Confiável (Ntempo REAL)")
        self.root.geometry("1100x750")
        self.root.configure(bg="#f0f0f0")

        # Socket UDP para receber eventos do servidor
        self.listen_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.listen_socket.bind((MONITOR_HOST, MONITOR_PORT))
        self.listen_socket.settimeout(0.5)

        # Dados do monitor
        self.clients_data = {}  # {addr: {"name": ..., "messages": ..., "nacks": ...}}
        self.total_messages = 0
        self.total_nacks = 0
        self.total_replays = 0
        self.total_broadcasts = 0

        self.create_widgets()
        self.start_event_listener()

    def create_widgets(self):
        """Cria a interface do monitor"""

        # ===== BARRA SUPERIOR (Status)
        header_frame = tk.Frame(self.root, bg="#2c3e50", height=60)
        header_frame.pack(fill=tk.X, padx=0, pady=0)

        title = tk.Label(header_frame, text="📡 Monitor em Tempo Real - Servidor NACK",
                         font=("Arial", 14, "bold"), bg="#2c3e50", fg="white")
        title.pack(pady=10)

        # ===== FRAME PRINCIPAL (3 colunas)
        main_frame = tk.Frame(self.root, bg="#f0f0f0")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # --- COLUNA 1: Clientes Conectados
        left_frame = tk.LabelFrame(main_frame, text="👥 Clientes Conectados",
                                   font=("Arial", 10, "bold"), bg="white", padx=10, pady=10)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))

        self.clients_list = scrolledtext.ScrolledText(
            left_frame, wrap=tk.WORD, height=20, width=32)
        self.clients_list.pack(fill=tk.BOTH, expand=True)
        self.clients_list.config(
            state=tk.DISABLED, font=("Courier", 9), bg="#f9f9f9")

        # --- COLUNA 2: Log de Eventos
        middle_frame = tk.LabelFrame(main_frame, text="📋 Log de Eventos",
                                     font=("Arial", 10, "bold"), bg="white", padx=10, pady=10)
        middle_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        self.events_log = scrolledtext.ScrolledText(
            middle_frame, wrap=tk.WORD, height=20, width=42)
        self.events_log.pack(fill=tk.BOTH, expand=True)
        self.events_log.config(
            state=tk.DISABLED, font=("Courier", 8), bg="#f9f9f9")

        # Configurar cores para diferentes tipos de evento
        self.events_log.tag_configure(
            "DATA", foreground="#27ae60", background="#ecfdf5")
        self.events_log.tag_configure(
            "NACK", foreground="#e74c3c", background="#ffe8e8")
        self.events_log.tag_configure(
            "REPLAY", foreground="#3498db", background="#e8f5ff")
        self.events_log.tag_configure(
            "BROADCAST", foreground="#f39c12", background="#fff9e8")
        self.events_log.tag_configure(
            "CLIENT", foreground="#9b59b6", background="#f5e8ff")
        self.events_log.tag_configure(
            "INFO", foreground="#555555", background="#f0f0f0")

        # --- COLUNA 3: Estatísticas
        right_frame = tk.LabelFrame(main_frame, text="📊 Estatísticas",
                                    font=("Arial", 10, "bold"), bg="white", padx=15, pady=15)
        right_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(5, 0))

        # Estatísticas em cards
        self.stats_frame = tk.Frame(right_frame, bg="white")
        self.stats_frame.pack(fill=tk.BOTH, expand=True)

        self.stat_clients = self.create_stat_card(
            self.stats_frame, "👥 Clientes", "0", "#9b59b6")
        self.stat_messages = self.create_stat_card(
            self.stats_frame, "📨 Mensagens", "0", "#27ae60")
        self.stat_broadcasts = self.create_stat_card(
            self.stats_frame, "📡 Broadcasts", "0", "#f39c12")
        self.stat_nacks = self.create_stat_card(
            self.stats_frame, "❌ NACKs", "0", "#e74c3c")
        self.stat_replays = self.create_stat_card(
            self.stats_frame, "🔄 Replays", "0", "#3498db")

        # ===== BARRA INFERIOR (Controles)
        footer_frame = tk.Frame(self.root, bg="#ecf0f1", height=50)
        footer_frame.pack(fill=tk.X, padx=0, pady=0)

        btn_clear = tk.Button(footer_frame, text="🗑️ Limpar Log", command=self.clear_log,
                              bg="#95a5a6", fg="white", font=("Arial", 9), padx=10, pady=5)
        btn_clear.pack(side=tk.LEFT, padx=10, pady=10)

        btn_reset = tk.Button(footer_frame, text="🔄 Resetar Estatísticas", command=self.reset_stats,
                              bg="#34495e", fg="white", font=("Arial", 9), padx=10, pady=5)
        btn_reset.pack(side=tk.LEFT, padx=5, pady=10)

        self.status_label = tk.Label(footer_frame, text="⏳ Aguardando eventos...",
                                     font=("Arial", 9), bg="#ecf0f1")
        self.status_label.pack(side=tk.LEFT, padx=10, pady=10)

    def create_stat_card(self, parent, title, value, color):
        """Cria um card de estatística"""
        card = tk.Frame(parent, bg=color, highlightthickness=0)
        card.pack(fill=tk.X, pady=8)

        tk.Label(card, text=title, font=("Arial", 10, "bold"),
                 bg=color, fg="white", padx=10, pady=5, justify=tk.LEFT).pack(side=tk.LEFT)

        value_label = tk.Label(card, text=value, font=("Arial", 16, "bold"),
                               bg=color, fg="white", padx=10, pady=5)
        value_label.pack(side=tk.RIGHT, padx=10)

        return value_label

    def add_event(self, event_type, message, tag="INFO"):
        """Adiciona evento ao log com timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]

        self.events_log.config(state=tk.NORMAL)
        self.events_log.insert(
            tk.END, f"[{timestamp}] {event_type}: {message}\n", tag)
        self.events_log.yview(tk.END)
        self.events_log.config(state=tk.DISABLED)

    def add_client(self, addr, client_name):
        """Adiciona cliente à lista"""
        if addr not in self.clients_data:
            self.clients_data[addr] = {
                "name": client_name,
                "messages_sent": 0,
                "nacks_received": 0,
                "replays_sent": 0,
                "broadcasts_received": 0
            }
            self.update_clients_list()
            self.add_event("✅ NOVO CLIENTE",
                           f"{client_name} ({addr[0]}:{addr[1]})", "CLIENT")
            self.update_stats()

    def update_clients_list(self):
        """Atualiza a lista de clientes"""
        self.clients_list.config(state=tk.NORMAL)
        self.clients_list.delete(1.0, tk.END)

        if not self.clients_data:
            self.clients_list.insert(
                tk.END, "Nenhum cliente conectado ainda...")
        else:
            for i, (addr, data) in enumerate(self.clients_data.items(), 1):
                client_info = f"#{i} 👤 {data['name']}\n"
                client_info += f"    IP: {addr[0]}:{addr[1]}\n"
                client_info += f"    Msg Enviadas: {data['messages_sent']}\n"
                client_info += f"    NACKs: {data['nacks_received']}\n"
                client_info += f"    Replays: {data['replays_sent']}\n"
                client_info += f"    Broadcasts: {data['broadcasts_received']}\n"
                client_info += "    " + "─" * 28 + "\n"

                self.clients_list.insert(tk.END, client_info)

        self.clients_list.config(state=tk.DISABLED)

    def update_stats(self):
        """Atualiza as estatísticas"""
        num_clients = len(self.clients_data)
        self.stat_clients.config(text=str(num_clients))
        self.stat_messages.config(text=str(self.total_messages))
        self.stat_broadcasts.config(text=str(self.total_broadcasts))
        self.stat_nacks.config(text=str(self.total_nacks))
        self.stat_replays.config(text=str(self.total_replays))

    def clear_log(self):
        """Limpa o log de eventos"""
        self.events_log.config(state=tk.NORMAL)
        self.events_log.delete(1.0, tk.END)
        self.events_log.config(state=tk.DISABLED)
        self.add_event("🗑️", "Log limpo", "INFO")

    def reset_stats(self):
        """Reseta estatísticas"""
        self.total_messages = 0
        self.total_nacks = 0
        self.total_replays = 0
        self.total_broadcasts = 0

        for addr in self.clients_data:
            self.clients_data[addr]["messages_sent"] = 0
            self.clients_data[addr]["nacks_received"] = 0
            self.clients_data[addr]["replays_sent"] = 0
            self.clients_data[addr]["broadcasts_received"] = 0

        self.update_clients_list()
        self.update_stats()
        self.add_event("🔄", "Estatísticas resetadas", "INFO")

    def process_event(self, event):
        """Processa evento recebido da fila"""
        try:
            event_type = event.get("type")
            data = event.get("data", {})

            if event_type == "CLIENT_CONNECTED":
                addr = tuple(data.get("addr"))
                name = data.get("name")
                self.add_client(addr, name)

            elif event_type == "DATA_RECEIVED":
                sender = data.get("sender")
                seq = data.get("seq")
                content = data.get("content", "")
                self.total_messages += 1

                # Atualizar cliente
                for addr, client_data in self.clients_data.items():
                    if client_data["name"] == sender:
                        client_data["messages_sent"] += 1
                        break

                self.add_event(
                    f"📨 DATA (seq={seq})", f"{sender}: \"{content}\"", "DATA")
                self.update_clients_list()
                self.update_stats()

            elif event_type == "BROADCAST_SENT":
                seq = data.get("seq")
                num_clients = data.get("num_clients")
                self.total_broadcasts += 1

                self.add_event(
                    f"📡 BROADCAST", f"seq={seq} para {num_clients} cliente(s)", "BROADCAST")
                self.update_stats()

            elif event_type == "NACK_RECEIVED":
                addr = tuple(data.get("addr"))
                seq = data.get("seq")
                self.total_nacks += 1

                if addr in self.clients_data:
                    self.clients_data[addr]["nacks_received"] += 1

                self.add_event(
                    "❌ NACK", f"{addr[0]}:{addr[1]} pedindo seq={seq}", "NACK")
                self.update_clients_list()
                self.update_stats()

            elif event_type == "REPLAY_SENT":
                addr = tuple(data.get("addr"))
                seq = data.get("seq")
                self.total_replays += 1

                if addr in self.clients_data:
                    self.clients_data[addr]["replays_sent"] += 1

                self.add_event(
                    "🔄 REPLAY", f"seq={seq} reenviada para {addr[0]}:{addr[1]}", "REPLAY")
                self.update_clients_list()
                self.update_stats()

            self.status_label.config(
                text=f"✅ Última atualização: {datetime.now().strftime('%H:%M:%S')}")

        except Exception as e:
            print(f"Erro processando evento: {e}")

    def start_event_listener(self):
        """Inicia listener de eventos UDP"""
        def listen():
            while True:
                try:
                    data, _ = self.listen_socket.recvfrom(2048)
                    event = json.loads(data.decode('utf-8'))
                    self.root.after(0, self.process_event, event)
                except socket.timeout:
                    continue
                except Exception as e:
                    self.add_event(
                        "ERRO", f"Erro no listener UDP: {e}", "INFO")
                    break

        threading.Thread(target=listen, daemon=True).start()


if __name__ == "__main__":
    root = tk.Tk()
    monitor = ServerMonitorIntegrated(root)
    root.mainloop()
