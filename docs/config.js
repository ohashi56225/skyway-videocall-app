// skywayのAPIキー
window.SKYWAY_KEY = '33ddbc6c-0f40-4fa3-bef1-9a9c83863649';

// 映像の解像度設定
window.VIDEO_OPTION = { 
    width: {min: 320, max: 320}, 
    height: {min: 240, max: 240}
};

// 対話システムへのコマンド一覧
window.SYSTEM_COMMAND_LIST = [
    "/send", "/start", "/restart", "/end"
];

// 対話システムのwebsocket用uri
window.WEBSOCKET_SERVER_URI = "ws://localhost:8001"
