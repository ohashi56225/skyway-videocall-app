from clients.GoogleSpeechRecognition import GoogleSpeechRecognition
from clients.AmazonPolly import AmazonPolly
from command_manager import CommandManager

asr_client = GoogleSpeechRecognition(("localhost", 8888), 3)
tts_client = AmazonPolly(("localhost", 3456))

cm = CommandManager("localhost", 8001)
cm.run_forever()

while True:
    user_utt = ""

    cmd = cm.check_queue()
    if cmd:
        if cmd == "/start": user_utt = "スタートします"
        elif cmd == "/restart": user_utt = "リスタートします"
        elif cmd == "/end": user_utt = "対話を終了します"
    else:
        asr_result = asr_client.listen_once()
        if asr_result["usr_utt"] != "silence":
            user_utt = asr_result["usr_utt"]

    if user_utt:
        tts_client.play_utt(user_utt)