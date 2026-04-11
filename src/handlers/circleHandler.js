// src/handlers/circleHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker } from 'wa-sticker-formatter';
import sharp from 'sharp';

export class CircleHandler {
    
    /**
     * Cria sticker redondo a partir de uma imagem ou sticker
     */
    static async createCircleSticker(message, sock) {
        try {
            console.log('🔄 Criando sticker redondo...');
            
            // Verificar se respondeu a uma imagem ou sticker
            let quotedImage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            let quotedSticker = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
            let directImage = message.message?.imageMessage;
            let directSticker = message.message?.stickerMessage;
            
            const imageMsg = quotedImage || directImage;
            const stickerMsg = quotedSticker || directSticker;
            
            let buffer = null;
            
            // Baixar imagem ou sticker
            if (imageMsg) {
                const stream = await downloadContentFromMessage(imageMsg, 'image');
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
                console.log('📥 Imagem baixada');
                
            } else if (stickerMsg) {
                const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
                let chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                buffer = Buffer.concat(chunks);
                console.log('📥 Sticker baixado');
                
            } else {
                return {
                    success: false,
                    error: '❌ Responda a uma IMAGEM ou FIGURINHA com !scircle'
                };
            }
            
            // Criar máscara circular usando SVG (nativo, sem canvas)
            const size = 512;
            
            // SVG para máscara circular
            const svgMask = `
                <svg width="${size}" height="${size}">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
                </svg>
            `;
            
            // Aplicar máscara circular com sharp
            const circleBuffer = await sharp(buffer)
                .resize(size, size, {
                    fit: 'cover',
                    position: 'centre'
                })
                .composite([{
                    input: Buffer.from(svgMask),
                    blend: 'dest-in'
                }])
                .png()
                .toBuffer();
            
            // Criar sticker
            const sticker = new Sticker(circleBuffer, {
                pack: 'StickerBot',
                author: 'Circle Sticker',
                type: 'full',
                quality: 90
            });
            
            const stickerBuffer = await sticker.toBuffer();
            
            await sock.sendMessage(message.key.remoteJid, {
                sticker: stickerBuffer
            }, { quoted: message });
            
            console.log('✅ Sticker redondo enviado!');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erro:', error);
            return {
                success: false,
                error: '❌ Erro ao criar sticker redondo. Tente outra imagem.'
            };
        }
    }
}