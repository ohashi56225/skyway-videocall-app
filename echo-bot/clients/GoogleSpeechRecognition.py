import json
import time
import socket
from threading import Thread
from copy import deepcopy
from clients.BaseClient import Base

class GoogleSpeechRecognition(Base):
    def __init__(self, ip_port, silence_period):
        super().__init__(ip_port, timeout=silence_period)

        self.is_active = False
        self.received_data = None

    def start_server(self):
        command = "start"
        self._send_command(command)
        print("GSRClient:: start GSRServer")

    def stop_server(self):
        command = "stop"
        self._send_command(command)
        self.server_is_running = False
        print("GSRClient::stop GSRServer")

    def listening_forever(self):
        while self.is_active:
        # for _ in range(10):
            self.received_data = self._receive(1024)
            if self.received_data:
                self.received_data = self.received_data.decode("utf-8")
                # print(self.received_data)
            else:
                continue

    def listen_once(self):
        """
        1回だけASRに問い合わせる
        resultが来たら終了
        """

        # 1. サーバー起動
        self.start_server()

        # 2. resultが来るまで待つ
        usr_utt, confidence = "", float()
        while True:
            received_str = ""
            try:
                received_data = self._receive(1024)
            except socket.timeout:
                received_data = "result:silence\nconfidence:1\n".encode("utf-8")

            if received_data:
                try:
                    received_str = received_data.decode("utf-8")
                except UnicodeDecodeError:
                    received_str = "result:failed\nconfidence:1\n"
                # print("GSRClient:: Received: {}".format(received_str))
            else:
                time.sleep(0.1)
                continue
            
            if received_str.startswith("result:"):
                # resultを受け取る
                print(received_str)
                result_str, confidence_str, _ = received_str.split("\n")
                print(result_str)
                usr_utt = result_str.split(":")[1]
                print(usr_utt)
                confidence = float(confidence_str.split(":")[1])
                # 終了
                break
                # silence periodだけ，沈黙が続いたとき
        
        # 3. サーバを停止
        self.stop_server()

        # 4. asr_resultとして返還
        return deepcopy({"usr_utt": usr_utt, "confidence": confidence})
        

    def start_listening(self):
        self.start_server()

        self.is_active = True
        self.thread = Thread(target=self.listening_forever)
        self.thread.start()
        # self.listening_forever()
        print("GSRClient::start listening forever")

    def end_listening(self):
        self.is_active = False
        self.thread.join()
        print("GSRClient::end listening")

        self.stop_server()

        self._disconnect()
    
if __name__ == "__main__":
    test = GoogleSpeechRecognition(("127.0.0.1", 8888))

    for i in range(3):
        time.sleep(10)
        test.listen_once()
    #test.start_listening()
    #test.end_listening()
    test._disconnect()