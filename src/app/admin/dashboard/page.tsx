"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Plus, BarChart3, Megaphone } from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { EventsList } from "@/components/admin/event-list";
import { useFetchEventsForAdmin } from "@/hooks/events";
import { Event, EventStatus } from "@/types/events";
import axios from "axios";
import { apiUrl } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("ALL EVENTS");
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);
  const router = useRouter();

  // Use the hook to fetch events
  const { events, loading, error, refetchEvents } = useFetchEventsForAdmin();

  // Fetch student count
  React.useEffect(() => {
    const fetchStudentCount = async () => {
      setStudentLoading(true);
      setStudentError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiUrl}/auth/user/count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudentCount(res.data.count);
      } catch (err: any) {
        setStudentError("Failed to fetch student count");
        setStudentCount(null);
      } finally {
        setStudentLoading(false);
      }
    };
    fetchStudentCount();
  }, []);

  // Calculate stats from fetched events
  const totalEvents = events.length;
  const activeEvents = events.filter(
    (event) => event.status === "ONGOING" || event.status === "UPCOMING"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage events, attendance, and student activities
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/analytics")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/announcements")}
              className="flex items-center gap-2"
            >
              <Megaphone className="h-4 w-4" />
              Announcements
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              onClick={() => router.push("/admin/createEvent")}
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard title="Total Events" value={totalEvents} Icon={Calendar} />
          <StatsCard title="Active Events" value={activeEvents} />
          <StatsCard
            title="Total Students"
            value={studentLoading ? "Loading..." : studentError ? studentError : studentCount ?? "-"}
            Icon={Users}
          />
        </div>

        {/* Events Section */}
        <Card className="border-none bg-background shadow-none">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-gray-200 rounded-md text-lg">
                {["ALL EVENTS", "UPCOMING", "ONGOING", "COMPLETED"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={activeTab === tab ? "bg-blue-500 text-white" : ""}
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {["ALL EVENTS", "UPCOMING", "ONGOING", "COMPLETED"].map((status) => (
                <TabsContent key={status} value={status} className="mt-6">
                  <EventsList events={events} filterStatus={status as EventStatus} onRefresh={refetchEvents} />
                </TabsContent>
              ))}
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
