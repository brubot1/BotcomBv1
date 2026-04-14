// src/handlers/antiSpamHandler.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class AntiSpamHandler {
    
    static ANTI_SPAM_DIR = './antispam_config';
    
    static DEFAULT_CONFIG = {
        enabled: false,
        commandLimit: 4,
        timeWindow: 5000,
        blockTime: 5000
    };
    
    static userCommands = new Map();
    static userBlocked = new Map();
    
    static async init() {
        try {
            if (!existsSync(this.ANTI_SPAM_DIR)) {
                mkdirSync(this.ANTI_SPAM_DIR, { recursive: true });
                console.log('📁 Pasta do anti-spam criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    static async saveConfig(groupJid, config) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_SPAM_DIR, fileName);
            await writeFile(filePath, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            return false;
        }
    }
    
    static async loadConfig(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_SPAM_DIR, fileName);
            
            if (existsSync(filePath)) {
                const data = await readFile(filePath, 'utf-8');
                return { ...this.DEFAULT_CONFIG, ...JSON.parse(data) };
            }
            return { ...this.DEFAULT_CONFIG };
        } catch (error) {
            return { ...this.DEFAULT_CONFIG };
        }
    }
    
    static async setEnabled(groupJid, enabled) {
        const config = await this.loadConfig(groupJid);
        config.enabled = enabled;
        await this.saveConfig(groupJid, config);
        if (!enabled) this.clearGroupData(groupJid);
        return config;
    }
    
    static async setCommandLimit(groupJid, limit) {
        const config = await this.loadConfig(groupJid);
        config.commandLimit = Math.min(limit, 20);
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    static async setBlockTime(groupJid, seconds) {
        const config = await this.loadConfig(groupJid);
        config.blockTime = seconds * 1000;
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    static clearGroupData(groupJid) {
        const prefix = `${groupJid}_`;
        for (const key of this.userCommands.keys()) {
            if (key.startsWith(prefix)) this.userCommands.delete(key);
        }
        for (const key of this.userBlocked.keys()) {
            if (key.startsWith(prefix)) this.userBlocked.delete(key);
        }
    }
    
    static isBlocked(groupJid, userId) {
        const key = `${groupJid}_${userId}`;
        const until = this.userBlocked.get(key);
        if (until && until > Date.now()) return true;
        if (until && until <= Date.now()) this.userBlocked.delete(key);
        return false;
    }
    
    static blockUser(groupJid, userId, durationMs) {
        const key = `${groupJid}_${userId}`;
        this.userBlocked.set(key, Date.now() + durationMs);
    }
    
    static async checkCommand(groupJid, userId, config) {
        if (!config.enabled) {
            return { blocked: false };
        }
        
        if (this.isBlocked(groupJid, userId)) {
            return { 
                blocked: true, 
                message: `⏰ Aguarde alguns segundos antes de usar comandos novamente.`
            };
        }
        
        const now = Date.now();
        const key = `${groupJid}_${userId}`;
        let history = this.userCommands.get(key) || [];
        history = history.filter(t => (now - t) < config.timeWindow);
        
        if (history.length >= config.commandLimit) {
            this.blockUser(groupJid, userId, config.blockTime);
            const blockSeconds = Math.ceil(config.blockTime / 1000);
            this.userCommands.set(key, []);
            
            return {
                blocked: true,
                message: `⚠️ Você está usando comandos muito rápido!\nPor favor, aguarde ${blockSeconds} segundos.`
            };
        }
        
        history.push(now);
        this.userCommands.set(key, history);
        return { blocked: false };
    }
    
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            return admins.includes(participant);
        } catch (error) {
            return false;
        }
    }
    
    static async getStatus(groupJid) {
        const config = await this.loadConfig(groupJid);
        return `🛡️ *ANTI-SPAM*\n\n📊 Status: ${config.enabled ? '✅ ATIVADO' : '❌ DESATIVADO'}\n📨 Limite: ${config.commandLimit} comandos em ${config.timeWindow / 1000}s\n⏰ Bloqueio: ${config.blockTime / 1000}s`;
    }
}