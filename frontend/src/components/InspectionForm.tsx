import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { VoiceInput } from "./VoiceInput";

interface InspectionFormProps {
  onSubmit: (data: {
    address: string;
    jobType: string;
    jobDescription: string;
    urgency?: 'low' | 'medium' | 'high' | 'emergency';
  }) => void;
}

const InspectionForm = ({ onSubmit }: InspectionFormProps) => {
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'emergency'>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      toast.error("Please enter a property address");
      return;
    }

    if (!postcode.trim()) {
      toast.error("Please enter a postcode");
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

    // Stopgap: Basic UK validation
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    const isValidPostcode = ukPostcodeRegex.test(postcode.trim());

    // Simple check for common non-UK countries in address
    const nonUKCountries = ["usa", "united states", "france", "germany", "spain", "italy", "canada", "australia", "china", "japan", "india"];
    const addressLower = address.toLowerCase();
    const hasNonUKCountry = nonUKCountries.some(country => addressLower.includes(country));

    if (!isValidPostcode) {
      toast.error("Please enter a valid UK postcode (e.g. SW1A 1AA)");
      return;
    }

    if (hasNonUKCountry) {
      toast.error("PriceSniper currently only supports UK properties");
      return;
    }

    onSubmit({
      address: `${address}, ${postcode}`,
      jobType,
      jobDescription,
      urgency
    });
    toast.success("Generating bid...");
  };

  const googleMapsUrl = address && postcode
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${postcode}`)}`
    : null;

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-border shadow-[var(--shadow-card)]">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">Property Inspection</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Enter property details and describe the work needed
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Property Address *
            </Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main Street"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postcode" className="text-sm font-medium">
              Postcode *
            </Label>
            <Input
              id="postcode"
              type="text"
              placeholder="SW1A 1AA"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        {googleMapsUrl && (
          <div className="rounded-lg overflow-hidden border border-border h-48 w-full bg-muted relative group">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${address}, ${postcode}`)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
              className="opacity-75 group-hover:opacity-100 transition-opacity"
            ></iframe>
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors pointer-events-none">
              <Button
                variant="secondary"
                size="sm"
                className="shadow-lg pointer-events-auto"
                type="button"
                onClick={() => window.open(googleMapsUrl, '_blank')}
              >
                View on Google Maps
              </Button>
            </div>
          </div>
        )}

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
          <div className="flex justify-between items-center">
            <Label htmlFor="jobDescription" className="text-sm font-medium">
              Job Description * <span className="text-muted-foreground font-normal">(Be specific!)</span>
            </Label>
            <VoiceInput onTranscription={(text) => setJobDescription(prev => prev + (prev ? " " : "") + text)} />
          </div>
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
