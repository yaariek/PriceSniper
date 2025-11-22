import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface InspectionFormProps {
  onSubmit: (data: {
    address: string;
    jobType: string;
    jobDescription: string;
    scopeOfWork?: string;
    knownIssues?: string[];
    complications?: string[];
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
  }) => void;
}

const InspectionForm = ({ onSubmit }: InspectionFormProps) => {
  const [address, setAddress] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'emergency'>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      toast.error("Please enter a property address");
      return;
    }
    
    if (!jobType) {
      toast.error("Please select a job type");
      return;
    }

    if (!jobDescription.trim()) {
      toast.error("Please describe the work needed");
      return;
    }

    onSubmit({
      address,
      jobType,
      jobDescription,
      scopeOfWork: scopeOfWork || undefined,
      urgency
    });
    toast.success("Generating bid...");
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-border shadow-[var(--shadow-card)]">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">Property Inspection</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Enter property details and describe the work needed
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium">
            Property Address *
          </Label>
          <Input
            id="address"
            type="text"
            placeholder="123 Main Street, London"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobType" className="text-sm font-medium">
            Job Type *
          </Label>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger id="jobType" className="h-11">
              <SelectValue placeholder="Select job type" />
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

        <div className="space-y-2">
          <Label htmlFor="jobDescription" className="text-sm font-medium">
            Job Description * <span className="text-muted-foreground font-normal">(Be specific!)</span>
          </Label>
          <Textarea
            id="jobDescription"
            placeholder="Example: Replace 20 missing roof tiles on south-facing slope. Water damage visible on bedroom ceiling. Need to check for rot and repair any structural damage. Property is 3 stories with difficult access."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="min-h-[120px] resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Include: what's broken, quantities, severity, any complications (access, asbestos, etc.)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scopeOfWork" className="text-sm font-medium">
            Scope of Work <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <Textarea
            id="scopeOfWork"
            placeholder="Example: 1. Remove damaged tiles 2. Replace with matching tiles 3. Repair ceiling damage 4. Paint ceiling"
            value={scopeOfWork}
            onChange={(e) => setScopeOfWork(e.target.value)}
            className="min-h-[80px] resize-y"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="urgency" className="text-sm font-medium">
            Urgency
          </Label>
          <Select value={urgency} onValueChange={(value: any) => setUrgency(value)}>
            <SelectTrigger id="urgency" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low - Can wait</SelectItem>
              <SelectItem value="medium">Medium - Normal timeline</SelectItem>
              <SelectItem value="high">High - Needs attention soon</SelectItem>
              <SelectItem value="emergency">Emergency - Urgent!</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg transition-all duration-300"
        >
          <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Generate Bid
        </Button>
      </form>
    </div>
  );
};

export default InspectionForm;
