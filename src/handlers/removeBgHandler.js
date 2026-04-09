// src/handlers/removeBgHandler.js
import axios from 'axios';
import { Sticker } from 'wa-sticker-formatter';
import FormData from 'form-data';
import { config } from '../../config.js';

export class RemoveBgHandler {
    
    static async removeBackground(message, sock) {
        try {
            console.log('🔄 Iniciando remoção de fundo...');

            // Verificar se respondeu a uma imagem
            let quotedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            let directImage = message.message?.imageMessage;
            
            const imageMsg = quotedImage || directImage;
            
            if (!imageMsg) {
                return {
                    success: false,
                    error: '❌ Responda a uma imagem ou envie uma imagem com !removebg\n\n📌 Exemplo: Envie uma foto e digite !removebg'
                };
            }
            
            // Avisar que está processando
            await sock.sendMessage(message.key.remoteJid, {
                text: '🔄 Removendo fundo da imagem...⏳'
            }, { quoted: message });
            
            // Baixar a imagem
            const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
            const stream = await downloadContentFromMessage(imageMsg, 'image');
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            console.log(`📥 Imagem baixada: ${(buffer.length / 1024).toFixed(2)}KB`);
            
            // Enviar para API oficial do Remove.bg
            const formData = new FormData();
            formData.append('image_file', buffer, {
                filename: 'image.png',
                contentType: 'image/png'
            });
            formData.append('size', 'auto');
            
            const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'X-Api-Key': config.removeBgApiKey
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            
            if (!response.data || response.data.length === 0) {
                return {
                    success: false,
                    error: '❌ Erro ao remover fundo. Tente outra imagem.'
                };
            }
            
            console.log(`✅ Fundo removido! Tamanho: ${(response.data.length / 1024).toFixed(2)}KB`);
            
            // Criar sticker com fundo removido
            const sticker = new Sticker(response.data, {
                pack: 'StickerBot',
                author: 'Remove.bg',
                type: 'full',
                quality: 80
            });
            
            const stickerBuffer = await sticker.toBuffer();
            
            // Enviar sticker
            await sock.sendMessage(message.key.remoteJid, {
                sticker: stickerBuffer
            }, { quoted: message });
            
            console.log('✅ Sticker sem fundo enviado!');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro detalhado:', error);
            
            // Mensagem de erro mais amigável
            let errorMsg = '❌ Erro ao remover fundo.';
            
            if (error.response?.status === 401) {
                errorMsg = '❌ Chave da API inválida ou expirada.';
            } else if (error.response?.status === 402) {
                errorMsg = '❌ Limite de remoções grátis excedido por hoje.';
            } else if (error.response?.status === 413) {
                errorMsg = '❌ Imagem muito grande. Tente uma imagem menor.';
            } else if (error.code === 'ECONNABORTED') {
                errorMsg = '❌ Tempo esgotado. Tente novamente.';
            }
            
            return {
                success: false,
                error: errorMsg
            };
        }
    }
}