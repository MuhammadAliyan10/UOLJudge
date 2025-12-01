"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/features/shared/ui/card";
import { Button } from "@/features/shared/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/features/shared/ui/form";
import { Input } from "@/features/shared/ui/input";
import { Textarea } from "@/features/shared/ui/textarea";
import { Switch } from "@/features/shared/ui/switch";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/features/shared/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/features/shared/ui/alert-dialog";
import { Bell, Gauge, Database, Loader2, LayoutDashboard, Settings, ShieldAlert, Server, Cpu, WifiOff, Users, Trophy, FileCode, HardDrive, ShieldCheck, Activity } from "lucide-react";
import { updateSystemSetting, purgeSystemLogs } from "@/features/admin/server-actions/admin-settings";
import { Separator } from "@/features/shared/ui/separator";
import { Badge } from "@/features/shared/ui/badge";

const generalSchema = z.object({
    announcement: z.string().optional(),
    maintenanceMode: z.boolean(),
});

const thresholdSchema = z.object({
    ramThreshold: z.string().regex(/^\d+$/, "Must be a valid number"),
    cpuThreshold: z.string().regex(/^\d+$/, "Must be a valid number between 0-100"),
});

interface SettingsClientProps {
    initialSettings: Record<string, string>;
    counts: {
        userCount: number;
        teamCount: number;
        contestCount: number;
        problemCount: number;
        submissionCount: number;
        logCount: number;
    };
}

