import crypto from 'crypto'

/**
 * Encryption service for sensitive user data
 * Uses AES-256-GCM for strong encryption
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH

function getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY

    if (!key) {
        throw new Error('ENCRYPTION_KEY not found in environment variables')
    }

    // Ensure key is 32 bytes (256 bits)
    return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypt a string value
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: salt:iv:tag:encrypted
 */
export function encrypt(text: string): string {
    if (!text) return text

    try {
        const key = getKey()
        const iv = crypto.randomBytes(IV_LENGTH)
        const salt = crypto.randomBytes(SALT_LENGTH)

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final()
        ])

        const tag = cipher.getAuthTag()

        // Combine: salt + iv + tag + encrypted
        const result = Buffer.concat([salt, iv, tag, encrypted])

        return result.toString('base64')
    } catch (error) {
        console.error('Encryption error:', error)
        throw new Error('Failed to encrypt data')
    }
}

/**
 * Decrypt an encrypted string
 * @param encryptedText - Encrypted text in format: salt:iv:tag:encrypted
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText

    try {
        const key = getKey()
        const buffer = Buffer.from(encryptedText, 'base64')

        // Extract components
        const salt = buffer.subarray(0, SALT_LENGTH)
        const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION)
        const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION)
        const encrypted = buffer.subarray(ENCRYPTED_POSITION)

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
        decipher.setAuthTag(tag)

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ])

        return decrypted.toString('utf8')
    } catch (error) {
        console.error('Decryption error:', error)
        // If decryption fails, might be unencrypted data (backwards compatibility)
        // Return as-is but log warning
        console.warn('Failed to decrypt, returning original value')
        return encryptedText
    }
}

/**
 * Check if a string appears to be encrypted
 * @param text - Text to check
 * @returns true if text appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
    if (!text) return false

    try {
        // Base64 check and minimum length check
        const buffer = Buffer.from(text, 'base64')
        return buffer.length >= ENCRYPTED_POSITION && /^[A-Za-z0-9+/=]+$/.test(text)
    } catch {
        return false
    }
}
