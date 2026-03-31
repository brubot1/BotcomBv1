//atualizador porcdeedsek
import { StickerHandler } from '../src/handlers/stickerHandler.js';

export async function stickerPlugin(sock, message) {
    try {
        console.log('🔄 Iniciando processo de sticker...');

        const result = await StickerHandler.createStickerFromMessage(message, sock);
        
        if (!result.success) {
            await sock.sendMessage(message.key.remoteJid, {
                text: result.error
            }, { quoted: message });
            return;
        }

        console.log('📤 Enviando sticker...');
        
        await sock.sendMessage(message.key.remoteJid, {
            sticker: result.buffer
        }, { quoted: message });

        console.log('✅ Sticker enviado com sucesso!');

    } catch (error) {
        console.error('💥 Erro fatal no sticker plugin:', error);
        
        await sock.sendMessage(message.key.remoteJid, {
            text: '❌ Erro interno. Tente novamente.'
        }, { quoted: message });
    }
}

export const stickerCommands = {
    name: 'sticker',
    description: 'Cria stickers de imagens, vídeos e visualização única',
    usage: 'Envie imagem/vídeo com !fig OU marque uma mídia com !fig\n✅ Agora suporta visualização única!',
    aliases: ['fig', 's']
};