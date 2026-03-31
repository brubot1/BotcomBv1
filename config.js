/**
 * Configuração do Sticker Bot
 * APENAS: Ban de gringos na entrada
 */

export const config = {
    sessionName: 'session',
    prefix: '!',
    ownerNumber: 'SEU_NUMERO',
    botName: 'StickerBot',
    
    // ========================================
    // 📊 LIMITES DE MÍDIA
    // ========================================
    maxVideoDuration: 10,
    maxVideoSize: 8 * 1024 * 1024,
    maxImageSize: 5 * 1024 * 1024,
    
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
    connectionMethods: ['qr', 'code'],

    // ========================================
    // 🔨 BAN DE GRINGOS NA ENTRADA
    // ========================================
    protection: {
        
        // 🔨 BAN AUTOMÁTICO NA ENTRADA
        antigringo: {
            enabled: true,                    // ATIVAR BAN
            countryCode: '55',               // Apenas Brasil
            validateDDD: false,              // Não validar DDD específico
            allowedDDD: [],                  // Qualquer DDD brasileiro
            whitelist: [],                   // Nenhuma exceção
            customMessage: null
        },

        // 🔗 ANTILINK DESATIVADO
        antilink: {
            enabled: false,                  // DESATIVADO
            whitelistDomains: [],
            blockShorteners: true,
            blockInstagram: false,
            blockTelegram: false,
            blockWhatsApp: false,
            customMessage: null
        },

        // 📋 EXCEÇÕES (Ninguém em exceção, nem admin)
        exceptions: [],

        // 🔨 AÇÕES DO BAN
        actions: {
            sendMessage: false,              // Não enviar msg de bloqueio
            deleteMessage: false,            // Não deletar msg
            logBlock: true,                  // Apenas logar
            
            banMessage: true,                // Notificar quando bane
            banLog: true                     // Logar bans
        }
    },

    // ========================================
    // 🎉 WELCOME (Sistema de Boas-vindas)
    // ========================================
    welcome: {
        enabled: false,
        groups: {}
    }
};
