//ATUALIZADOpor deedpseek
import { downloadContentFromMessage, proto } from '@whiskeysockets/baileys';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';

export class StickerHandler {
    static async createStickerFromMessage(message, sock) {
        try {
            console.log('🔄 Processando sticker...');

            // ✅ AGORA SUPORTA VISUALIZAÇÃO ÚNICA
            let mediaMessage = message;
            let isViewOnce = false;

            // Verificar se é mensagem marcada (quoted)
            if (message.message?.extendedTextMessage?.contextInfo) {
                console.log('📌 Mensagem marcada detectada');
                const contextInfo = message.message.extendedTextMessage.contextInfo;
                mediaMessage = {
                    ...message,
                    message: contextInfo.quotedMessage
                };
                
                // Verificar se é visualização única marcada
                isViewOnce = contextInfo.quotedMessage?.viewOnceMessageV2 ||
                           contextInfo.quotedMessage?.viewOnceMessageV2Extension;
            }

            // Verificar se é visualização única direta
            if (!isViewOnce) {
                isViewOnce = mediaMessage.message?.viewOnceMessageV2 ||
                           mediaMessage.message?.viewOnceMessageV2Extension;
            }

            // ✅ EXTRAIR MÍDIA DE VISUALIZAÇÃO ÚNICA
            let actualMediaMessage = mediaMessage;
            if (isViewOnce) {
                console.log('👁️ Visualização única detectada');
                // Extrair a mídia real de dentro da mensagem de visualização única
                actualMediaMessage = {
                    ...mediaMessage,
                    message: mediaMessage.message?.viewOnceMessageV2?.message ||
                            mediaMessage.message?.viewOnceMessageV2Extension?.message
                };
            }

            // Verificar se tem mídia (agora incluindo visualização única)
            const isImage = actualMediaMessage.message?.imageMessage ||
                          actualMediaMessage.message?.viewOnceMessageV2?.message?.imageMessage;
            
            const isVideo = actualMediaMessage.message?.videoMessage ||
                          actualMediaMessage.message?.viewOnceMessageV2?.message?.videoMessage;

            if (!isImage && !isVideo) {
                return {
                    success: false,
                    error: '❌ Nenhuma mídia encontrada. Envie uma imagem/vídeo ou marque uma mídia existente.'
                };
            }

            console.log(isVideo ? '🎥 Vídeo detectado' + (isViewOnce ? ' (visualização única)' : '') : 
                         '🖼️ Imagem detectada' + (isViewOnce ? ' (visualização única)' : ''));
            
            console.log('📥 Baixando mídia...');

            // ✅ DOWNLOAD SUPORTANDO VISUALIZAÇÃO ÚNICA
            const mediaBuffer = await this.downloadMedia(actualMediaMessage, isVideo ? 'video' : 'image', isViewOnce);
            
            if (!mediaBuffer) {
                return {
                    success: false,
                    error: '❌ Erro ao baixar mídia. Tente enviar novamente.'
                };
            }

            console.log(`✅ Download concluído: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)}MB`);

            // Criar sticker
            let stickerBuffer;
            if (isVideo) {
                stickerBuffer = await this.createVideoSticker(mediaBuffer);
            } else {
                stickerBuffer = await this.createImageSticker(mediaBuffer);
            }

            if (!stickerBuffer) {
                return {
                    success: false,
                    error: '❌ Erro ao criar figurinha'
                };
            }

            console.log('✅ Figurinha criada com sucesso!' + (isViewOnce ? ' (de visualização única)' : ''));
            return { success: true, buffer: stickerBuffer };

        } catch (error) {
            console.error('💥 Erro no StickerHandler:', error);
            await this.cleanTempFiles();
            
            if (error.message.includes('view once') || error.message.includes('view_once')) {
                return {
                    success: false,
                    error: '❌ Não foi possível processar visualização única. O WhatsApp pode ter bloqueado o acesso.'
                };
            }
            
            return {
                success: false,
                error: '❌ Erro ao processar mídia'
            };
        }
    }

