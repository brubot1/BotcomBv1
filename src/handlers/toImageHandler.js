// src/handlers/toImageHandler.js
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export class ToImageHandler {
    
    /**
     * Converte sticker para imagem
     */
    static async convertStickerToImage(message, sock) {
        try {
            console.log('🔄 Iniciando conversão sticker → imagem...');

            // Verificar se é mensagem marcada (respondendo a figurinha)
            let stickerMessage = null;
            let isQuoted = false;

            if (message.message?.extendedTextMessage?.contextInfo) {
                const contextInfo = message.message.extendedTextMessage.contextInfo;
                if (contextInfo.quotedMessage?.stickerMessage) {
                    stickerMessage = contextInfo.quotedMessage.stickerMessage;
                    isQuoted = true;
                    console.log('📌 Figurinha marcada detectada');
                }
            }

            // Verificar se a mensagem atual é figurinha
            if (!stickerMessage && message.message?.stickerMessage) {
                stickerMessage = message.message.stickerMessage;
                console.log('📌 Figurinha direta detectada');
            }

            if (!stickerMessage) {
                return {
                    success: false,
                    error: '❌ Responda a uma figurinha ou envie uma figurinha com o comando !toimg'
                };
            }

            console.log('📥 Baixando figurinha...');

            // Baixar o sticker
            const stickerBuffer = await this.downloadSticker(stickerMessage);
            
            if (!stickerBuffer || stickerBuffer.length === 0) {
                return {
                    success: false,
                    error: '❌ Erro ao baixar a figurinha'
                };
            }

            console.log(`✅ Download concluído: ${(stickerBuffer.length / 1024).toFixed(2)}KB`);

            // Converter sticker para imagem
            const imageBuffer = await this.convertStickerToImageBuffer(stickerBuffer);

            if (!imageBuffer) {
                return {
                    success: false,
                    error: '❌ Erro ao converter figurinha para imagem'
                };
            }

            console.log(`✅ Conversão concluída: ${(imageBuffer.length / 1024).toFixed(2)}KB`);

            // Enviar a imagem
            await sock.sendMessage(message.key.remoteJid, {
                image: imageBuffer,
                caption: '🖼️ *Figurinha convertida para imagem*\n\n📏 Tamanho original preservado'
            }, { quoted: message });

            console.log('✅ Imagem enviada com sucesso!');
            
            return { success: true };

        } catch (error) {
            console.error('❌ Erro ao converter sticker:', error);
            return {
                success: false,
                error: '❌ Erro ao processar a figurinha. Verifique se é uma figurina válida.'
            };
        }
    }

    /**
     * Baixa o sticker do WhatsApp
     */
    static async downloadSticker(stickerMessage) {
        try {
            const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
            const chunks = [];
            
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            
            return Buffer.concat(chunks);
            
        } catch (error) {
            console.error('❌ Erro no download:', error);
            throw error;
        }
    }

    /**
     * Converte sticker WebP para PNG/JPEG
     */
    static async convertStickerToImageBuffer(stickerBuffer) {
        let tempInput = null;
        let tempOutput = null;
        
        try {
            const timestamp = Date.now();
            tempInput = path.join('./temp', `sticker_${timestamp}.webp`);
            tempOutput = path.join('./temp', `output_${timestamp}.png`);
            
            // Garantir que pasta temp existe
            const { mkdir } = await import('fs/promises');
            await mkdir('./temp', { recursive: true });
            
            // Salvar sticker temporariamente
            await writeFile(tempInput, stickerBuffer);
            
            // Converter WebP para PNG usando Sharp
            await sharp(tempInput)
                .png({
                    quality: 100,
                    compressionLevel: 6
                })
                .toFile(tempOutput);
            
            // Ler o arquivo convertido
            const { readFile } = await import('fs/promises');
            const imageBuffer = await readFile(tempOutput);
            
            // Obter dimensões da imagem original
            const metadata = await sharp(tempInput).metadata();
            console.log(`📐 Dimensões originais: ${metadata.width}x${metadata.height}`);
            
            // Se a imagem for muito pequena (sticker geralmente é 512x512), 
            // podemos manter o tamanho original ou redimensionar
            // Por padrão, mantemos o tamanho original do sticker
            
            return imageBuffer;
            
        } catch (error) {
            console.error('❌ Erro na conversão:', error);
            
            // Tentar método alternativo: converter para JPEG
            try {
                console.log('🔄 Tentando converter para JPEG...');
                const timestamp = Date.now();
                tempInput = path.join('./temp', `sticker_${timestamp}.webp`);
                tempOutput = path.join('./temp', `output_${timestamp}.jpg`);
                
                await writeFile(tempInput, stickerBuffer);
                
                await sharp(tempInput)
                    .jpeg({
                        quality: 90,
                        progressive: true
                    })
                    .toFile(tempOutput);
                
                const { readFile } = await import('fs/promises');
                return await readFile(tempOutput);
                
            } catch (fallbackError) {
                console.error('❌ Método alternativo falhou:', fallbackError);
                throw error;
            }
            
        } finally {
            // Limpar arquivos temporários
            await this.cleanTempFile(tempInput);
            await this.cleanTempFile(tempOutput);
        }
    }

    /**
     * Limpa arquivos temporários
     */
    static async cleanTempFile(filePath) {
        try {
            if (filePath) {
                await unlink(filePath);
            }
        } catch (error) {
            // Ignora erros de arquivo não encontrado
        }
    }
}