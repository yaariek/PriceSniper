import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, ClipboardList, DollarSign, Copy, Check, Sparkles, ShieldHalf, Clock3, LineChart, MoveRight, Activity, Radar } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const { preferences } = useNotificationPreferences();
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);
  const [bidData, setBidData] = useState<BidResponse | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<"win_at_all_costs" | "balanced" | "premium">("balanced");
  const [copied, setCopied] = useState(false);
  const [inspectionData, setInspectionData] = useState({
    address: "",
    jobType: "",
    urgency: "medium" as 'low' | 'medium' | 'high' | 'emergency',
  });

  const scanningSteps = useMemo(() => [
    "扫描地理标签与邻域基准价…",
    "评估人工与材料区间…",
    "匹配类似案例并生成报价策略…",
    "压测利润率与风险缓冲…",
  ], []);

  useEffect(() => {
    if (!loading) {
      setScanIndex(0);
      return;
    }
    const id = setInterval(() => {
      setScanIndex((prev) => (prev + 1) % scanningSteps.length);
    }, 1400);
    return () => clearInterval(id);
  }, [loading, scanningSteps]);

  const handleSubmit = async (data: {
    address: string;
    jobType: string;
    jobDescription: string;
    scopeOfWork?: string;
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
  }) => {
    setInspectionData({ address: data.address, jobType: data.jobType, urgency: data.urgency ?? "medium" });
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

  const riskScore = useMemo(() => {
    const urgencyScoreMap: Record<'low' | 'medium' | 'high' | 'emergency', number> = {
      low: 42,
      medium: 57,
      high: 72,
      emergency: 86,
    };
    return urgencyScoreMap[inspectionData.urgency ?? "medium"];
  }, [inspectionData.urgency]);

  const pricingOptions = [
    {
      id: "win_at_all_costs" as const,
      title: "Win-at-all-costs",
      description: "更低报价，抢占机会。",
      accent: "from-emerald-500/30 to-emerald-700/10",
    },
    {
      id: "balanced" as const,
      title: "Balanced",
      description: "利润与竞争力平衡。",
      accent: "from-primary/40 to-primary/10",
    },
    {
      id: "premium" as const,
      title: "Premium",
      description: "为高端客户预留溢价。",
      accent: "from-amber-500/30 to-amber-700/10",
    },
  ];

  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-30 bg-gradient-to-b from-background/95 via-secondary/90 to-background/95 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),radial-gradient(circle_at_80%_0%,hsl(var(--accent)/0.12),transparent_26%)]" />
      <div className="absolute inset-6 rounded-[28px] border border-border/80 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_100%)] opacity-40 animate-shine" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.04)_50%,transparent_100%)]" />
        <div className="absolute inset-x-0 h-28 bg-gradient-to-b from-primary/15 to-transparent animate-scan-vertical" />
      </div>
      <div className="relative h-full flex flex-col items-center justify-center gap-8 px-6">
        <div className="text-center space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 px-3 py-1 bg-card/70">
            <Radar className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Scanning</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">分析现场 + 生成报价策略</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{scanningSteps[scanIndex]}</p>
        </div>
        <div className="w-full max-w-2xl">
          <div className="relative h-3 rounded-full bg-secondary overflow-hidden border border-border/60">
            <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-primary/80 via-accent/70 to-primary/80 animate-shine" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
          {[ "位置", "成本", "策略" ].map((label, idx) => (
            <div key={label} className="rounded-xl border border-border bg-card/70 p-4 shadow-[var(--shadow-card)] hover:border-t-slate-900 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">Step {idx + 1}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-primary/60 via-accent/60 to-primary/60 animate-shine" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.08),transparent_32%),radial-gradient(circle_at_80%_0%,hsl(var(--accent)/0.08),transparent_28%)] from-background">
      {loading && <LoadingOverlay />}

      <header className="border-b border-border/70 bg-card/70 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl blur-md opacity-60 animate-pulse" />
              <div className="relative p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                <Building2 className="h-5 w-5 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground tracking-tight">
                Price Sniper — Field Intel
              </h1>
              <p className="text-[11px] sm:text-sm text-muted-foreground font-medium">
                分步收集 → 扫描加载 → 智能报价
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Inter 字体 · 数字用 JetBrains Mono</span>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-6xl mx-auto relative space-y-6 sm:space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <InspectionForm onSubmit={handleSubmit} />

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Alerts</p>
                  <h3 className="text-base font-semibold text-foreground">通知策略</h3>
                </div>
                <Badge variant="outline" className="bg-secondary/60">Shadcn UI</Badge>
              </div>
              <NotificationSettings />
            </div>

            <div className="rounded-2xl border border-border bg-gradient-to-br from-secondary/70 via-card to-muted/70 p-4 shadow-[var(--shadow-card)] hover:border-t-slate-900 transition-all">
              <div className="flex items-center gap-3">
                <ShieldHalf className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">数据层级提示</p>
                  <p className="text-xs text-muted-foreground">保持关键信息在首屏：地址 → 工种 → 数量 → 风险 → 价格。</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Hover border 提示 & 减少色彩干扰，保留米白/灰棕主色。</span>
              </div>
            </div>
          </div>
        </div>

        {showResults && bidData && !loading && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "地址", value: inspectionData.address || "待填写", icon: MapPin, detail: bidData.property_context.property_type || "Property" },
                { label: "人工参考", value: `£${(bidData.property_context.detected_labour_rate || 65).toLocaleString()}/hr`, icon: ClipboardList, detail: "Auto-detected" },
                { label: "选择价格", value: `£${totalCost.toLocaleString()}`, icon: DollarSign, detail: selectedPricing },
                { label: "风险系数", value: riskScore.toString(), icon: ShieldHalf, detail: inspectionData.urgency },
              ].map((fact) => (
                <div key={fact.label} className="rounded-xl border border-border bg-card/70 p-4 shadow-[var(--shadow-card)] hover:border-t-slate-900 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <fact.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{fact.label}</span>
                    </div>
                    <Badge variant="outline" className="bg-secondary/60 text-[11px]">{fact.detail}</Badge>
                  </div>
                  <p className="text-xl font-semibold font-data">{fact.value}</p>
                </div>
              ))}
            </div>

            <Card className="border border-border/80 bg-card/80 shadow-[var(--shadow-card)]">
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>💰 报价策略</CardTitle>
                  <CardDescription>按场景选择，数字用 JetBrains Mono 呈现。</CardDescription>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  <span>利润基于内部成本 £{bidData.pricing.internal_cost_estimate.toLocaleString()}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {pricingOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedPricing(option.id)}
                      className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-1 hover:border-t-slate-900 bg-gradient-to-br ${option.accent} ${selectedPricing === option.id ? "border-primary shadow-[var(--shadow-elevated)]" : "border-border/80 shadow-[var(--shadow-card)]"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-lg bg-card/70 flex items-center justify-center border border-border">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{option.title}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <MoveRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-semibold font-data text-foreground">
                        £{bidData.pricing.price_bands[option.id].toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="rounded-lg border border-dashed border-border/80 bg-muted/50 p-4 flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">风险缓冲</p>
                  </div>
                  <p className="text-xs text-muted-foreground">紧急度 <span className="font-data text-foreground">{inspectionData.urgency}</span> 已写入风险系数，若客户催促，可切换 Premium 提前预留工期缓冲。</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="border border-border/80 bg-card/80 shadow-[var(--shadow-card)]">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>📝 Proposal</CardTitle>
                    <CardDescription>精简版客户稿，随时复制。</CardDescription>
                  </div>
                  <Button onClick={handleCopyProposal} variant="outline" className="gap-2">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        复制
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 border border-border rounded-xl p-5">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap leading-relaxed">{bidData.proposal_draft}</p>
                      <Separator className="my-4" />
                      <div className="flex justify-between items-center font-semibold text-lg">
                        <span>Quoted Price</span>
                        <span className="text-primary font-data">£{getSelectedPrice().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/80 bg-card/80 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle>📊 Pricing Explanation</CardTitle>
                  <CardDescription>区域 + 现场变量分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed">{bidData.pricing_explanation}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-border/80 bg-card/80 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>🏠 物业情报</CardTitle>
                <CardDescription>按层级排列的关键字段</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "类型", value: bidData.property_context.property_type || "Unknown" },
                    { label: "建造年份", value: bidData.property_context.property_year_built || "Unknown" },
                    { label: "面积", value: bidData.property_context.property_size_sqm ? `${bidData.property_context.property_size_sqm} sqm` : "Unknown" },
                    { label: "卧室数", value: bidData.property_context.number_of_bedrooms || "Unknown" },
                    { label: "邻里中位价", value: bidData.property_context.neighbourhood_price_median ? `£${bidData.property_context.neighbourhood_price_median.toLocaleString()}` : "N/A" },
                    { label: "价格趋势", value: bidData.property_context.neighbourhood_price_trend || "N/A" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/70 bg-secondary/50 p-3 hover:border-t-slate-900 transition-all">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-base font-semibold font-data">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <LocationHistory address={inspectionData.address} jobType={inspectionData.jobType} />
            <BillingList items={billingItems} />
            <TotalSummary total={totalCost} itemCount={billingItems.length} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
