/**
 * Handler de Grupo - BAN CONFIGURÁVEL
 * Ativa/Desativa ban de gringos com comando
 */

import { ProtectionUtils } from '../utils/protectionUtils.js';
import { WelcomeHandler } from './welcomeHandler.js';
import { config } from '../../config.js';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

export class GroupHandler {
    
    static BAN_DIR = './ban_config';

    /**
     * Inicializa pasta de config
     */
    static async init() {
        try {
            if (!existsSync(this.BAN_DIR)) {
                const fs = await import('fs/promises');
                await fs.mkdir(this.BAN_DIR, { recursive: true });
                console.log(`📁 Pasta de ban config criada`);
            }
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
    
    /**
     * Processa quando membro entra no grupo
     */
    static async handleGroupParticipantsUpdate(update, sock, groupJid) {
        try {
            const { participants, action } = update;

            if (action !== 'add') {
                return;
            }

            console.log(`\n👥 NOVO(S) MEMBRO(S) ENTRANDO`);
            console.log(`📍 Grupo: ${groupJid}`);

            // Processar cada novo membro
            for (const participant of participants) {
                await this.handleNewMember(participant, sock, groupJid);
            }

        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }

    /**
     * Processa novo membro
     */
    static async handleNewMember(participant, sock, groupJid) {
        try {
            // Extrair número
            const number = ProtectionUtils.extractNumber({ key: { participant } }, true);

            if (!number) {
                console.log(`⚠️ Número inválido`);
                return;
            }

            console.log(`📱 Novo membro: ${number}`);

            // Verificar se é gringo
            const isForeign = ProtectionUtils.isForeignNumber(number, config.protection.antigringo.countryCode);
            
            // ✅ VERIFICAR SE BAN ESTÁ ATIVADO
            const banEnabled = this.isBanEnabled(groupJid);

            if (isForeign && banEnabled) {
                // Gringo + Ban ativado = BAN
                console.log(`⛔ GRINGO + BAN ATIVADO`);
                console.log(`🔨 BANINDO...`);

                await this.banMember(sock, groupJid, participant);

                if (config.protection.actions.banMessage) {
                    await this.sendBanNotification(sock, groupJid);
                }

            } else {
                // Qualquer outro caso = WELCOME
                if (isForeign && !banEnabled) {
                    console.log(`🌍 Gringo (mas ban desativado)`);
                } else {
                    console.log(`🇧🇷 Brasileiro`);
                }
                
                console.log(`✅ Bem-vindo ao grupo!`);
                
                // Manda welcome sticker
                await WelcomeHandler.sendWelcomeSticker(sock, groupJid, number);
            }

        } catch (error) {
            console.error(`❌ Erro:`, error);
        }
    }

    /**
     * Verifica se ban está ativado para este grupo
     */
    static isBanEnabled(groupJid) {
        const banFile = join(this.BAN_DIR, `${groupJid}.ban`);
        return existsSync(banFile);
    }

    /**
     * Ativa ban de gringos
     */
    static enableBan(groupJid) {
        try {
            const banFile = join(this.BAN_DIR, `${groupJid}.ban`);
            writeFileSync(banFile, '1');
            console.log(`✅ Ban de gringos ATIVADO`);
            return true;
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }

    /**
     * Desativa ban de gringos
     */
    static disableBan(groupJid) {
        try {
            const banFile = join(this.BAN_DIR, `${groupJid}.ban`);
            if (existsSync(banFile)) {
                unlinkSync(banFile);
            }
            console.log(`✅ Ban de gringos DESATIVADO`);
            return true;
        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }

    /**
     * Ver status do ban
     */
    static getBanStatus(groupJid) {
        const isEnabled = this.isBanEnabled(groupJid);
        
        if (isEnabled) {
            return `🔨 Ban de gringos: ATIVADO\n\n❌ Gringos serão banidos\n✅ Brasileiros receberão welcome`;
        } else {
            return `🔓 Ban de gringos: DESATIVADO\n\n✅ Todos podem entrar\n✅ Todos receberão welcome`;
        }
    }

    /**
     * Bane um membro
     */
    static async banMember(sock, groupJid, participant) {
        try {
            await sock.groupParticipantsUpdate(
                groupJid,
                [participant],
                'remove'
            );

            console.log(`✅ Banido!`);
            return true;

        } catch (error) {
            console.error(`❌ Erro ao banir:`, error.message);
            return false;
        }
    }

    /**
     * Notifica ban
     */
    static async sendBanNotification(sock, groupJid) {
        try {
            const message = `⛔ Membro gringo foi banido!\n\n🇧🇷 Este grupo aceita apenas brasileiros.`;

            await sock.sendMessage(groupJid, {
                text: message
            });

        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
}