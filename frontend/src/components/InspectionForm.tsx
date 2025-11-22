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
    { id: "location", label: "Location & Type", icon: MapPin, helper: "Address and job type" },
    { id: "scope", label: "Work Scope", icon: ClipboardCheck, helper: "Break down tasks & quantity" },
    { id: "risk", label: "Timing & Risk", icon: Timer, helper: "Urgency and blockers" },
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
      toast.error("Please provide the property address");
      return false;
    }
    if (currentStep === 0 && !formData.jobType) {
      toast.error("Please choose a job type");
      return false;
    }
    if (currentStep === 1 && !formData.jobDescription.trim()) {
      toast.error("Please describe the work needed");
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
    toast.success("Generating bid...");
  };

  return (
    <div className="bg-card/70 backdrop-blur-sm rounded-2xl p-5 sm:p-8 border border-border shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Multi-step intake</p>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Site Information Intake</h2>
            <p className="text-sm text-muted-foreground">Focus on one category at a time to keep input lightweight.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 border border-border">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Live validation + preview</span>
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
                  Property address *
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="e.g. 123 Main Street, London"
                  value={formData.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType" className="text-sm font-medium">
                  Job type *
                </Label>
                <Select value={formData.jobType} onValueChange={(value) => handleFieldChange("jobType", value)}>
                  <SelectTrigger id="jobType" className="h-11">
                    <SelectValue placeholder="Pick a job type" />
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
                  Work details & quantities * <span className="text-muted-foreground font-normal">(be specific)</span>
                </Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Example: Replace 20 missing roof tiles on south-facing slope. Water damage on bedroom ceiling. Check for rot and structural damage. 3-storey access."
                  value={formData.jobDescription}
                  onChange={(e) => handleFieldChange("jobDescription", e.target.value)}
                  className="min-h-[140px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Include: location/quantity, material brand, access issues, hidden risks.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scopeOfWork" className="text-sm font-medium">
                  Scope of Work <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="scopeOfWork"
                  placeholder="Example: 1) Remove damaged tiles 2) Replace with matching tiles 3) Repair ceiling damage 4) Finish & paint"
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
                  Urgency
                </Label>
                <Select value={formData.urgency} onValueChange={(value: any) => handleFieldChange("urgency", value)}>
                  <SelectTrigger id="urgency" className="h-11">
                    <SelectValue placeholder="Timeline expectation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — can schedule later</SelectItem>
                    <SelectItem value="medium">Medium — standard timeline</SelectItem>
                    <SelectItem value="high">High — needs priority</SelectItem>
                    <SelectItem value="emergency">Emergency — immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraints" className="text-sm font-medium">
                  Site blockers / safety notes <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="constraints"
                  placeholder="Examples: road closures, night work only, noise constraints, need building access coordination, power shut-off, etc."
                  value={formData.constraints}
                  onChange={(e) => handleFieldChange("constraints", e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              </div>

              <div className="rounded-xl border border-border bg-secondary/60 px-4 py-3 flex items-center gap-3 hover:border-t-slate-900 transition-all">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">More detail lets the AI adjust risk buffers and pricing strategy accurately.</p>
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
              Back
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="ml-auto gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:-translate-y-[1px] transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="ml-auto gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:-translate-y-[1px] transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Generate smart bid
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-secondary/60 to-muted/60 p-4 shadow-[var(--shadow-card)] hover:border-t-slate-900 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Intel Card</p>
                <h3 className="text-base font-semibold text-foreground">Live preview</h3>
              </div>
              <Badge variant="outline" className="bg-white/40">Hover responsive</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Address</span>
                <span className="text-sm font-medium text-foreground">{formData.address || "Pending"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-medium text-foreground capitalize">{formData.jobType || "Not selected"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Urgency</span>
                <span className="text-sm font-medium text-foreground capitalize">{formData.urgency}</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground line-clamp-3">
                {formData.jobDescription || "Once you add details, the preview updates so you can check ordering and wording."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Filling tips</p>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>• Start with address + type, then break down the work next.</li>
              <li>• Use numbers for quantities (sqm, count, height); they'll show in the data font.</li>
              <li>• Add blockers/timing last to refine risk buffers.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionForm;
