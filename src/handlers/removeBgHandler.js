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
            
            // Tentar remover fundo com as chaves disponíveis
            const cleanImageBuffer = await this.tryRemoveBackground(buffer);
            
            if (!cleanImageBuffer) {
                return {
                    success: false,
                    error: '❌ Todas as APIs estão sem limite ou offline.\n\n📊 Tente novamente amanhã ou use outra conta.'
                };
            }
            
            console.log(`✅ Fundo removido! Tamanho: ${(cleanImageBuffer.length / 1024).toFixed(2)}KB`);
            
            // Criar sticker com fundo removido
            const sticker = new Sticker(cleanImageBuffer, {
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
            let errorMsg = '❌ Erro ao remover fundo. Tente novamente.';
            
            if (error.code === 'ECONNABORTED') {
                errorMsg = '❌ Tempo esgotado. Tente novamente.';
            } else if (error.message?.includes('timeout')) {
                errorMsg = '❌ Demorou muito. Tente uma imagem menor.';
            }
            
            return {
                success: false,
                error: errorMsg
            };
        }
    }
    
    /**
     * Tenta remover fundo usando múltiplas chaves de API
     */
    static async tryRemoveBackground(imageBuffer) {
        // Se não tem chaves configuradas, erro
        if (!config.removeBgApiKeys || config.removeBgApiKeys.length === 0) {
            console.error('❌ Nenhuma chave de API configurada no config.js');
            return null;
        }
        
        let lastError = null;
        
        // Tentar cada chave de API
        for (let i = 0; i < config.removeBgApiKeys.length; i++) {
            const apiKey = config.removeBgApiKeys[i];
            
            // Pular chaves vazias
            if (!apiKey || apiKey.trim() === '') {
                console.log(`⚠️ Chave ${i + 1} está vazia, pulando...`);
                continue;
            }
            
            try {
                console.log(`🔄 Tentando API ${i + 1}/${config.removeBgApiKeys.length}...`);
                
                const formData = new FormData();
                formData.append('image_file', imageBuffer, {
                    filename: 'image.png',
                    contentType: 'image/png'
                });
                formData.append('size', 'auto');
                
                const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'X-Api-Key': apiKey
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                
                // Verificar se resposta é válida
                if (!response.data || response.data.length === 0) {
                    throw new Error('Resposta vazia da API');
                }
                
                // Verificar se resposta é HTML (erro)
                const firstBytes = response.data.slice(0, 10).toString();
                if (firstBytes.includes('<!DOCTYPE') || firstBytes.includes('<html')) {
                    console.log(`⚠️ API ${i + 1} retornou HTML (possivelmente erro)`);
                    continue;
                }
                
                console.log(`✅ API ${i + 1} funcionou!`);
                return Buffer.from(response.data);
                
            } catch (error) {
                console.log(`⚠️ API ${i + 1} falhou:`);
                
                if (error.response) {
                    const status = error.response.status;
                    console.log(`   Status: ${status}`);
                    
                    if (status === 402) {
                        console.log(`   Motivo: Limite mensal excedido`);
                    } else if (status === 401) {
                        console.log(`   Motivo: Chave inválida`);
                    } else if (status === 413) {
                        console.log(`   Motivo: Imagem muito grande`);
                    } else if (status === 429) {
                        console.log(`   Motivo: Muitas requisições`);
                    } else {
                        console.log(`   Motivo: Erro desconhecido`);
                    }
                } else if (error.code === 'ECONNABORTED') {
                    console.log(`   Motivo: Timeout`);
                } else {
                    console.log(`   Motivo: ${error.message}`);
                }
                
                lastError = error;
                
                // Se não for erro de limite (402), tenta próxima chave mesmo assim
                // Se for erro de imagem (413), para de tentar
                if (error.response?.status === 413) {
                    console.log(`📐 Imagem muito grande, não adianta tentar outras chaves`);
                    break;
                }
                
                // Continua para próxima chave
                continue;
            }
        }
        
        console.log(`❌ Todas as ${config.removeBgApiKeys.length} chaves falharam`);
        return null;
    }
}