export function getServerInstanceId(): string {
    // En desarrollo, queremos que este ID cambie cada vez que el proceso de Node reinicia.
    // Usamos globalThis para mantenerlo durante HMR (Hot Module Replacement) si fuera deseado, 
    // pero para el objetivo del usuario (detectar reinicio de npm run dev), 
    // basta con generar uno nuevo si no existe.

    // Nota: En Next.js dev, los archivos se re-ejecutan a veces, pero global debe persistir mientras el proceso viva.

    const globalWithId = global as typeof globalThis & {
        _serverInstanceId?: string;
    };

    if (!globalWithId._serverInstanceId) {
        globalWithId._serverInstanceId = `server-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        console.log('[Server] New Instance ID generated:', globalWithId._serverInstanceId);
    }

    return globalWithId._serverInstanceId;
}
