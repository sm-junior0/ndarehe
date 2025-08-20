import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

const NotificationsPanel: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder: static list
    setTimeout(() => {
      setItems([]);
      setLoading(false);
    }, 300);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600">Platform-level alerts and updates</p>
        </div>
        <Button variant="outline">
          <Bell className="h-4 w-4 mr-2" />
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">You're all caught up.</p>
            </div>
          ) : (
            <div className="space-y-4">{/* list items here */}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPanel;


