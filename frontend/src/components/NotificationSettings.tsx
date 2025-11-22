import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/use-notifications";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { toast } from "sonner";

const NotificationSettings = () => {
  const { permission, isSupported, requestPermission, isEnabled } = useNotifications();
  const { preferences, updatePreference } = useNotificationPreferences();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success("Notifications enabled", {
        description: "You'll receive alerts about inspections and updates",
      });
    } else {
      toast.error("Notifications denied", {
        description: "Please enable notifications in your browser settings",
      });
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Card className="p-4 sm:p-6 border-border">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {isEnabled ? (
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Bell className="h-4 w-4 text-primary" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                <BellOff className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Push Notifications
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEnabled
                  ? "Manage your notification preferences below"
                  : "Enable alerts for inspections and updates"}
              </p>
            </div>
          </div>
          {!isEnabled && permission !== 'denied' && (
            <Button
              onClick={handleEnableNotifications}
              size="sm"
              className="flex-shrink-0"
            >
              Enable
            </Button>
          )}
          {permission === 'denied' && (
            <p className="text-xs text-destructive flex-shrink-0">
              Blocked
            </p>
          )}
        </div>

        {isEnabled && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-inspections" className="text-sm font-normal cursor-pointer">
                  New Inspections
                </Label>
                <Switch
                  id="new-inspections"
                  checked={preferences.newInspections}
                  onCheckedChange={(checked) => updatePreference('newInspections', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inspection-updates" className="text-sm font-normal cursor-pointer">
                  Inspection Updates
                </Label>
                <Switch
                  id="inspection-updates"
                  checked={preferences.inspectionUpdates}
                  onCheckedChange={(checked) => updatePreference('inspectionUpdates', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="high-priority" className="text-sm font-normal cursor-pointer">
                  High Priority Issues
                </Label>
                <Switch
                  id="high-priority"
                  checked={preferences.highPriorityIssues}
                  onCheckedChange={(checked) => updatePreference('highPriorityIssues', checked)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default NotificationSettings;
