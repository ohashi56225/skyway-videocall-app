const Peer = window.Peer;

var myHandler = (function(){
    /*send, start, restart, endボタンのクリックイベントを扱う関数*/
    var events = {},
        key = 0;
    return {
        addListener: function(target, type, listener, capture) {
            target.addEventListener(type, listener, capture);
            events[key] = {
                target: target,
                type: type,
                listener: listener,
                capture: capture
            };
            return key++;
        },
        removeListener: function(key) {
            if(key in events) {
                var e = events[key];
                e.target.removeEventListener(e.type, e.listener, e.capture);
            }
        }
    };
}());

(async function main() {
    const localVideo = document.getElementById('js-local-stream');
    const remoteVideo = document.getElementById('js-remote-stream');
    const localId = document.getElementById('js-local-id');
    const remoteId = document.getElementById('js-remote-id');
    const connectTrigger = document.getElementById('js-connect-trigger');
    const callTrigger = document.getElementById('js-call-trigger');
    const closeTrigger = document.getElementById('js-close-trigger');
    const recordTrigger = document.getElementById('js-record-trigger');
    const localDownloadLink = document.getElementById('downloadlink-local');
    const remoteDownloadLink = document.getElementById('downloadlink-remote');
    const messages = document.getElementById('js-messages');
    const localText = document.getElementById('js-local-text');
    const sendTrigger = document.getElementById('js-send-trigger');
    const startTrigger = document.getElementById('js-start-trigger');
    const restartTrigger = document.getElementById('js-restart-trigger');
    const endTrigger = document.getElementById('js-end-trigger');

    let isCalling = 0

    let localRecorder = null;
    let remoteRecorder = null;

    let keySend = null;
    let keyStart = null;
    let keyRestart = null;
    let keyEnd = null;

    // 各コマンドのボタンをクリックしたときの処理
    function onClickBtn(dataConnection, type) {
        return function() {
            const data = {
                peerid: localId.textContent,
                message: null,
            };
            if (type === "/send") {
                data.message = localText.value
                localText.value = '';
            } else {
                data.message = type;
            };
            dataConnection.send(data);
            messages.textContent += `${data.peerid}: ${data.message}\n`;
        }
    }
    
    const peer = (window.peer = new Peer({
        key: window.__SKYWAY_KEY__,
        debug: 3,
    }));

    const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { 
            width: {min: 320, max: 320}, 
            height: {min: 240, max: 240}
        }
    }).catch(console.error);

    // Render local stream
    localVideo.muted = true;
    localVideo.srcObject = localStream;
    localVideo.playsInline = true;
    await localVideo.play().catch(console.error);

    // handsonでは，peer.on(...)となっていたが，よくわからないのでpeer.once(...)のままにしておく
    peer.once('open', id => (localId.textContent = id));

    peer.on('error', console.error);

    // connectボタンを押したときに実行
    connectTrigger.addEventListener('click', () => {
        // まだシグナリングサーバーからopenされていない場合はreturn
        if (!peer.open || !remoteId.value) {
            return;
        }

        // disabled属性を設定
		connectTrigger.setAttribute("disabled", true);

        const dataConnection = peer.connect(remoteId.value);

        // データチャネルが接続された時発火
        dataConnection.once('open', async () => {
            // accept/requestを待つ
            dataConnection.on('data', data => {
                if (data.message === "/accept") {
                    messages.textContent += `${data.peerid}: ${data.message}\n`;
                    messages.textContent += `=== DataConnection has been opened ===\n`;

                    //イベントを定義して，各keyを取得
                    keySend = myHandler.addListener(sendTrigger, 'click', onClickBtn(dataConnection, "/send"), false);
                    keyStart = myHandler.addListener(startTrigger, 'click', onClickBtn(dataConnection, "/start"), false);
                    keyRestart = myHandler.addListener(restartTrigger, 'click', onClickBtn(dataConnection, "/restart"), false);
                    keyEnd = myHandler.addListener(endTrigger, 'click', onClickBtn(dataConnection, "/end"), false);
                    
                    // call, closeボタンを活性化
                    callTrigger.removeAttribute("disabled");
                    closeTrigger.removeAttribute("disabled");
                
                } else {
                    messages.textContent += `${data.peerid}: ${data.message}\n`;
                    dataConnection.close(true);
                    // disabled属性を削除
                    connectTrigger.removeAttribute("disabled");
                    return;
                }
            });
        });

        // データを受信したとき
        dataConnection.on('data', data => {
            messages.textContent += `${data.peerid}: ${data.message} (data)\n`;
        });

        // データチャネルのcloseが行われた時, 接続が切断された時
        dataConnection.once('close', () => {
            // massageにその旨を追記
            messages.textContent += `=== DataConnection has been closed ===\n`;

            myHandler.removeListener(keySend)
            myHandler.removeListener(keyStart)
            myHandler.removeListener(keyRestart)
            myHandler.removeListener(keyEnd)
            
            // connectボタンのdisabled属性を削除
            connectTrigger.removeAttribute("disabled");
            // call, closeボタンを非活性化
            callTrigger.setAttribute("disabled", true);
            closeTrigger.setAttribute("disabled", true);
        });

        // closeボタンのイベントリスナを登録
        closeTrigger.addEventListener('click', () => dataConnection.close(true), {
            once: true,
        });
    });

    // callボタン
    callTrigger.addEventListener('click', () => {
        // Note that you need to ensure the peer has connected to signaling server
        // before using methods of peer instance.
        if (!peer.open) {
            return;
        }

        // callボタンを非活性化
        callTrigger.setAttribute("disabled", true);

        const mediaConnection = peer.call(remoteId.value, localStream);

        mediaConnection.on('stream', async stream => {
            // Render remote stream for caller
            remoteVideo.srcObject = stream;
            remoteVideo.playsInline = true;
            await remoteVideo.play().catch(console.error);
        });

        mediaConnection.once('close', () => {
            remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            remoteVideo.srcObject = null;
        });

        closeTrigger.addEventListener('click', () => mediaConnection.close(true));
    });

    // recordボタン
    recordTrigger.addEventListener('click', () => {
        if (localRecorder && remoteRecorder) {
            // 既にrecordingをしていた時

            localRecorder.stop();
            remoteRecorder.stop();

            recordTrigger.textContent = "Start";
            localDownloadLink.href = "javascript:void(0)";
            remoteDownloadLink.href = "javascript:void(0)";

            return
        };

        if (localVideo.srcObject && remoteVideo.srcObject) {
            // 双方のstreamがあるとき

            // データ用配列とメディア形式の指定
            let localChunks = [];
            let remoteChunks = [];
            let options = {
                mimeType : 'video/webm; codecs=vp9'
            };

            // recorderオブジェクトを生成
            localRecorder = new MediaRecorder(localVideo.srcObject,options);
            remoteRecorder = new MediaRecorder(remoteVideo.srcObject,options);

            // localデータが到着したら発火
            localRecorder.ondataavailable = function(evt) {
                console.log("local data available: evt.data.type=" + evt.data.type + " size=" + evt.data.size);
                // chunksに格納していく
                localChunks.push(evt.data);
            };

            // remoteデータが到着したら発火
            remoteRecorder.ondataavailable = function(evt) {
                console.log("remote data available: evt.data.type=" + evt.data.type + " size=" + evt.data.size);
                // chunksに格納していく
                remoteChunks.push(evt.data);
            };

            // stopした場合に発火
            localRecorder.onstop = function(evt) {
                console.log('localRecorder.onstop(), so playback');
                
                // recorderを初期化
                localRecorder = null;

                // chunksのデータをダウンロード可能な形式に変換
                const videoBlob = new Blob(localChunks, { type: "video/webm"})
                // URL作成
                blobUrl = window.URL.createObjectURL(videoBlob);
                localDownloadLink.download = "local-recorded.webm";
                localDownloadLink.href = blobUrl;
            };

            // stopした場合に発火
            remoteRecorder.onstop = function(evt) {
                console.log('remoteRecorder.onstop(), so playback');
                
                // recorderを初期化
                remoteRecorder = null;

                // chunksのデータをダウンロード可能な形式に変換
                const videoBlob = new Blob(remoteChunks, { type: "video/webm"})
                // URL作成
                blobUrl = window.URL.createObjectURL(videoBlob);
                remoteDownloadLink.download = "remote-recorded.webm";
                remoteDownloadLink.href = blobUrl;
            };

            // 1秒単位のrecordを開始
            localRecorder.start(1000);
            remoteRecorder.start(1000);
            console.log('start recording');
            recordTrigger.textContent = "Stop";
            localDownloadLink.href = "javascript:void(0)";
            remoteDownloadLink.href = "javascript:void(0)";
        }
    });

    // 相手からconnectionが来た時に発火
    peer.on('connection', dataConnection => {
        // disabled属性を設定
		connectTrigger.setAttribute("disabled", true);

        dataConnection.once('open', async () => {
            isCalling++;
            messages.textContent += `=== check accept/reject (isCalling: ${isCalling}) ===\n`;

            if (isCalling <= 1 ) {
                messages.textContent += `=== can accept ===\n`;
                const data = {
                    peerid: localId.textContent,
                    message: "/accept",
                };
                dataConnection.send(data);
                messages.textContent += `${data.peerid}: ${data.message}\n`;
                messages.textContent += `=== DataConnection has been opened ===\n`;

                //イベントを定義すると同時に返ってきたkeyを取得;
                keySend = myHandler.addListener(sendTrigger, 'click', onClickBtn(dataConnection, "/send"), false);
                keyStart = myHandler.addListener(startTrigger, 'click', onClickBtn(dataConnection, "/start"), false);
                keyRestart = myHandler.addListener(restartTrigger, 'click', onClickBtn(dataConnection, "/restart"), false);
                keyEnd = myHandler.addListener(endTrigger, 'click', onClickBtn(dataConnection, "/end"), false);
            
            } else {
                messages.textContent += `=== can't accept ===\n`;
                const data = {
                    peerid: localId.textContent,
                    message: "/reject",
                }
                dataConnection.send(data);
                messages.textContent += `${data.peerid}: ${data.message}\n`;
                return;
            };
        });

        dataConnection.on('data', data => {
            messages.textContent += `${data.peerid}: ${data.message} (data)\n`;
        });

        dataConnection.once('close', () => {
            isCalling--;
            messages.textContent += `=== DataConnection has been closed ===\n`;

            myHandler.removeListener(keySend)
            myHandler.removeListener(keyStart)
            myHandler.removeListener(keyRestart)
            myHandler.removeListener(keyEnd)
        });

        // Register closing handler
        closeTrigger.addEventListener('click', () => dataConnection.close(true), {
            once: true,
        });
    });

    // Register callee handler
    peer.on('call', mediaConnection => {
        // 基本的にacceptした相手からしか callは来ないので，無条件にanswer
        mediaConnection.answer(localStream);

        mediaConnection.on('stream', async stream => {
            // Render remote stream for callee
            remoteVideo.srcObject = stream;
            remoteVideo.playsInline = true;
            await remoteVideo.play().catch(console.error);
        });

        mediaConnection.once('close', () => {
            remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            remoteVideo.srcObject = null;
        });

        closeTrigger.addEventListener('click', () => mediaConnection.close(true));
    });
})();