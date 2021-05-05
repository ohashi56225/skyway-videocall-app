from websocket_server import WebsocketServer

class WebSocketManager:
    def __init__(self, IP, PORT):
        # 接続
        self.server = WebsocketServer(PORT, host=IP)

        # 設定
        self.server.set_fn_new_client(self._when_new_client)
        self.server.set_fn_message_received(self._when_message_received)

    def _when_new_client(self, client, server):
        """
        新規のclientが接続してきたときの処理
        """
        print("new client")

    def _when_message_received(self, client, server, message):
        """
        あるclientからmessageを受信したとき
        """
        print(message)

    def run_forever(self):
        """
        サーバー起動
        """
        self.server.run_forever()

if __name__ == "__main__":
    IP = "localhost"
    PORT = 8001

    wsm = WebSocketManager(IP, PORT)
    wsm.run_forever()