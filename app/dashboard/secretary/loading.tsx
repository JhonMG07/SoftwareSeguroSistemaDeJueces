import { Skeleton } from "@/components/ui/skeleton";
import { NavbarSkeleton } from "@/components/navbar-skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function Loading() {
    return (
        <>
            <NavbarSkeleton />
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Header & Button Skeleton */}
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-9 w-64" /> {/* Title */}
                            <Skeleton className="h-5 w-48" /> {/* Subtitle */}
                        </div>
                        <Skeleton className="h-10 w-32" /> {/* Create Case Button */}
                    </div>

                    {/* Table Skeleton */}
                    <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                                    <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* 5 Rows of Skeletons */}
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="h-5 w-48" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-36 font-mono" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    );
}
