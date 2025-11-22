import { DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TotalSummaryProps {
  total: number;
  itemCount: number;
}

const TotalSummary = ({ total, itemCount }: TotalSummaryProps) => {
  return (
    <div className="bg-gradient-to-br from-primary via-primary to-primary/90 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-[var(--shadow-elevated)] text-primary-foreground">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary-foreground/20">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-base sm:text-xl font-bold">Estimated Total Cost</h3>
          </div>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">
            ${total.toLocaleString()}
          </p>
          <p className="text-primary-foreground/80 text-xs sm:text-sm">
            Based on {itemCount} identified {itemCount === 1 ? "issue" : "issues"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-sm h-10 sm:h-11"
          >
            <FileText className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Download Report
          </Button>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-primary-foreground/20">
        <p className="text-[10px] sm:text-xs text-primary-foreground/70">
          * Estimates are based on standard industry rates and may vary based on location, material
          costs, and contractor availability. Final pricing should be confirmed with licensed
          contractors.
        </p>
      </div>
    </div>
  );
};

export default TotalSummary;
