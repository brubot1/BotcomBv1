// src/handlers/antiLinkHandler.js
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export class AntiLinkHandler {
    
    static ANTI_LINK_DIR = './antilink_config';
    
    // Domínios bloqueados por padrão
    static DEFAULT_BLOCKED_DOMAINS = [
    'whatsapp.com',
    'chat.whatsapp.com',
    'wa.me',
    'youtube.com',
    'youtu.be',
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'adf.ly',
    'shorte.st',
    'fc.lc',
    'linktree.com',
    'instagram.com',
    'facebook.com',
    'tiktok.com',
    'twitter.com'
];
    
    /**
     * Inicializa a pasta de configuração
     */
    static async init() {
        try {
            if (!existsSync(this.ANTI_LINK_DIR)) {
                mkdirSync(this.ANTI_LINK_DIR, { recursive: true });
                console.log('📁 Pasta do anti-link criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    /**
     * Salva configuração de um grupo
     */
    static async saveConfig(groupJid, config) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_LINK_DIR, fileName);
            await writeFile(filePath, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar config:', error);
            return false;
        }
    }
    
    /**
     * Carrega configuração de um grupo
     */
    static async loadConfig(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            const filePath = join(this.ANTI_LINK_DIR, fileName);
            
            if (existsSync(filePath)) {
                const data = await readFile(filePath, 'utf-8');
                return JSON.parse(data);
            }
            
            // Configuração padrão
            return {
                enabled: false,
                action: 'delete', // 'delete', 'warn', 'kick'
                blockedDomains: [...this.DEFAULT_BLOCKED_DOMAINS],
                whitelistDomains: [],
                whitelistUsers: [],
                customMessage: null
            };
        } catch (error) {
            console.error('❌ Erro ao carregar config:', error);
            return {
                enabled: false,
                action: 'delete',
                blockedDomains: [...this.DEFAULT_BLOCKED_DOMAINS],
                whitelistDomains: [],
                whitelistUsers: [],
                customMessage: null
            };
        }
    }
    
    /**
     * Ativa/desativa anti-link no grupo
     */
    static async setEnabled(groupJid, enabled) {
        const config = await this.loadConfig(groupJid);
        config.enabled = enabled;
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    /**
     * Define ação para links
     */
    static async setAction(groupJid, action) {
        const validActions = ['delete', 'warn', 'kick'];
        if (!validActions.includes(action)) {
            return { success: false, error: 'Ação inválida. Use: delete, warn ou kick' };
        }
        
        const config = await this.loadConfig(groupJid);
        config.action = action;
        await this.saveConfig(groupJid, config);
        return { success: true, config };
    }
    
    /**
     * Adiciona domínio à whitelist
     */
    static async addWhitelistDomain(groupJid, domain) {
        const config = await this.loadConfig(groupJid);
        if (!config.whitelistDomains.includes(domain)) {
            config.whitelistDomains.push(domain);
            await this.saveConfig(groupJid, config);
        }
        return config;
    }
    
    /**
     * Remove domínio da whitelist
     */
    static async removeWhitelistDomain(groupJid, domain) {
        const config = await this.loadConfig(groupJid);
        config.whitelistDomains = config.whitelistDomains.filter(d => d !== domain);
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    /**
     * Adiciona usuário à whitelist
     */
    static async addWhitelistUser(groupJid, userNumber) {
        const config = await this.loadConfig(groupJid);
        if (!config.whitelistUsers.includes(userNumber)) {
            config.whitelistUsers.push(userNumber);
            await this.saveConfig(groupJid, config);
        }
        return config;
    }
    
    /**
     * Remove usuário da whitelist
     */
    static async removeWhitelistUser(groupJid, userNumber) {
        const config = await this.loadConfig(groupJid);
        config.whitelistUsers = config.whitelistUsers.filter(u => u !== userNumber);
        await this.saveConfig(groupJid, config);
        return config;
    }
    
    /**
     * Verifica se uma mensagem contém link bloqueado
     */
    static async checkMessage(messageText, groupJid, senderNumber) {
        const config = await this.loadConfig(groupJid);
        
        if (!config.enabled) {
            return { blocked: false, reason: 'disabled' };
        }
        
        // Verificar se usuário está na whitelist
        if (config.whitelistUsers.includes(senderNumber)) {
            return { blocked: false, reason: 'whitelist_user' };
        }
        
        if (!messageText) {
            return { blocked: false, reason: 'no_text' };
        }
        
        // Extrair links da mensagem
        const urls = this.extractUrls(messageText);
        
        if (urls.length === 0) {
            return { blocked: false, reason: 'no_links' };
        }
        
        // Verificar cada URL
        for (const url of urls) {
            const domain = this.extractDomain(url);
            
            // Verificar se está na whitelist
            if (config.whitelistDomains.includes(domain)) {
                continue; // Pula, não bloqueia
            }
            
            // Verificar se está na lista de bloqueio
            if (this.isBlockedDomain(domain, config.blockedDomains)) {
                return {
                    blocked: true,
                    reason: 'link_blocked',
                    domain: domain,
                    action: config.action,
                    url: url
                };
            }
        }
        
        return { blocked: false, reason: 'allowed' };
    }
    
    /**
     * Extrai URLs do texto
     */
    static extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*)/gi;
        const matches = text.match(urlRegex);
        return matches || [];
    }
    
    /**
     * Extrai domínio de uma URL
     */
    static extractDomain(url) {
        try {
            let cleanUrl = url;
            if (!cleanUrl.startsWith('http')) {
                cleanUrl = 'https://' + cleanUrl;
            }
            const hostname = new URL(cleanUrl).hostname;
            return hostname.replace(/^www\./, '');
        } catch {
            // Se falhar, tenta extrair manualmente
            const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
            return match ? match[1] : url;
        }
    }
    
    /**
     * Verifica se domínio está bloqueado
     */
    static isBlockedDomain(domain, blockedDomains) {
    const lowerDomain = domain.toLowerCase();
    return blockedDomains.some(blocked => {
        const lowerBlocked = blocked.toLowerCase();
        return lowerDomain === lowerBlocked || lowerDomain.endsWith(`.${lowerBlocked}`);
    });
}
    
    /**
     * Gera mensagem de aviso
     */
    static getWarningMessage(action, domain) {
        const messages = {
            delete: `⚠️ *LINK BLOQUEADO*\n\nO domínio *${domain}* não é permitido neste grupo.\nSua mensagem foi deletada.`,
            warn: `⚠️ *ATENÇÃO*\n\nLinks para *${domain}* não são permitidos neste grupo.\n\n📌 Próxima vez será removido(a) do grupo.`,
            kick: `🚫 *LINK PROIBIDO*\n\nVocê compartilhou um link para *${domain}*.\nIsso viola as regras do grupo.`
        };
        
        return messages[action] || messages.delete;
    }
    
    /**
     * Verifica se o usuário é admin do grupo
     */
    static async isAdmin(sock, groupJid, participant) {
        try {
            const metadata = await sock.groupMetadata(groupJid);
            const admins = metadata.participants
                .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                .map(p => p.id);
            
            return admins.includes(participant);
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }
    
    /**
     * Remove usuário do grupo
     */
    static async kickUser(sock, groupJid, participant) {
        try {
            await sock.groupParticipantsUpdate(groupJid, [participant], 'remove');
            return true;
        } catch (error) {
            console.error('❌ Erro ao remover:', error);
            return false;
        }
    }
    
    /**
     * Obtém status do anti-link para exibição
     */
    static async getStatus(groupJid) {
        const config = await this.loadConfig(groupJid);
        
        let statusText = `🔗 *ANTI-LINK*\n\n`;
        statusText += `📊 Status: ${config.enabled ? '✅ ATIVADO' : '❌ DESATIVADO'}\n`;
        statusText += `⚡ Ação: ${config.action === 'delete' ? '🗑️ Deletar' : config.action === 'warn' ? '⚠️ Avisar' : '🔨 Remover'}\n\n`;
        
        if (config.enabled) {
            statusText += `🚫 *DOMÍNIOS BLOQUEADOS:*\n`;
            const blocked = config.blockedDomains.slice(0, 10);
            for (const domain of blocked) {
                statusText += `• ${domain}\n`;
            }
            if (config.blockedDomains.length > 10) {
                statusText += `• ... e mais ${config.blockedDomains.length - 10}\n`;
            }
            
            if (config.whitelistDomains.length > 0) {
                statusText += `\n✅ *DOMÍNIOS LIBERADOS:*\n`;
                for (const domain of config.whitelistDomains) {
                    statusText += `• ${domain}\n`;
                }
            }
            
            if (config.whitelistUsers.length > 0) {
                statusText += `\n👑 *USUÁRIOS LIBERADOS:* ${config.whitelistUsers.length}\n`;
            }
        }
        
        statusText += `\n📌 *COMANDOS:*\n`;
        statusText += `• !antilink on/off - Ativar/Desativar\n`;
        statusText += `• !antilink action delete/warn/kick - Definir ação\n`;
        statusText += `• !antilink whitelist add/remove [domínio] - Liberar domínio\n`;
        statusText += `• !antilink allow/deny [@usuário] - Liberar/Bloquear usuário\n`;
        statusText += `• !antilink status - Ver configuração\n`;
        
        return statusText;
    }
}