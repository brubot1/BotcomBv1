import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { Sticker } from 'wa-sticker-formatter';

export class MediaUtils {
    static async validateMedia(buffer) {
        try {
            const type = await fileTypeFromBuffer(buffer);
            if (!type) throw new Error('Tipo de arquivo não reconhecido');
            return type;
        } catch (error) {
            throw new Error('Erro ao validar mídia');
        }
    }

    static async resizeImage(buffer, maxSize = 512) {
        try {
            return await sharp(buffer)
                .resize(maxSize, maxSize, {
                    fit: 'inside',
                    withoutEnlargement: true,
                    fastShrinkOnLoad: true
                })
                .jpeg({ 
                    quality: 70,
                    mozjpeg: true
                })
                .toBuffer();
        } catch (error) {
            console.log('⚠️ Usando imagem original');
            return buffer;
        }
    }

    static async createSticker(mediaBuffer, options = {}) {
        const {
            pack = 'StickerBot',
            author = 'Bot',
            categories = ['✨'],
            quality = 30,
            type = 'full'
        } = options;

        try {
            const sticker = new Sticker(mediaBuffer, {
                pack,
                author,
                categories,
                quality: Math.max(5, Math.min(quality, 50)), // Garante entre 5-50
                type,
                background: type === 'crop' ? '#000000' : 'transparent'
            });

            return await sticker.toBuffer();
        } catch (error) {
            console.error('❌ Erro ao criar sticker:', error);
            
            // Erros específicos do wa-sticker-formatter
            if (error.message.includes('ffmpeg') || error.message.includes('video')) {
                throw new Error('Codec de vídeo não suportado');
            } else if (error.message.includes('buffer')) {
                throw new Error('Arquivo de mídia corrompido');
            } else {
                throw new Error('Erro ao processar mídia para figurinha');
            }
        }
    }
}