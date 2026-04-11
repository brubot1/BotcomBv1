// src/handlers/menuHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export class MenuHandler {
    
    static MENU_DIR = './menu';
    
    /**
     * Inicializa a pasta do menu
     */
    static async init() {
        try {
            if (!existsSync(this.MENU_DIR)) {
                mkdirSync(this.MENU_DIR, { recursive: true });
                console.log('📁 Pasta do menu criada');
            }
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    }
    
    /**
     * Salva imagem do menu para um grupo específico
     */
    static async saveMenuImage(groupJid, imageBuffer) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
            const filePath = join(this.MENU_DIR, fileName);
            
            await writeFile(filePath, imageBuffer);
            
            console.log(`✅ Imagem do menu salva para ${groupJid}`);
            return { success: true, filePath };
            
        } catch (error) {
            console.error('❌ Erro ao salvar imagem do menu:', error);
            return { success: false, error: 'Erro ao salvar imagem' };
        }
    }
    
    /**
     * Remove imagem do menu de um grupo
     */
    static async deleteMenuImage(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
            const filePath = join(this.MENU_DIR, fileName);
            
            if (existsSync(filePath)) {
                await unlink(filePath);
                console.log(`✅ Imagem do menu removida para ${groupJid}`);
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro ao remover imagem:', error);
            return { success: false, error: 'Erro ao remover imagem' };
        }
    }
    
    /**
     * Pega imagem do menu de um grupo
     */
    static async getMenuImage(groupJid) {
        try {
            const fileName = `${groupJid.replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
            const filePath = join(this.MENU_DIR, fileName);
            
            if (existsSync(filePath)) {
                const buffer = await readFile(filePath);
                return buffer;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erro ao ler imagem:', error);
            return null;
        }
    }
    
    /**
     * Gera o texto do menu
     */
    static getMenuText() {
        return `
╭━━━━━━━━━━━━━━━━━━━━╮
┃     🤖 STICKER BOT    
┃     Menu Principal    
╰━━━━━━━━━━━━━━━━━━━━╯

┌─── 🎨 FIGURINHAS ───┐
│ !fig     → Criar sticker
│ !s       → Atalho rápido
│ !toimg   → Sticker → Imagem
│ !removebg→ Remover fundo
│ !scircle → Sticker redondo
└─────────────────────┘

┌─── 📦 PACOTES ────┐
│ !pack [nome]  → Pegar sticker
│ !packs        → Listar pacotes
│ !sticker      → Sticker aleatório
└──────────────────┘

┌─── 🎉 WELCOME ───┐
│ !setwelcome      → Configurar
│ !disablewelcome  → Desativar
│ !welcomestatus   → Status
└──────────────────┘

┌─── 🔨 BAN ────┐
│ !enableban   → Ativar
│ !disableban  → Desativar
│ !banstatus   → Status
└───────────────┘

┌─── 📌 MENU ───┐
│ !menu         → Este menu
│ !setmenu      → Definir imagem (admin)
│ !delmenu      → Remover imagem (admin)
└────────────────┘

✨ Envie !help para mais detalhes
        `;
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
     * Baixa imagem da mensagem
     */
    static async downloadImage(message) {
        try {
            let imageMsg = null;
            
            // Verificar se respondeu a uma imagem
            if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                imageMsg = message.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }
            // Verificar se a mensagem é uma imagem
            else if (message.message?.imageMessage) {
                imageMsg = message.message.imageMessage;
            }
            
            if (!imageMsg) {
                return null;
            }
            
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro ao baixar imagem:', error);
            return null;
        }
    }
}