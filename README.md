# 通話手順
## 対話システム側
- 例：`echo-bot`
### 対話システムの起動
- 通話アプリからのコマンドをwebsocketで受信できるようにする
- 通話アプリと対話システムでコマンドが合うようにする
### 音声ルートの設定
- **対話システム-通話アプリ間の音声ルートを設定する**
    1. Voicemeeter Bananaを起動して，以下を設定
        - VIRTUAL INPUTS > Voicemeeter VAIO > B1: On
        - それ以外の全てのI/O: Off
    2. Windowsサウンドコントロールパネルの再生タブにて以下を設定
        - Voicemeeter Input: 規定のデバイス
        - Voicemeeter Aux Input: 規定の通信デバイス（必須ではない？）
    3. Windowsサウンドコントロールパネルの録音タブにて以下を設定
        - Voicemeeter Output: 規定のデバイス
        - Voicemeeter Aux Output: 規定の通信デバイス（必須ではない？）
    - *注意*
        - VAIOのB1に全ての音声が集まってしまうので，システムの音声をシステムに入力しないようにするのは，恐らく不可能．
        - なぜか，上記の設定にしても，ユーザから来た音声がユーザに返らない．Voicemeeter BananaがVAIOのB1を良いようにしてくれているのかもしれない．
- 以下のような場合は適宜Voicemeeter Bananaで設定する
    - システム側PCのマイク音声を通話アプリに入力したい場合
        - HARDWARE INPUT 1 > B1: On
    - 通話アプリから来たユーザの音声をシステム側PCのスピーカーで再生したい場合
        - VIRTUAL INPUTS > Voicemeeter VAIO > A1: On
- その他Voicemeeter Bananaの使い方などは以下を参照する
    - [【OBS】Voicemeeter Bananaを使い、通話音声を「入れない」で配信する方法](https://vip-jikkyo.net/voicemeeter-banana-for-obs-discord)

### 通話の準備
- 通話アプリを設定する
    - websocket serverのuriなど，config.jsを設定する
- 通話アプリに接続する

## ユーザ側
### 音声デバイスの設定
- ヘッドセット等を使用する
    - 通話アプリからの音声（システム発話の音声）が通話アプリに帰らないようにスピーカーは使用しない
### 通話の準備
1. 通話アプリを起動する
2. システム側のPeer IDを入力してConnectボタンを押す
    - メッセージ欄に"/rejcet"と出ている場合は，他のユーザが通話しているので通話できない
    - 通話できる場合は，callボタンとcloseボタンが活性化する
3. callボタンを押して，システムとの通話を開始する

### 対話の実行
1. Recordのstartボタンを押して，録音録画を開始する
2. 下の方のstartボタンを押すことでシステムとの対話を開始する
3. 途中でシステムに問題があった場合は，restartボタンで対話をやり直す
    - 対話をやり直す際は，録音録画もやり直す
4. 対話が終了したら，endボタンを押して，対話を終了する
5. Recordのstopボタンを押して，録音録画を終了する
6. Downloadのリンクをクリックして，システムとユーザの録音録画データをそれぞれダウンロードする
