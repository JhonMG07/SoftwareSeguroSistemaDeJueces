import { Skeleton } from "@/components/ui/skeleton";
import { NavbarSkeleton } from "@/components/navbar-skeleton";

export default function Loading() {
    return (
        <>
            <NavbarSkeleton />
            <div className="min-h-screen p-8 bg-background">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header Skeleton */}
                    <div className="h-9 w-64">
                        <Skeleton className="h-full w-full" />
                    </div>

                    {/* List Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" /> {/* "Total de casos" */}

                        {/* Generate 3 skeleton cards */}
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="border rounded-lg p-6 bg-card space-y-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-48" /> {/* Case Number */}
                                        <Skeleton className="h-4 w-64" /> {/* Title */}
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-24 rounded-full" /> {/* Role Badge */}
                                        <Skeleton className="h-6 w-20 rounded-full" /> {/* Status Badge */}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
                                    <Skeleton className="h-4 w-2/3" /> {/* Description line 2 */}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-12" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex gap-2">
                                    <Skeleton className="h-10 w-28 rounded-md" /> {/* Button 1 */}
                                    <Skeleton className="h-10 w-28 rounded-md" /> {/* Button 2 */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
