/**
 * Handler de Boas-vindas - CORRIGIDO
 * Baixa, salva e envia figurinha corretamente
 */

import { readFile, writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

export class WelcomeHandler {
    
    static WELCOME_DIR = './welcome_stickers';

    /**
     * Inicializa pasta
     */
    static async init() {
        try {
            if (!existsSync(this.WELCOME_DIR)) {
                await mkdir(this.WELCOME_DIR, { recursive: true });
                console.log(`📁 Pasta de welcome criada`);
            }
        } catch (error) {
            console.error('❌ Erro:', error);
        }
    }
    
    /**
     * Envia welcome sticker quando novo membro entra
     */
    static async sendWelcomeSticker(sock, groupJid, participantNumber) {
        try {
            if (!this.isWelcomeEnabled(groupJid)) {
                console.log(`ℹ️ Welcome desativado`);
                return;
            }

            const stickerBuffer = await this.getWelcomeSticker(groupJid);
            
            if (!stickerBuffer) {
                console.log(`⚠️ Figurinha não configurada`);
                return;
            }

            // ✅ ENVIAR FIGURINHA CORRETAMENTE
            console.log(`📤 Enviando figurinha (${stickerBuffer.length} bytes)...`);
            
            await sock.sendMessage(groupJid, {
                sticker: stickerBuffer
            });

            console.log(`✅ Welcome sticker enviado!`);

        } catch (error) {
            console.error('❌ Erro:', error.message);
        }
    }

    /**
     * Salvar figurinha de welcome
     * CORRIGIDO: Verifica tamanho do arquivo
     */
    static async saveWelcomeSticker(groupJid, stickerBuffer, mediaType = 'image') {
        try {
            if (!stickerBuffer || stickerBuffer.length === 0) {
                console.log(`❌ Buffer vazio! Não conseguiu baixar figurinha`);
                return false;
            }

            console.log(`📥 Buffer recebido: ${stickerBuffer.length} bytes`);

            const fileName = `${groupJid}.webp`;
            const filePath = join(this.WELCOME_DIR, fileName);
            
            // Salvar arquivo
            await writeFile(filePath, stickerBuffer);
            
            // ✅ VERIFICAR se foi salvo
            const stats = statSync(filePath);
            console.log(`📁 Arquivo salvo: ${filePath}`);
            console.log(`📊 Tamanho: ${stats.size} bytes`);

            if (stats.size === 0) {
                console.log(`❌ Arquivo salvo mas vazio!`);
                return false;
            }

            console.log(`\n✅ FIGURINHA SALVA COM SUCESSO!`);
            console.log(`📊 Tamanho: ${stats.size} bytes`);
            console.log(`👥 Grupo: ${groupJid}`);
            console.log(`\n🚀 A figurinha será enviada quando novo membro entrar!`);
            console.log(`❌ Para desativar, use: !disablewelcome`);
            
            return true;

        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            return false;
        }
    }

    /**
     * Obter figurinha salva
     */
    static async getWelcomeSticker(groupJid) {
        try {
            const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
            
            if (!existsSync(filePath)) {
                console.log(`❌ Arquivo não existe: ${filePath}`);
                return null;
            }

            const stats = statSync(filePath);
            
            if (stats.size === 0) {
                console.log(`❌ Arquivo vazio: ${filePath}`);
                return null;
            }

            console.log(`✅ Carregando figurinha (${stats.size} bytes)`);
            return await readFile(filePath);

        } catch (error) {
            console.error('❌ Erro ao ler:', error);
            return null;
        }
    }

    /**
     * Desativar welcome
     */
    static async disableWelcome(groupJid) {
        try {
            const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
            
            if (existsSync(filePath)) {
                await unlink(filePath);
                console.log(`✅ Welcome desativado`);
                return true;
            }
            
            console.log(`ℹ️ Welcome não estava ativado`);
            return false;

        } catch (error) {
            console.error('❌ Erro:', error);
            return false;
        }
    }

    /**
     * Verificar se welcome está ativado
     */
    static isWelcomeEnabled(groupJid) {
        const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
        
        if (!existsSync(filePath)) {
            return false;
        }

        try {
            const stats = statSync(filePath);
            return stats.size > 0;
        } catch {
            return false;
        }
    }

    /**
     * Status do welcome
     */
    static getWelcomeStatus(groupJid) {
        const isEnabled = this.isWelcomeEnabled(groupJid);
        
        if (isEnabled) {
            const filePath = join(this.WELCOME_DIR, `${groupJid}.webp`);
            const stats = statSync(filePath);
            return `✅ Welcome ATIVADO\n\n📊 Tamanho: ${stats.size} bytes\n🎉 Figurinha será enviada`;
        } else {
            return `❌ Welcome DESATIVADO\n\n📝 Configure com:\n1. Responda a uma figurinha\n2. Digite: !setwelcome`;
        }
    }
}