export function SettingsClient({ initialSettings, counts }: SettingsClientProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [purgeLoading, setPurgeLoading] = useState(false);

    const stats = [
        {
            label: "Total Users",
            value: counts.userCount,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Registered Teams",
            value: counts.teamCount,
            icon: ShieldCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "Contests Created",
            value: counts.contestCount,
            icon: Trophy,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            label: "Problem Bank",
            value: counts.problemCount,
            icon: FileCode,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            label: "Total Submissions",
            value: counts.submissionCount,
            icon: HardDrive,
            color: "text-rose-600",
            bg: "bg-rose-50",
        },
        {
            label: "Audit Logs",
            value: counts.logCount,
            icon: Activity,
            color: "text-slate-600",
            bg: "bg-slate-50",
        },
    ];

    // General form
    const generalForm = useForm<z.infer<typeof generalSchema>>({
        resolver: zodResolver(generalSchema),
        defaultValues: {
            announcement: initialSettings.GLOBAL_ANNOUNCEMENT || "",
            maintenanceMode: initialSettings.MAINTENANCE_MODE === "true",
        },
    });

    // Threshold form
    const thresholdForm = useForm<z.infer<typeof thresholdSchema>>({
        resolver: zodResolver(thresholdSchema),
        defaultValues: {
            ramThreshold: initialSettings.RAM_WARNING_THRESHOLD || "12",
            cpuThreshold: initialSettings.CPU_WARNING_THRESHOLD || "80",
        },
    });

    async function onGeneralSubmit(values: z.infer<typeof generalSchema>) {
        setIsLoading(true);
        try {
            await updateSystemSetting("GLOBAL_ANNOUNCEMENT", values.announcement || "");
            await updateSystemSetting("MAINTENANCE_MODE", values.maintenanceMode.toString());
            toast.success("General settings updated successfully");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setIsLoading(false);
        }
    }

    async function onThresholdSubmit(values: z.infer<typeof thresholdSchema>) {
        setIsLoading(true);
        try {
            await updateSystemSetting("RAM_WARNING_THRESHOLD", values.ramThreshold);
            await updateSystemSetting("CPU_WARNING_THRESHOLD", values.cpuThreshold);
            toast.success("Threshold settings updated successfully");
        } catch (error) {
            toast.error("Failed to update thresholds");
        } finally {
            setIsLoading(false);
        }
    }

    async function handlePurgeLogs() {
        setPurgeLoading(true);
        try {
            const result = await purgeSystemLogs();
            toast.success(result.message);
        } catch (error) {
            toast.error("Failed to purge logs");
        } finally {
            setPurgeLoading(false);
        }
    }

    return (
        <Tabs defaultValue="overview" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                <TabsTrigger value="overview">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Overview
                </TabsTrigger>
                <TabsTrigger value="general">
                    <Settings className="h-4 w-4 mr-2" />
                    General
                </TabsTrigger>
                <TabsTrigger value="system">
                    <Gauge className="h-4 w-4 mr-2" />
                    System
                </TabsTrigger>
                <TabsTrigger value="danger">
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Danger Zone
                </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card
                                key={stat.label}
                                className="border shadow-sm hover:shadow-md transition-shadow"
                            >
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {stat.label}
                                        </p>
                                        <p className="text-2xl font-bold text-foreground mt-1">
                                            {stat.value.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                        <Icon size={24} />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Platform Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Server size={20} className="text-muted-foreground" />
                                Environment Details
                            </CardTitle>
                            <CardDescription>
                                Current runtime configuration and versioning.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Platform Name</span>
                                <span className="font-mono font-medium text-foreground">
                                    UOLJudge
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Version</span>
                                <Badge variant="outline">
                                    v4.0.0 (Stable)
                                </Badge>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Environment</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-mono">
                                    {process.env.NODE_ENV || "development"}
                                </code>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Mode</span>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1.5 pl-1.5 pr-2.5 shadow-none">
                                    <WifiOff size={12} />
                                    Offline-First
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Database size={20} className="text-muted-foreground" />
                                Database Status
                            </CardTitle>
                            <CardDescription>
                                Connection and ORM specifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Provider</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="font-medium text-foreground">PostgreSQL</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">ORM Version</span>
                                <span className="font-mono text-sm text-muted-foreground">
                                    Prisma v5.22.0
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Port</span>
                                <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-mono">
                                    5435
                                </code>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-muted-foreground">Infrastructure</span>
                                <div className="flex items-center gap-1.5 text-foreground text-sm font-medium">
                                    <Cpu size={14} />
                                    Docker Container
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* GENERAL TAB */}
            <TabsContent value="general" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Configuration</CardTitle>
                        <CardDescription>
                            Manage global announcements and system-wide settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...generalForm}>
                            <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                                <FormField
                                    control={generalForm.control}
                                    name="announcement"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Global Announcement</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="e.g., Lunch Break at 1PM. System will be paused."
                                                    className="resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                This message will be displayed as a system-wide banner to all users
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={generalForm.control}
                                    name="maintenanceMode"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Maintenance Mode</FormLabel>
                                                <FormDescription>
                                                    When enabled, all user logins will be blocked except admins
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save General Settings
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* SYSTEM TAB */}
            <TabsContent value="system" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>System Thresholds</CardTitle>
                        <CardDescription>
                            Configure warning thresholds for the health dashboard gauges
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...thresholdForm}>
                            <form onSubmit={thresholdForm.handleSubmit(onThresholdSubmit)} className="space-y-6">
                                <FormField
                                    control={thresholdForm.control}
                                    name="ramThreshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>RAM Warning Threshold (GB)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="12" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                System will show warnings when RAM usage exceeds this value
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={thresholdForm.control}
                                    name="cpuThreshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CPU Warning Threshold (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="80" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                System will show warnings when CPU usage exceeds this percentage
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Threshold Settings
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* DANGER ZONE TAB */}
            <TabsContent value="danger" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Database Management</CardTitle>
                        <CardDescription>
                            Backup and restore database operations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Download SQL Dump</p>
                                <p className="text-sm text-muted-foreground">
                                    Export the entire database as a SQL file
                                </p>
                            </div>
                            <Button variant="outline" disabled>
                                Download
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                            Irreversible actions that affect system data
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Purge All System Logs</p>
                                <p className="text-sm text-muted-foreground">
                                    Permanently delete all entries from the SystemLog table
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={purgeLoading}>
                                        {purgeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Purge Logs
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. All system logs will be permanently deleted from the database.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handlePurgeLogs} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Yes, Purge All Logs
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
