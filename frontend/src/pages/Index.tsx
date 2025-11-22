import { useState, useEffect } from "react";
import { Building2, MapPin, ClipboardList, DollarSign, Loader2, Copy, Check, Edit2, Save, ExternalLink } from "lucide-react";
import InspectionForm from "@/components/InspectionForm";
import LocationHistory from "@/components/LocationHistory";
import BillingList from "@/components/BillingList";
import MarketComparisonChart from "@/components/MarketComparisonChart";
import { api, type BidResponse } from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const Index = () => {
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bidData, setBidData] = useState<BidResponse | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<"win_at_all_costs" | "balanced" | "premium">("balanced");
  const [copied, setCopied] = useState(false);
  const [inspectionData, setInspectionData] = useState({
    address: "",
    jobType: "",
  });

  // Editable explanation state
  const [explanation, setExplanation] = useState("");
  const [isEditingExplanation, setIsEditingExplanation] = useState(false);

  useEffect(() => {
    if (bidData) {
      setExplanation(bidData.pricing_explanation);
    }
  }, [bidData]);

  const handleSubmit = async (data: {
    address: string;
    jobType: string;
    jobDescription: string;
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
        urgency: data.urgency,
        desired_margin_percent: 0.2,
      });

      setBidData(response);
      setShowResults(true);
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
      // Try modern Clipboard API first (requires secure context or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(proposal);
      } else {
        // Fallback for non-secure contexts (like HTTP IP address)
        const textArea = document.createElement("textarea");
        textArea.value = proposal;

        // Ensure it's not visible but part of the DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.setAttribute('readonly', '');

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error("Fallback copy failed");
        }
      }

      setCopied(true);
      toast.success("Proposal copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy proposal - check browser permissions");
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
      issue: `${bidData.property_context.material_cost_band === 'unknown' ? 'Standard' : bidData.property_context.material_cost_band.charAt(0).toUpperCase() + bidData.property_context.material_cost_band.slice(1)} cost materials`,
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

            {/* Market Comparison Chart */}
            {bidData.pricing.market_stats && (
              <MarketComparisonChart
                marketStats={bidData.pricing.market_stats}
                pricingBands={bidData.pricing.price_bands}
                selectedPrice={getSelectedPrice()}
              />
            )}            {/* Pricing Explanation */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>📊 Pricing Explanation</CardTitle>
                  <CardDescription>Location-specific pricing analysis</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingExplanation(!isEditingExplanation)}
                >
                  {isEditingExplanation ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditingExplanation ? (
                  <Textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    className="min-h-[200px]"
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{explanation}</p>
                  </div>
                )}
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

            <LocationHistory
              address={inspectionData.address}
              jobType={inspectionData.jobType}
              propertyContext={bidData?.property_context}
            />
            <BillingList items={billingItems} />

            {/* Sources */}
            {bidData.raw_valyu_results && bidData.raw_valyu_results.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sources Used</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bidData.raw_valyu_results.map((result, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium truncate flex items-center gap-2">
                          <ExternalLink className="h-3 w-3" />
                          <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {result.title || "Source"}
                          </a>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {result.snippet}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
