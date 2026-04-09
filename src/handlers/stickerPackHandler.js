// src/handlers/stickerPackHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker } from 'wa-sticker-formatter';
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

export class StickerPackHandler {
    
    static STICKERS_DIR = './stickers';
    static MAX_STICKERS_PER_REQUEST = 3;
    static DELAY_BETWEEN_STICKERS = 800; // ms
    
    /**
     * Inicializa a pasta de stickers
     */
    static async init() {
        try {
            if (!existsSync(this.STICKERS_DIR)) {
                mkdirSync(this.STICKERS_DIR, { recursive: true });
                console.log('📁 Pasta de stickers criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    /**
     * Lista todos os pacotes disponíveis
     */
    static async listPacks() {
        try {
            const packs = await readdir(this.STICKERS_DIR);
            const result = [];
            
            for (const pack of packs) {
                const packPath = join(this.STICKERS_DIR, pack);
                const stats = await readdir(packPath);
                const stickerFiles = stats.filter(f => f.endsWith('.webp'));
                
                result.push({
                    name: pack,
                    count: stickerFiles.length
                });
            }
            
            return result;
        } catch (error) {
            console.error('❌ Erro ao listar pacotes:', error);
            return [];
        }
    }
    
    /**
     * Salva uma figurinha
     */
    static async saveSticker(packName, stickerBuffer, message, sock) {
        try {
            // Validar pacote
            if (!packName || packName.trim() === '') {
                return { success: false, error: '❌ Nome do pacote inválido' };
            }
            
            // Limpar nome do pacote (apenas letras e números)
            packName = packName.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (packName.length < 3) {
                return { success: false, error: '❌ Nome do pacote deve ter pelo menos 3 caracteres' };
            }
            
            // Criar pasta do pacote
            const packDir = join(this.STICKERS_DIR, packName);
            if (!existsSync(packDir)) {
                mkdirSync(packDir, { recursive: true });
            }
            
            // Contar stickers existentes
            const existingFiles = readdirSync(packDir).filter(f => f.endsWith('.webp'));
            const nextId = existingFiles.length + 1;
            
            // Nome do arquivo
            const fileName = `${packName}_${String(nextId).padStart(3, '0')}.webp`;
            const filePath = join(packDir, fileName);
            
            // Salvar sticker
            await writeFile(filePath, stickerBuffer);
            
            console.log(`✅ Sticker salvo: ${fileName} (${(stickerBuffer.length / 1024).toFixed(2)}KB)`);
            
            return {
                success: true,
                fileName: fileName,
                packName: packName,
                total: nextId
            };
            
        } catch (error) {
            console.error('❌ Erro ao salvar sticker:', error);
            return { success: false, error: '❌ Erro ao salvar figurinha' };
        }
    }
    
    /**
     * Envia figurinhas de um pacote
     */
    static async sendStickers(sock, groupJid, packName, quantity, quotedMessage) {
        try {
            // Validar quantidade
            let qty = Math.min(quantity, this.MAX_STICKERS_PER_REQUEST);
            if (qty < 1) qty = 1;
            
            // Verificar se pacote existe
            const packDir = join(this.STICKERS_DIR, packName);
            if (!existsSync(packDir)) {
                return { success: false, error: `❌ Pacote "${packName}" não encontrado` };
            }
            
            // Listar stickers do pacote
            const files = readdirSync(packDir).filter(f => f.endsWith('.webp'));
            
            if (files.length === 0) {
                return { success: false, error: `❌ Pacote "${packName}" está vazio` };
            }
            
            // Embaralhar e pegar os primeiros 'qty'
            const shuffled = [...files].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, qty);
            
            // Enviar mensagem de início
            await sock.sendMessage(groupJid, {
                text: `🎲 Enviando ${selected.length} figurinha(s) do pacote "${packName}"...`
            }, { quoted: quotedMessage });
            
            // Enviar cada sticker com delay
            for (let i = 0; i < selected.length; i++) {
                const filePath = join(packDir, selected[i]);
                const stickerBuffer = await readFile(filePath);
                
                await sock.sendMessage(groupJid, {
                    sticker: stickerBuffer
                });
                
                // Delay entre stickers (evitar spam)
                if (i < selected.length - 1) {
                    await this.delay(this.DELAY_BETWEEN_STICKERS);
                }
            }
            
            return { success: true, count: selected.length, total: files.length };
            
        } catch (error) {
            console.error('❌ Erro ao enviar stickers:', error);
            return { success: false, error: '❌ Erro ao enviar figurinhas' };
        }
    }
    
    /**
     * Envia sticker aleatório de qualquer pacote
     */
    static async sendRandomSticker(sock, groupJid, quotedMessage) {
        try {
            // Listar todos os pacotes
            const packs = await this.listPacks();
            
            if (packs.length === 0) {
                return { success: false, error: '❌ Nenhum pacote disponível' };
            }
            
            // Filtrar pacotes com stickers
            const validPacks = [];
            for (const pack of packs) {
                const packDir = join(this.STICKERS_DIR, pack.name);
                const files = readdirSync(packDir).filter(f => f.endsWith('.webp'));
                if (files.length > 0) {
                    validPacks.push({ name: pack.name, files });
                }
            }
            
            if (validPacks.length === 0) {
                return { success: false, error: '❌ Nenhuma figurinha disponível' };
            }
            
            // Escolher pacote aleatório
            const randomPack = validPacks[Math.floor(Math.random() * validPacks.length)];
            const randomFile = randomPack.files[Math.floor(Math.random() * randomPack.files.length)];
            const filePath = join(this.STICKERS_DIR, randomPack.name, randomFile);
            
            const stickerBuffer = await readFile(filePath);
            
            await sock.sendMessage(groupJid, {
                sticker: stickerBuffer
            });
            
            return { success: true, pack: randomPack.name };
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return { success: false, error: '❌ Erro ao enviar figurinha' };
        }
    }
    
    /**
     * Remove uma figurinha
     */
    static async removeSticker(stickerId, message, sock) {
        try {
            // Formato: pacote_numero (ex: reacoes_001)
            const parts = stickerId.split('_');
            if (parts.length < 2) {
                return { success: false, error: '❌ ID inválido. Use: pack_001' };
            }
            
            const packName = parts.slice(0, -1).join('_');
            const fileName = `${stickerId}.webp`;
            const filePath = join(this.STICKERS_DIR, packName, fileName);
            
            if (!existsSync(filePath)) {
                return { success: false, error: '❌ Figurinha não encontrada' };
            }
            
            unlinkSync(filePath);
            
            return { success: true, packName: packName, stickerId: stickerId };
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return { success: false, error: '❌ Erro ao remover figurinha' };
        }
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
     * Delay helper
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Baixa sticker da mensagem
     */
    static async downloadSticker(message) {
        try {
            let stickerMsg = null;
            
            // Verificar se respondeu a uma figurinha
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
                stickerMsg = message.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
            }
            // Verificar se a mensagem é uma figurinha
            else if (message.message?.stickerMessage) {
                stickerMsg = message.message.stickerMessage;
            }
            
            if (!stickerMsg) {
                return null;
            }
            
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return null;
        }
    }
}