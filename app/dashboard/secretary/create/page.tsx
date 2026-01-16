import { AppNavbar } from '@/components/app-navbar';
import { CreateCaseForm } from '@/components/secretary/create-case-form';
import Link from 'next/link';

export default function CreateCasePage() {
    return (
        <>
            <AppNavbar />
            <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-lg mb-4">
                    <Link href="/dashboard/secretary" className="text-sm text-muted-foreground hover:underline">
                        ← Volver al Panel
                    </Link>
                </div>
                <CreateCaseForm />
            </div>
        </>
    );
}
