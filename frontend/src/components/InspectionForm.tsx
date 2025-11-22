import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ChevronLeft, ChevronRight, ClipboardCheck, MapPin, Sparkles, Timer } from "lucide-react";
import { toast } from "sonner";

interface InspectionFormProps {
  onSubmit: (data: {
    address: string;
    jobType: string;
    jobDescription: string;
    scopeOfWork?: string;
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
  }) => void;
}

const InspectionForm = ({ onSubmit }: InspectionFormProps) => {
  const steps = useMemo(() => ([
    { id: "location", label: "位置 & 类型", icon: MapPin, helper: "地址与工程类型" },
    { id: "scope", label: "工作内容", icon: ClipboardCheck, helper: "拆分工作与范围" },
    { id: "risk", label: "时间 & 风险", icon: Timer, helper: "紧急程度与阻碍" },
  ]), []);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    address: "",
    jobType: "",
    jobDescription: "",
    scopeOfWork: "",
    urgency: "medium" as 'low' | 'medium' | 'high' | 'emergency',
    constraints: "",
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateStep = () => {
    if (currentStep === 0 && !formData.address.trim()) {
      toast.error("请填写物业地址");
      return false;
    }
    if (currentStep === 0 && !formData.jobType) {
      toast.error("请选择工程类型");
      return false;
    }
    if (currentStep === 1 && !formData.jobDescription.trim()) {
      toast.error("请描述需要完成的工作");
      return false;
    }
    return true;
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    onSubmit({
      address: formData.address,
      jobType: formData.jobType,
      jobDescription: formData.jobDescription,
      scopeOfWork: formData.scopeOfWork || undefined,
      urgency: formData.urgency
    });
    toast.success("智能报价生成中…");
  };

  return (
    <div className="bg-card/70 backdrop-blur-sm rounded-2xl p-5 sm:p-8 border border-border shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Multi-step intake</p>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">现场信息采集</h2>
            <p className="text-sm text-muted-foreground">按类别分步填写，减少一次性输入的压力。</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 border border-border">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">实时校验 + 动态预览</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{steps[currentStep].label}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-secondary" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isDone = index < currentStep;
            return (
              <div
                key={step.id}
                className={`rounded-xl border bg-gradient-to-br from-card to-secondary/60 p-3 transition-all duration-200 hover:-translate-y-1 hover:border-t-slate-900 ${isActive ? "border-primary shadow-[var(--shadow-card)]" : "border-border"} ${isDone ? "opacity-80" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{step.helper}</p>
                    <p className="text-sm font-semibold">{step.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  物业地址 *
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="如：123 Main Street, London"
                  value={formData.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType" className="text-sm font-medium">
                  工程类型 *
                </Label>
                <Select value={formData.jobType} onValueChange={(value) => handleFieldChange("jobType", value)}>
                  <SelectTrigger id="jobType" className="h-11">
                    <SelectValue placeholder="选择工程类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roof_repair">Roof Repair</SelectItem>
                    <SelectItem value="bathroom_remodel">Bathroom Remodel</SelectItem>
                    <SelectItem value="electrical_rewire">Electrical Rewire</SelectItem>
                    <SelectItem value="general_renovation">General Renovation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobDescription" className="text-sm font-medium">
                  工作内容与数量 * <span className="text-muted-foreground font-normal">(越具体越好)</span>
                </Label>
                <Textarea
                  id="jobDescription"
                  placeholder="示例：Replace 20 missing roof tiles on south-facing slope. Water damage on bedroom ceiling. Check for rot and structural damage. 3-storey access."
                  value={formData.jobDescription}
                  onChange={(e) => handleFieldChange("jobDescription", e.target.value)}
                  className="min-h-[140px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  建议包含：损坏位置/数量、材料品牌、脚手架/进场难点、潜在隐患。
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scopeOfWork" className="text-sm font-medium">
                  Scope of Work <span className="text-muted-foreground font-normal">(可选)</span>
                </Label>
                <Textarea
                  id="scopeOfWork"
                  placeholder="示例：1) Remove damaged tiles 2) Replace with matching tiles 3) Repair ceiling damage 4) Finish & paint"
                  value={formData.scopeOfWork}
                  onChange={(e) => handleFieldChange("scopeOfWork", e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="urgency" className="text-sm font-medium">
                  紧急程度
                </Label>
                <Select value={formData.urgency} onValueChange={(value: any) => handleFieldChange("urgency", value)}>
                  <SelectTrigger id="urgency" className="h-11">
                    <SelectValue placeholder="时间预期" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — 可以排期</SelectItem>
                    <SelectItem value="medium">Medium — 常规时间</SelectItem>
                    <SelectItem value="high">High — 尽快安排</SelectItem>
                    <SelectItem value="emergency">Emergency — 立即响应</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraints" className="text-sm font-medium">
                  现场阻碍 / 安全备注 <span className="text-muted-foreground font-normal">(可选)</span>
                </Label>
                <Textarea
                  id="constraints"
                  placeholder="示例：道路封闭时段、需夜间施工、邻里噪音限制、需协调物业、电力提前断开等"
                  value={formData.constraints}
                  onChange={(e) => handleFieldChange("constraints", e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              </div>

              <div className="rounded-xl border border-border bg-secondary/60 px-4 py-3 flex items-center gap-3 hover:border-t-slate-900 transition-all">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">备注越充分，AI 将更容易校正风险系数与报价策略。</p>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              上一步
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="ml-auto gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:-translate-y-[1px] transition-all"
              >
                下一步
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="ml-auto gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:-translate-y-[1px] transition-all"
              >
                <Sparkles className="h-4 w-4" />
                生成智能报价
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-secondary/60 to-muted/60 p-4 shadow-[var(--shadow-card)] hover:border-t-slate-900 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Intel Card</p>
                <h3 className="text-base font-semibold text-foreground">实时填写预览</h3>
              </div>
              <Badge variant="outline" className="bg-white/40">Hover responsive</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">地址</span>
                <span className="text-sm font-medium text-foreground">{formData.address || "待填写"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">类型</span>
                <span className="text-sm font-medium text-foreground capitalize">{formData.jobType || "未选择"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">紧急度</span>
                <span className="text-sm font-medium text-foreground capitalize">{formData.urgency}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground line-clamp-3">
                {formData.jobDescription || "添加工作细节后，这里会同步预览，供你确认层级与措辞。"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">填写小贴士</p>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>• 先填地址 + 类型，下一步再拆解工作内容。</li>
              <li>• 用数字描述数量（m²、点位数、层高），AI 将使用数据字体显示。</li>
              <li>• 最后一步补充阻碍/时间窗口，帮助生成更精确的风险缓冲。</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionForm;