    // ✅ MÉTODO ATUALIZADO: Suporte a visualização única
    static async downloadMedia(message, type, isViewOnce = false) {
        try {
            console.log(isViewOnce ? '🔓 Processando visualização única...' : '📥 Baixando mídia normal...');
            
            let media;
            
            if (isViewOnce) {
                // Para visualização única, a mídia está em viewOnceMessageV2.message
                media = message.message?.viewOnceMessageV2?.message?.[`${type}Message`] ||
                       message.message?.[`${type}Message`];
            } else {
                // Para mídia normal
                media = message.message?.[`${type}Message`];
            }

            if (!media) {
                throw new Error('Mídia não encontrada');
            }

            // Método mais confiável para download
            const stream = await downloadContentFromMessage(media, type);
            
            const bufferChunks = [];
            for await (const chunk of stream) {
                bufferChunks.push(chunk);
            }
            
            const buffer = Buffer.concat(bufferChunks);
            
            if (buffer.length === 0) {
                throw new Error('Mídia vazia');
            }
            
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro no download:', error);
            
            // Tentar método alternativo
            try {
                console.log('🔄 Tentando método alternativo...');
                const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                
                // Para visualização única, precisamos ajustar a mensagem
                let downloadMessage = message;
                if (isViewOnce) {
                    downloadMessage = {
                        ...message,
                        message: message.message?.viewOnceMessageV2?.message || message.message
                    };
                }
                
                return await downloadMediaMessage(
                    downloadMessage,
                    'buffer',
                    {},
                    { reuploadRequest: async () => {} }
                );
            } catch (fallbackError) {
                console.error('❌ Método alternativo também falhou:', fallbackError);
                
                if (isViewOnce) {
                    throw new Error('Não foi possível acessar mídia de visualização única');
                } else {
                    throw new Error('Não foi possível baixar a mídia');
                }
            }
        }
    }

    static async createImageSticker(imageBuffer) {
        try {
            console.log('🎨 Criando sticker de imagem...');
            
            // Forçar 512x512 distorcendo a imagem
            const processedImage = await sharp(imageBuffer)
                .resize(512, 512, {
                    fit: 'fill', // Distorce para caber no quadrado
                    withoutEnlargement: false
                })
                .png()
                .toBuffer();

            const sticker = new Sticker(processedImage, {
                pack: 'link do grupo ',
                author: 'inst:@sticker of kings',
                type: StickerTypes.FULL,
                quality: 80,
                background: 'transparent'
            });

            return await sticker.toBuffer();
            
        } catch (error) {
            console.error('❌ Erro ao criar sticker de imagem:', error);
            throw error;
        }
    }

    static async createVideoSticker(videoBuffer) {
        let tempInput, tempOutput;
        
        try {
            console.log('🎬 Criando sticker de vídeo...');
            
            const timestamp = Date.now();
            tempInput = `./temp_video_${timestamp}.mp4`;
            tempOutput = `./temp_sticker_${timestamp}.webp`;
            
            await writeFile(tempInput, videoBuffer);

            await new Promise((resolve, reject) => {
                ffmpeg(tempInput)
                    .inputOptions(['-loglevel error', '-y'])
                    .outputOptions([
                        '-vcodec libwebp',
                        '-vf scale=512:512:flags=lanczos',
                        '-loop 0',
                        '-r 10',
                        '-preset default',
                        '-an',
                        '-quality 60',
                        '-compression_level 4',
                        '-f webp'
                    ])
                    .on('end', resolve)
                    .on('error', reject)
                    .save(tempOutput);
            });

            const stickerBuffer = await readFile(tempOutput);
            return stickerBuffer;
            
        } catch (error) {
            console.error('❌ Erro ao criar sticker de vídeo:', error);
            throw error;
        } finally {
            await this.safeUnlink(tempInput);
            await this.safeUnlink(tempOutput);
        }
    }

    static async safeUnlink(filePath) {
        try {
            if (filePath) await unlink(filePath);
        } catch (error) {
            // Ignora erros
        }
    }

    static async cleanTempFiles() {
        try {
            const files = await readdir('.');
            const tempFiles = files.filter(file => 
                file.startsWith('temp_') && 
                (file.endsWith('.mp4') || file.endsWith('.webp'))
            );
            
            for (const file of tempFiles) {
                await this.safeUnlink(file);
            }
        } catch (error) {
            // Ignora erros
        }
    }
}