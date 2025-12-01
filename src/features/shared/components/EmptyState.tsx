import { LucideIcon } from "lucide-react";
import { Button } from "@/features/shared/ui/button";
import { Card, CardContent } from "@/features/shared/ui/card";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                    <Icon className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6">
                    {description}
                </p>
                {actionLabel && onAction && (
                    <Button onClick={onAction} size="lg">
                        {actionLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
