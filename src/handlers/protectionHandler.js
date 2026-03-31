/**
 * Handler de Proteção - VERSÃO SIMPLES
 * Apenas deixa mensagens passarem normalmente
 * O ban acontece em groupHandler.js
 */

import { ProtectionUtils } from '../utils/protectionUtils.js';
import { config } from '../../config.js';

export class ProtectionHandler {
    
    /**
     * Valida mensagens - AGORA APENAS DEIXA PASSAR
     * Ban de gringos acontece quando entram no grupo
     */
    static validateMessage(message) {
        try {
            // Não faz nada com mensagens
            // Ban automático acontece em groupHandler.js
            console.log(`✅ Mensagem passando (sem validação)`);
            return { blocked: false };

        } catch (error) {
            console.error('❌ Erro ao validar:', error);
            return { blocked: false };
        }
    }

    /**
     * Extrai texto da mensagem
     */
    static getMessageText(message) {
        const msg = message.message;
        return (
            msg?.conversation ||
            msg?.imageMessage?.caption ||
            msg?.videoMessage?.caption ||
            msg?.extendedTextMessage?.text ||
            ''
        );
    }

    /**
     * Envia mensagem de bloqueio
     */
    static async sendBlockMessage(sock, message, blockInfo) {
        try {
            const blockMessage = ProtectionUtils.getBlockMessage(blockInfo.type);
            
            await sock.sendMessage(message.key.remoteJid, {
                text: blockMessage
            }, { quoted: message });

            console.log(`✅ Mensagem de bloqueio enviada`);
        } catch (error) {
            console.error('❌ Erro ao enviar bloqueio:', error);
        }
    }

    /**
     * Deleta mensagem bloqueada
     */
    static async deleteBlockedMessage(sock, message) {
        try {
            await sock.sendMessage(message.key.remoteJid, {
                delete: message.key
            });
            console.log('✅ Mensagem deletada');
        } catch (error) {
            console.log('⚠️ Não foi possível deletar');
        }
    }
}