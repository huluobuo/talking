// routes.js
import express from 'express';
import path from 'path';
import logger from './logger.js';

const router = express.Router();

const normalizeIp = (ip) => {
    // Normalize the IP address to its IPv4 format if possible
    if (ip.startsWith('::ffff:')) {
        return ip.substring(7); // Remove the IPv6 prefix
    }
    return ip;
};

const routes = (whitelist) => {
    router.get('/', (req, res) => {
        res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    });

    router.get('/admin', (req, res) => {
        const userIp = normalizeIp(req.ip.trim()); // Normalize and trim the IP address

        // Log the IP being checked and the whitelist for debugging
        logger.info(`Checking IP: ${userIp}`);
        logger.info(`Whitelist: ${JSON.stringify(whitelist)}`);

        // Check if the normalized IP is in the whitelist
        if (whitelist.map(ip => normalizeIp(ip.trim())).includes(userIp)) {
            res.sendFile(path.join(process.cwd(), 'public', 'admin.html'));
        } else {
            res.status(403).send('403 Forbidden: 您的 IP 地址不在白名单中。');
            logger.warn(`拒绝访问管理面板，IP 地址不在白名单中: ${userIp}`);
        }
    });

    return router;
};

export default routes;