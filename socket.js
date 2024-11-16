// socket.js
import { Server } from 'socket.io';
import fs from 'fs';
import logger from './logger.js';

const setupSocket = (server, blacklist, connectedIps, onlineUsers, messages) => {
    const io = new Server(server);

    const updateConnectedIpsFile = () => {
        const ipsArray = Array.from(connectedIps);
        fs.writeFile('connectedIps.json', JSON.stringify(ipsArray), 'utf8', (err) => {
            if (err) {
                logger.error('保存连接 IP 地址失败: ' + err);
            }
        });
    };

    io.on('connection', (socket) => {
        const userIp = socket.handshake.address;

        if (blacklist.includes(userIp)) {
            socket.emit('blacklist', `您的IP ${userIp} 在黑名单中，无法进入聊天。`);
            socket.disconnect();
            logger.warn(`拒绝用户连接，IP 地址在黑名单中: ${userIp}`);
            return;
        }

        if (connectedIps.has(userIp)) {
            socket.emit('connection denied', `您的IP ${userIp} 已经连接，无法再次连接。`);
            socket.disconnect();
            logger.warn(`拒绝用户连接，IP 地址已连接: ${userIp}`);
            return;
        }

        connectedIps.add(userIp);
        onlineUsers++;
        updateConnectedIpsFile();
        logger.info(`新用户连接，当前在线人数: ${onlineUsers}, 用户 IP 地址: ${userIp}`);

        io.emit('online count', onlineUsers);
        io.emit('connected ips', Array.from(connectedIps));

        // Load previous messages from message.json and send to the new connection
        fs.readFile('message.json', 'utf8', (err, data) => {
            if (err) {
                logger.error('读取聊天记录失败: ' + err);
                socket.emit('previous messages', []); // Send an empty array if there's an error
            } else {
                try {
                    const messages = JSON.parse(data);
                    socket.emit('previous messages', messages); // Send previous messages to new connection
                } catch (parseErr) {
                    logger.error('解析聊天记录失败: ' + parseErr);
                    socket.emit('previous messages', []); // Send an empty array if parsing fails
                }
            }
        });

        // Handle incoming chat messages
        socket.on('chat message', (msg) => {
            // Read current messages from message.json
            fs.readFile('message.json', 'utf8', (err, data) => {
                let messages = [];
                if (!err) {
                    try {
                        messages = JSON.parse(data);
                    } catch (parseErr) {
                        logger.error('解析聊天记录失败: ' + parseErr);
                    }
                }

                messages.push(msg); // Append the new message

                // Save updated messages back to message.json
                fs.writeFile('message.json', JSON.stringify(messages, null, 2), (err) => {
                    if (err) {
                        logger.error('保存消息到 message.json 失败: ' + err);
                    } else {
                        logger.info(`用户消息: ${msg}, 用户 IP 地址: ${userIp}`); // Log the message
                        io.emit('log message', msg); // Broadcast the new message to all clients
                    }
                });
            });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            connectedIps.delete(userIp);
            onlineUsers--;
            updateConnectedIpsFile();
            logger.info(`用户已断开连接，当前在线人数: ${onlineUsers}, 用户 IP 地址: ${userIp}`);
            io.emit('online count', onlineUsers);
            io.emit('connected ips', Array.from(connectedIps));
        });
    });
};

export default setupSocket;