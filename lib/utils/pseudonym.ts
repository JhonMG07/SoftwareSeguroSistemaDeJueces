/**
 * Utility functions for generating stable user pseudonyms
 * Used to display anonymous user identifiers in the UI
 */

/**
 * Generate a stable pseudonym for a user based on their ID and role
 * @param userId - User's UUID
 * @param role - User's role (judge, secretary, auditor, etc)
 * @returns Stable pseudonym like "Juez-F25F1E7D"
 */
export function getUserPseudonym(userId: string, role: string): string {
    const roleMap: Record<string, string> = {
        judge: 'Juez',
        secretary: 'Secretario',
        auditor: 'Auditor',
        super_admin: 'Admin'
    }

    const prefix = roleMap[role] || 'Usuario'
    const shortId = userId.replace(/-/g, '').substring(0, 8).toUpperCase()

    return `${prefix}-${shortId}`
}

/**
 * Get initials from a pseudonym for avatar display
 * @param pseudonym - User pseudonym like "Juez-F25F1E7D"
 * @returns Two-letter initials like "JU"
 */
export function getPseudonymInitials(pseudonym: string): string {
    const parts = pseudonym.split('-')
    if (parts.length >= 1) {
        // Take first two letters of the prefix
        return parts[0].substring(0, 2).toUpperCase()
    }
    return 'US'
}

/**
 * Generate a color for avatar based on user ID (deterministic)
 * @param userId - User's UUID
 * @returns HSL color string
 */
export function getUserColor(userId: string): string {
    // Use first part of UUID to generate consistent hue
    const hash = userId.split('-')[0]
    const hue = parseInt(hash.substring(0, 2), 16) % 360

    return `hsl(${hue}, 65%, 50%)`
}
