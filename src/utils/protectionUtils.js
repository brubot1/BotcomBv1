/**
 * Utilitários de Proteção - VERSÃO SIMPLES
 * Apenas para suport ao BAN de gringos na entrada
 * Sem AntiLink
 */

export class ProtectionUtils {
    
    /**
     * Extrai o número
     */
    static extractNumber(message, isGroup = false) {
        let jidToExtract;
        
        if (isGroup) {
            jidToExtract = message.key.participant;
        } else {
            jidToExtract = message.key.remoteJid;
        }

        if (!jidToExtract) {
            return null;
        }

        let number = jidToExtract.replace(/\D/g, '');

        console.log(`📱 Número: ${number}`);

        if (number.length >= 10) {
            return number;
        }

        return null;
    }

    /**
     * Verifica se é grupo
     */
    static isGroup(remoteJid) {
        return remoteJid.includes('@g.us');
    }

    /**
     * Verifica se é gringo
     */
    static isForeignNumber(number, allowedCountryCode = '55') {
        if (!number || number.length < 10) {
            return false;
        }

        const isForeign = !number.startsWith(allowedCountryCode);
        console.log(`🌍 Começa com ${allowedCountryCode}? ${!isForeign}`);
        
        return isForeign;
    }

    /**
     * Verifica exceção
     */
    static isException(number, exceptions = []) {
        if (!exceptions || exceptions.length === 0 || !number) {
            return false;
        }
        
        for (const exc of exceptions) {
            let cleanExc = exc.toString().trim().replace(/\D/g, '');
            
            if (number === cleanExc) {
                console.log(`✅ Em exceção`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * Verifica owner
     */
    static isOwner(number, ownerNumber) {
        if (!number) return false;

        let cleanOwner = ownerNumber.toString().trim().replace(/\D/g, '');
        const isOwner = number === cleanOwner;
        
        return isOwner;
    }

    /**
     * Mensagem
     */
    static getBlockMessage(reason) {
        return '⛔ BLOQUEADO';
    }

    /**
     * Log
     */
    static logBlock(type, senderNumber, reason) {
        console.log(`\n🚫 ${type} | ${senderNumber}`);
    }
}