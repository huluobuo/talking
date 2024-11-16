// server.js
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import logger from './logger.js';
import setupSocket from './socket.js';
import routes from './routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Initialize onlineUsers
let onlineUsers = 0;

// Read blacklist
let blacklist = [];
fs.readFile('Blacklist.json', 'utf8', (err, data) => {
    if (err) {
        logger.error('读取黑名单失败: ' + err);
    } else {
        try {
            blacklist = JSON.parse(data);
        } catch (parseErr) {
            logger.error('解析黑名单失败: ' + parseErr);
        }
    }
});

// Read whitelist
let whitelist = [];
fs.readFile('Whitelist.json', 'utf8', (err, data) => {
    if (err) {
        logger.error('读取白名单失败: ' + err);
    } else {
        try {
            whitelist = JSON.parse(data);
        } catch (parseErr) {
            logger.error('解析白名单失败: ' + parseErr);
        }
    }
});

// Read previous chat records
let messages = [];
fs.readFile('message.json', 'utf8', (err, data) => {
    if (err) {
        logger.error('读取聊天记录失败: ' + err);
    } else {
        try {
            messages = JSON.parse(data);
        } catch (parseErr) {
            logger.error('解析聊天记录失败: ' + parseErr);
        }
    }
});

// Read previous connected IP addresses
let connectedIps = new Set();
fs.readFile('connectedIps.json', 'utf8', (err, data) => {
    if (err) {
        logger.error('读取连接 IP 地址失败: ' + err);
    } else {
        try {
            const ips = JSON.parse(data);
            ips.forEach(ip => connectedIps.add(ip)); // Add IP addresses to the set
        } catch (parseErr) {
            logger.error('解析连接 IP 地址失败: ' + parseErr);
        }
    }
});

// Use routes
app.use(routes(whitelist)); // Pass whitelist to routes
setupSocket(server, blacklist, connectedIps, onlineUsers, messages); // Pass blacklist, connectedIps, onlineUsers, and messages to Socket.IO

// Start server
const PORT = process.env.PORT || 8849;
server.listen(PORT, () => {
    logger.info(`服务器在 http://localhost:${PORT} 上运行`);
});