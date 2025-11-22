import { useState } from "react";
import { Building2, MapPin, ClipboardList, DollarSign, Loader2, Copy, Check } from "lucide-react";
import InspectionForm from "@/components/InspectionForm";
import LocationHistory from "@/components/LocationHistory";
import BillingList from "@/components/BillingList";
import TotalSummary from "@/components/TotalSummary";
import NotificationSettings from "@/components/NotificationSettings";
import { notifyNewInspection } from "@/lib/notifications";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { api, type BidResponse } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const { preferences } = useNotificationPreferences();
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bidData, setBidData] = useState<BidResponse | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<"win_at_all_costs" | "balanced" | "premium">("balanced");
  const [copied, setCopied] = useState(false);
  const [inspectionData, setInspectionData] = useState({
    address: "",
    jobType: "",
  });

  const handleSubmit = async (data: {
    address: string;
    jobType: string;
    jobDescription: string;
    scopeOfWork?: string;
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
  }) => {
    setInspectionData({ address: data.address, jobType: data.jobType });
    setLoading(true);
    
    try {
      const response = await api.createBid({
        address: data.address,
        region: "London, UK",
        job_type: mapJobTypeToBackend(data.jobType),
        job_description: data.jobDescription,
        scope_of_work: data.scopeOfWork,
        urgency: data.urgency,
        desired_margin_percent: 0.2,
      });
      
      setBidData(response);
      setShowResults(true);
      notifyNewInspection(data.address, preferences.newInspections);
      toast.success("Bid generated successfully!");
    } catch (error) {
      console.error("Failed to generate bid:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate bid");
    } finally {
      setLoading(false);
    }
  };

  const mapJobTypeToBackend = (jobType: string): "roof_repair" | "bathroom_remodel" | "electrical_rewire" | "general_renovation" | "other" => {
    const typeMap: Record<string, "roof_repair" | "bathroom_remodel" | "electrical_rewire" | "general_renovation" | "other"> = {
      "roof_repair": "roof_repair",
      "bathroom_remodel": "bathroom_remodel",
      "electrical_rewire": "electrical_rewire",
      "general_renovation": "general_renovation",
      "other": "other"
    };
    return typeMap[jobType] || "other";
  };

  const getSelectedPrice = () => {
    if (!bidData) return 0;
    return bidData.pricing.price_bands[selectedPricing];
  };

  const handleCopyProposal = async () => {
    if (!bidData) return;
    
    const proposal = `${bidData.proposal_draft}\n\nQuoted Price: £${getSelectedPrice().toLocaleString()}`;
    
    try {
      await navigator.clipboard.writeText(proposal);
      setCopied(true);
      toast.success("Proposal copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy proposal");
    }
  };

  const billingItems = bidData ? [
    {
      id: 1,
      category: "Labour",
      issue: `${bidData.property_context.detected_labour_rate || 65} £/hr`,
      severity: "moderate" as const,
      cost: bidData.pricing.total_labour_cost || (bidData.pricing.internal_cost_estimate * 0.4),
    },
    {
      id: 2,
      category: "Materials",
      issue: bidData.property_context.material_cost_band + " cost materials",
      severity: "moderate" as const,
      cost: bidData.pricing.total_materials_cost || (bidData.pricing.internal_cost_estimate * 0.6),
    },
  ] : [];

  const totalCost = getSelectedPrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <header className="border-b border-border/50 bg-card/80 sticky top-0 z-10 backdrop-blur-xl">
        <div className="px-3 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl blur-lg opacity-60 animate-pulse"></div>
              <div className="relative p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/50">
                <Building2 className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-3xl font-display font-bold text-primary tracking-tight drop-shadow-sm">
                Price Sniper
              </h1>
              <p className="text-[10px] sm:text-sm text-muted-foreground font-medium">
                AI-powered bid generation
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-3 py-4 sm:px-6 sm:py-10 max-w-5xl mx-auto relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
        </div>

        <div className="mb-4 sm:mb-6">
          <NotificationSettings />
        </div>

        <div className="mb-4 sm:mb-8">
          <InspectionForm onSubmit={handleSubmit} />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">Generating bid...</span>
          </div>
        )}

        {showResults && bidData && !loading && (
          <div className="space-y-4 sm:space-y-6 animate-slide-up">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Location</span>
                  </div>
                  <p className="text-sm font-bold truncate">{inspectionData.address}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="h-4 w-4 text-accent" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Labour Rate</span>
                  </div>
                  <p className="text-2xl font-bold">£{bidData.property_context.detected_labour_rate || 65}/hr</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Selected Price</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">£{totalCost.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Strategy Selection */}
            <Card>
              <CardHeader>
                <CardTitle>💰 Select Your Pricing Strategy</CardTitle>
                <CardDescription>Choose the pricing tier that best fits your business goals</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPricing} onValueChange={(value: any) => setSelectedPricing(value)} className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900 transition-colors">
                    <RadioGroupItem value="win_at_all_costs" id="win" />
                    <Label htmlFor="win" className="flex-1 cursor-pointer">
                      <div className="font-semibold text-green-700 dark:text-green-300">Win-at-all-costs</div>
                      <div className="text-sm text-muted-foreground">Competitive pricing to secure the job</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        £{bidData.pricing.price_bands.win_at_all_costs.toLocaleString()}
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                    <RadioGroupItem value="balanced" id="balanced" />
                    <Label htmlFor="balanced" className="flex-1 cursor-pointer">
                      <div className="font-semibold text-blue-700 dark:text-blue-300">Balanced (Recommended)</div>
                      <div className="text-sm text-muted-foreground">Fair profit margin with competitive edge</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        £{bidData.pricing.price_bands.balanced.toLocaleString()}
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors">
                    <RadioGroupItem value="premium" id="premium" />
                    <Label htmlFor="premium" className="flex-1 cursor-pointer">
                      <div className="font-semibold text-purple-700 dark:text-purple-300">Premium</div>
                      <div className="text-sm text-muted-foreground">Higher margin for quality-focused clients</div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                        £{bidData.pricing.price_bands.premium.toLocaleString()}
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Internal Cost Estimate</p>
                  <p className="text-lg font-bold">£{bidData.pricing.internal_cost_estimate.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Your base cost before margin</p>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Explanation */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Pricing Explanation</CardTitle>
                <CardDescription>Location-specific pricing analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{bidData.pricing_explanation}</p>
                </div>
              </CardContent>
            </Card>

            {/* Client Proposal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>📝 Client Proposal</CardTitle>
                    <CardDescription>Ready to send to your client</CardDescription>
                  </div>
                  <Button onClick={handleCopyProposal} variant="outline" className="gap-2">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Proposal
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{bidData.proposal_draft}</p>
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Quoted Price:</span>
                      <span className="text-primary">£{getSelectedPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Context */}
            <Card>
              <CardHeader>
                <CardTitle>🏠 Property Context</CardTitle>
                <CardDescription>Enhanced property data from Valyu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Property Type</p>
                    <p className="text-lg font-bold capitalize">{bidData.property_context.property_type || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year Built</p>
                    <p className="text-lg font-bold">
                      {bidData.property_context.property_year_built || 'Unknown'}
                      {bidData.property_context.architectural_period && ` (${bidData.property_context.architectural_period})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="text-lg font-bold">{bidData.property_context.property_size_sqm ? `${bidData.property_context.property_size_sqm} sqm` : 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="text-lg font-bold">{bidData.property_context.number_of_bedrooms || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Neighbourhood Median</p>
                    <p className="text-lg font-bold">£{bidData.property_context.neighbourhood_price_median?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price Trend</p>
                    <p className="text-lg font-bold capitalize">{bidData.property_context.neighbourhood_price_trend || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <LocationHistory 
              address={inspectionData.address} 
              jobType={inspectionData.jobType} 
              propertyContext={bidData?.property_context}
            />
            <BillingList items={billingItems} />
            <TotalSummary total={totalCost} itemCount={billingItems.length} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
