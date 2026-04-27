// src/handlers/commandLimitsHandler.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const LIMITS_DIR = './command_limits';
const DEFAULT_FREE_LIMITS = {
    '!fig': 10,
    '!s': 10,
    '!sticker': 10,
    '!toimg': 5,
    '!removebg': 3,
    '!scircle': 5,
    '!pack': 15,
    '!top': 999,      // ilimitado
    '!rank': 999,     // ilimitado
    '!menu': 999,     // ilimitado
    '!ping': 999,     // ilimitado
    '!packs': 999,    // ilimitado
};

export class CommandLimitsHandler {
    
    static LIMITS_DIR = LIMITS_DIR;
    
    static async init() {
        try {
            if (!existsSync(this.LIMITS_DIR)) {
                mkdirSync(this.LIMITS_DIR, { recursive: true });
                console.log('📁 Pasta de limites criada');
            }
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
    
    static async getUsagePath(groupJid, userId) {
        const groupFileName = groupJid.replace(/[^a-zA-Z0-9]/g, '_');
        const userFileName = userId.replace(/[^a-zA-Z0-9]/g, '_');
        return join(this.LIMITS_DIR, `${groupFileName}_${userFileName}.json`);
    }
    
    static async getConfigPath(groupJid) {
        const fileName = groupJid.replace(/[^a-zA-Z0-9]/g, '_');
        return join(this.LIMITS_DIR, `config_${fileName}.json`);
    }
    
    static async loadConfig(groupJid) {
        const configPath = await this.getConfigPath(groupJid);
        
        if (existsSync(configPath)) {
            const data = await readFile(configPath, 'utf-8');
            return JSON.parse(data);
        }
        
        return {
            enabled: false,
            limits: { ...DEFAULT_FREE_LIMITS },
            pricePerExtra: 5  // custo por comando extra em pontos
        };
    }
    
    static async saveConfig(groupJid, config) {
        const configPath = await this.getConfigPath(groupJid);
        await writeFile(configPath, JSON.stringify(config, null, 2));
        return true;
    }
    
    static async getUsage(groupJid, userId, command) {
        const usagePath = await this.getUsagePath(groupJid, userId);
        const today = new Date().toISOString().split('T')[0];
        
        if (existsSync(usagePath)) {
            const data = await readFile(usagePath, 'utf-8');
            const usage = JSON.parse(data);
            
            if (usage.date !== today) {
                return { date: today, commands: {} };
            }
            
            return usage;
        }
        
        return { date: today, commands: {} };
    }
    
    static async addUsage(groupJid, userId, command) {
        const usagePath = await this.getUsagePath(groupJid, userId);
        const usage = await this.getUsage(groupJid, userId, command);
        
        const currentCount = usage.commands[command] || 0;
        usage.commands[command] = currentCount + 1;
        
        await writeFile(usagePath, JSON.stringify(usage, null, 2));
        return usage.commands[command];
    }
    
    static async checkLimit(groupJid, userId, command, userPoints = 0) {
        const config = await this.loadConfig(groupJid);
        
        if (!config.enabled) {
            return { allowed: true, reason: 'disabled' };
        }
        
        const freeLimit = config.limits[command] || 5;
        const usage = await this.getUsage(groupJid, userId, command);
        const used = usage.commands[command] || 0;
        
        if (used < freeLimit) {
            const remaining = freeLimit - used;
            return { 
                allowed: true, 
                reason: 'free',
                remaining: remaining,
                used: used,
                limit: freeLimit
            };
        }
        
        // Verificar se tem pontos para pagar
        const pointsNeeded = config.pricePerExtra;
        
        if (userPoints >= pointsNeeded) {
            return {
                allowed: true,
                reason: 'paid',
                pointsNeeded: pointsNeeded,
                used: used,
                limit: freeLimit
            };
        }
        
        return {
            allowed: false,
            reason: 'no_points',
            freeLimit: freeLimit,
            used: used,
            pointsNeeded: pointsNeeded,
            userPoints: userPoints
        };
    }
    
    static async deductPoints(groupJid, userId, command) {
        const config = await this.loadConfig(groupJid);
        const usagePath = await this.getUsagePath(groupJid, userId);
        const usage = await this.getUsage(groupJid, userId, command);
        
        const used = usage.commands[command] || 0;
        const freeLimit = config.limits[command] || 5;
        
        if (used >= freeLimit) {
            return { deducted: true, points: config.pricePerExtra };
        }
        
        return { deducted: false, points: 0 };
    }
    
    static async getStatus(groupJid, userId, command, userPoints) {
        const config = await this.loadConfig(groupJid);
        
        if (!config.enabled) {
            return "📊 Sistema de limites DESATIVADO";
        }
        
        const freeLimit = config.limits[command] || 5;
        const usage = await this.getUsage(groupJid, userId, command);
        const used = usage.commands[command] || 0;
        const remaining = Math.max(0, freeLimit - used);
        
        let status = `🎯 *${command}*\n`;
        status += `📊 Limite grátis: ${used}/${freeLimit}\n`;
        
        if (remaining > 0) {
            status += `✅ Você ainda tem *${remaining}* uso(s) grátis hoje\n`;
        } else {
            status += `⚠️ Limite grátis excedido!\n`;
            status += `💰 Próximo uso custa *${config.pricePerExtra}* pontos\n`;
            status += `📊 Seus pontos: *${userPoints}*\n`;
        }
        
        return status;
    }
}