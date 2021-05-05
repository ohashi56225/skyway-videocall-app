from websocket_server import WebsocketServer
from threading import Thread

class BaseWebSocketServer:
    """
    WebSocketServerのベースクラス
    """
    def __init__(self, IP, PORT):
        # 接続
        self.server = WebsocketServer(PORT, host=IP)

        # 設定
        self.server.set_fn_new_client(self._when_new_client)
        self.server.set_fn_message_received(self._when_message_received)

        # スレッド
        self.thread = None

    def _when_new_client(self, client, server):
        """
        新規のclientが接続してきたときの処理
        """
        print("{}:: New client connected.".format(self.__class__.__name__))

    def _when_message_received(self, client, server, message):
        """
        あるclientからmessageを受信したとき
        """
        print("{}:: Received message \"{}\".".format(self.__class__.__name__, message))

    def run_forever(self):
        """
        サーバー起動
        """
        print("{}:: Run forever.".format(self.__class__.__name__))
        self.thread = Thread(target=self.server.run_forever)
        self.thread.setDaemon(True)
        self.thread.start()

class CommandManager(BaseWebSocketServer):
    """
    WebSocketServerベースクラスをもとにして，ユーザからのコマンドを管理するクラス
    """
    def __init__(self, IP, PORT):
        super().__init__(IP, PORT)

        # システムのコマンドリスト
        self.system_command_list = [
            "/send", "/start", "/restart", "/end"
        ]

        # 受信したコマンドを蓄積するキュー
        self.command_queue = []
    
    def _when_message_received(self, client, server, message):
        """
        メッセージ受信時の処理をオーバーライド
        """
        print("{}.:: Received message\"{}\".".format(self.__class__.__name__, message))
        if message in self.system_command_list:
            self.command_queue.append(message)
            print("{}:: Added {} to command stack.".format(self.__class__.__name__, message))
        else:
            print("{}:: {} is undefined command type.".format(self.__class__.__name__, message))

    def check_queue(self):
        """
        コマンドが溜まっているか確認する
        """
        if self.command_queue:
            print("{}:: There is unprocessed command.".format(self.__class__.__name__))
            return self.command_queue.pop(0)
        else:
            print("{}:: Command queue haven't been updated.".format(self.__class__.__name__))
            return ""
    
    def clear_queue(self):
        """
        コマンドキューをリセットする
        """
        self.command_queue.clear()
        print("{}:: Cleared command queue.".format(self.__class__.__name__))


if __name__ == "__main__":
    IP = "localhost"
    PORT = 8001

    cm = CommandManager(IP, PORT)
    cm.run_forever()

    while True:
        c = input("> ")
        print(cm.check_queue())