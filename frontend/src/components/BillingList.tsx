import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BillingItem {
  id: number;
  category: string;
  issue: string;
  severity: "low" | "moderate" | "high";
  cost: number;
}

interface BillingListProps {
  items: BillingItem[];
}

const BillingList = ({ items }: BillingListProps) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          icon: AlertCircle,
          label: "High Priority",
          variant: "destructive" as const,
          iconColor: "text-destructive",
          bgColor: "bg-destructive/10",
        };
      case "moderate":
        return {
          icon: AlertTriangle,
          label: "Moderate",
          variant: "secondary" as const,
          iconColor: "text-accent",
          bgColor: "bg-accent/10",
        };
      case "low":
        return {
          icon: Info,
          label: "Low Priority",
          variant: "outline" as const,
          iconColor: "text-primary",
          bgColor: "bg-primary/10",
        };
      default:
        return {
          icon: Info,
          label: "Low Priority",
          variant: "outline" as const,
          iconColor: "text-primary",
          bgColor: "bg-primary/10",
        };
    }
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-border shadow-[var(--shadow-card)]">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-xl font-bold text-foreground mb-0.5 sm:mb-1">Costs Breakdown</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Breakdown of estimated costs based on inspection
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {items.map((item, index) => {
          const config = getSeverityConfig(item.severity);
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border border-border bg-muted/30 hover:shadow-md hover:bg-muted/50 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-3 sm:gap-4 flex-1">
                <div className={`p-2 sm:p-2.5 rounded-lg ${config.bgColor} h-fit flex-shrink-0`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wide">
                      {item.category}
                    </span>
                    <Badge variant={config.variant} className="text-[10px] sm:text-xs">
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground font-medium">{item.issue}</p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right sm:text-right">
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  ${item.cost.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BillingList;
