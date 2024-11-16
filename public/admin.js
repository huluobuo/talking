const socket = io();

// 更新在线人数
socket.on('online count', (count) => {
    document.getElementById('online-count').textContent = `当前在线人数: ${count}`;
});

// 更新已连接的 IP 地址
socket.on('connected ips', (ips) => {
    const connectedIpsDiv = document.getElementById('connected-ips');
    connectedIpsDiv.innerHTML = '已连接的 IP 地址:<br>' + ips.join('<br>');
});

// 更新日志信息
socket.on('log message', (message) => {
    const logMessagesDiv = document.getElementById('log-messages');
    logMessagesDiv.innerHTML += `<br>${message}`;
});
