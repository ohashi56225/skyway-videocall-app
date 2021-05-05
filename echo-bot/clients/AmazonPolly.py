import sys
import json
import time
from copy import deepcopy

from clients.BaseClient import Base

class AmazonPolly(Base):
    def __init__(self, ip_port):
        super().__init__(ip_port)

        self.config = {
            "engine": "POLLY",
            "speaker": "Mizuki",# 女性の音声
            "pitch": 100,       # 50~200(100)
            "volume":100,       # 50~400(100)
            "speed": 110,       # 50~200(100)
            "vocal-tract-length":0,
            "duration-information":True,
            "speechmark":False,
            "text": "",         # 発話文
        }

        self.interval_simbol = "+"

    def _check_result(self, received_data):
        if "result" not in received_data:
            return ""

        elif received_data["result"] == "success-start":
            return ""

        elif received_data["result"] == "success-end":
            print("{}:: End speaking successfully.".format(self.__class__.__name__))
            return "success-end"

        elif received_data["result"] == "failed":
            print("{}:: Failed speaking.".format(self.__class__.__name__))
            return "failed"

        else:
            print("{}:: {} is not TTS result.".format(self.__class__.__name__, received_data["result"]))
            return ""
    
    def _wait_speaking(self, interval):
        print("{}:: Is speaking...".format(self.__class__.__name__))
        is_speaking = True
        while is_speaking:
            received = self.sock.recv(1024)
            if received:
                received_data = json.loads(received.decode("utf-8").strip())
                result = self._check_result(received_data)
                if result == "success-end":
                    time.sleep(interval) # 追加のインターバル
                    break
                elif result == "failed":
                    break
            time.sleep(0.1)
            continue

        return result

    def _split_utt(self, system_utt):
        """
        システム発話を"+"もしくは"++"で分割する
        return [sentence1, sentence2, ...], [interval1, interval2, ...]
        """

        sentence_list, interval_list = [], [] # 一文, 間隔(秒)
        sentence, interval = "", 0
        for c in system_utt.strip(self.interval_simbol):
            if c == self.interval_simbol:
                if sentence:
                    sentence_list.append(sentence)
                    sentence = ""
                # 一文開始
                interval += 0.5
            else:
                if interval > 0:
                    interval_list.append(interval)
                    interval = 0
                sentence += c
        
        sentence_list.append(sentence)
        interval_list.append(0.5) # 最後0.5秒待つ

        # print(sentence_list, interval_list)
        return sentence_list, interval_list

    def _play_one_sentence(self, sentence, interval):
        print("{}:: Play one sentence.".format(self.__class__.__name__))

        # 結果によっては追加で2回までやり直し
        failed_count = 0
        for _ in range(3):
            # 1. 送信データ作成
            command_dict = self.config.copy()
            command_dict.update({
                "text": sentence
            })
            command = json.dumps(command_dict)

            # 2. 送信
            self._send_command(command)

            # 3. 再生+インターバル待ち
            result = self._wait_speaking(interval)

            if result == "success-end":
                break
            elif result == "failed":
                failed_count += 1
                continue

        return deepcopy({"result": result, "failed_count": failed_count})

    def _print_one_sentence(self, sentence, interval):
        # print("{}:: Print one sentence.".format(self.__class__.__name__))
        print("{}:: {} ({})".format(self.__class__.__name__, sentence, interval))
        time.sleep(interval)
        

    def play_utt(self, system_utt):
        # print(system_utt)
        tts_result = {}
        sentence_count = 0
        sentence_list, interval_list = self._split_utt(system_utt)
        for sentence, interval in zip(sentence_list, interval_list):
            sentence_count += 1
            result = self._play_one_sentence(sentence, interval)
            if result["failed_count"] > 0:
                sys.exit("{}:: Failed count: {}".format(self.__class__.__name__, result["failed_count"]))
            tts_result.update({
                sentence_count: result
            })
        
        return deepcopy(tts_result)