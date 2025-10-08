import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  ExternalLink,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Info,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Star,
  Heart,
  Target,
  TrendingUp,
  Award,
  Banknote,
} from "lucide-react";
import {
  BURSARIES,
  BURSARY_FIELDS_OF_STUDY,
} from "@/constants/enhancedBursaries";
import { PROVINCES } from "@/constants/bursaries";
import { BursaryFilters } from "@/types/university";

const EnhancedBursaryListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<BursaryFilters>({});
  const [expandedBursary, setExpandedBursary] = useState<string | null>(null);

  // Filter university bursaries only
  const filteredBursaries = useMemo(() => {
    const universityBursaries = BURSARIES.filter(
      (b) =>
        !b.studyLevel?.includes("grade-11") &&
        !b.studyLevel?.includes("matric"),
    );

    return universityBursaries.filter((bursary) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        bursary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bursary.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bursary.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Field of study filter
      const matchesField =
        !filters.fieldOfStudy ||
        bursary.fieldsOfStudy.includes("All fields") ||
        bursary.fieldsOfStudy.includes(filters.fieldOfStudy);

      // Province filter
      const matchesProvince =
        !filters.province ||
        bursary.provinces.includes("All provinces") ||
        bursary.provinces.includes(filters.province);

      // Financial need filter
      const matchesFinancialNeed =
        filters.financialNeed === undefined ||
        bursary.requirements.financialNeed === filters.financialNeed;

      // Minimum marks filter
      const matchesMinMarks = (() => {
        if (!filters.minMarks) return true;

        if (bursary.requirements.minimumMarks !== undefined) {
          return bursary.requirements.minimumMarks <= filters.minMarks;
        }

        const academicTexts = [
          ...(bursary.requirements?.academicRequirement
            ? [bursary.requirements.academicRequirement]
            : []),
          ...bursary.eligibilityCriteria.filter(
            (criteria) =>
              criteria.toLowerCase().includes("%") ||
              criteria.toLowerCase().includes("average") ||
              criteria.toLowerCase().includes("minimum") ||
              criteria.toLowerCase().includes("academic"),
          ),
        ];

        for (const text of academicTexts) {
          const marksMatch = text.match(/(\d+)%/);
          if (marksMatch) {
            const extractedMarks = parseInt(marksMatch[1]);
            return extractedMarks <= filters.minMarks;
          }
        }

        return true;
      })();

      // Maximum household income filter
      const matchesHouseholdIncome = (() => {
        if (!filters.maxHouseholdIncome) return true;

        if (bursary.requirements.maxHouseholdIncome !== undefined) {
          return (
            bursary.requirements.maxHouseholdIncome >=
            filters.maxHouseholdIncome
          );
        }

        const incomeText = bursary.eligibilityCriteria.find(
          (criteria) =>
            criteria.toLowerCase().includes("income") ||
            criteria.toLowerCase().includes("household") ||
            criteria.toLowerCase().includes("r"),
        );

        if (incomeText) {
          const incomeMatch = incomeText.match(/R?[\s]*(\d[\d,\s]*)/);
          if (incomeMatch) {
            const extractedIncome = parseInt(
              incomeMatch[1].replace(/[,\s]/g, ""),
            );
            return extractedIncome >= filters.maxHouseholdIncome;
          }
        }

        return true;
      })();

      // Gender filter
      const matchesGender =
        !filters.genderSpecific ||
        filters.genderSpecific === "any" ||
        !bursary.requirements.genderSpecific ||
        bursary.requirements.genderSpecific === filters.genderSpecific;

      // Race filter
      const matchesRace =
        !filters.raceSpecific ||
        filters.raceSpecific === "any" ||
        !bursary.requirements.raceSpecific ||
        bursary.requirements.raceSpecific === filters.raceSpecific;

      // Special criteria filters
      const matchesDisabilitySupport =
        !filters.disabilitySupport ||
        bursary.requirements.disabilitySupport === true;

      const matchesRuralBackground =
        !filters.ruralBackground ||
        bursary.requirements.ruralBackground === true;

      const matchesFirstGeneration =
        !filters.firstGeneration ||
        bursary.requirements.firstGeneration === true;

      return (
        matchesSearch &&
        matchesField &&
        matchesProvince &&
        matchesFinancialNeed &&
        matchesMinMarks &&
        matchesHouseholdIncome &&
        matchesGender &&
        matchesRace &&
        matchesDisabilitySupport &&
        matchesRuralBackground &&
        matchesFirstGeneration
      );
    });
  }, [searchTerm, filters]);

  const updateFilter = (
    key: keyof BursaryFilters,
    value: string | boolean | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({});
  };

  const getApplicationStatus = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { status: "closed", message: "Application closed", color: "red" };
    } else if (daysDiff <= 30) {
      return {
        status: "closing",
        message: `${daysDiff} days left`,
        color: "orange",
      };
    } else {
      return { status: "open", message: "Application open", color: "green" };
    }
  };

  // Helper function to get high school requirements for university bursaries
  const getHighSchoolRequirements = (bursary: {
    requirements?: {
      academicRequirement?: string;
      apsScore?: string;
      subjects?: string[];
    };
  }) => {
    const requirements = [];

    // Extract academic requirements
    if (bursary.requirements?.academicRequirement) {
      const marksMatch =
        bursary.requirements.academicRequirement.match(/(\d+)%/);
      if (marksMatch) {
        requirements.push({
          type: "academic",
          grade11: `Aim for ${Math.max(parseInt(marksMatch[1]) - 5, 60)}%+ average in Grade 11`,
          matric: `Minimum ${marksMatch[1]}% average in Matric`,
        });
      }
    }

    // Extract from eligibility criteria
    bursary.eligibilityCriteria.forEach((criteria: string) => {
      const marksMatch = criteria.match(/(\d+)%/);
      if (marksMatch && criteria.toLowerCase().includes("average")) {
        requirements.push({
          type: "academic",
          grade11: `Target ${Math.max(parseInt(marksMatch[1]) - 5, 60)}%+ in Grade 11`,
          matric: `Need ${marksMatch[1]}% Matric average`,
        });
      }

      if (
        criteria.toLowerCase().includes("nsc") ||
        criteria.toLowerCase().includes("matric")
      ) {
        requirements.push({
          type: "nsc",
          requirement: criteria,
        });
      }
    });

    return requirements;
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 bg-gradient-to-r from-green-600 via-book-600 to-emerald-600 text-white p-8 rounded-xl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <GraduationCap className="h-12 w-12" />
          <h1 className="text-4xl font-bold">
            University Bursary Opportunities
          </h1>
        </div>
        <p className="text-xl max-w-3xl mx-auto opacity-90">
          Unlock your educational dreams with comprehensive university funding
          opportunities. Find the perfect bursary for your degree and career
          aspirations.
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 max-w-3xl mx-auto">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">
              {filteredBursaries.length}+
            </div>
            <div className="text-sm opacity-90">University Bursaries</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">R2B+</div>
            <div className="text-sm opacity-90">Available Funding</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-bold">All Fields</div>
            <div className="text-sm opacity-90">Study Areas</div>
          </div>
        </div>
      </div>

      {/* High School Student Information */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-800 flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6" />
            Stay Updated on Bursary Opportunities
          </CardTitle>
          <CardDescription className="text-lg text-green-700">
            Get the latest news on bursaries and educational funding. Check{" "}
            <a
              href="https://rebookednews.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-800 underline font-semibold"
            >
              ReBooked News
            </a>{" "}
            for updates on new opportunities and application deadlines
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-green-800 flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Perfect Bursary
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Use the filters below to discover bursaries that match your
                academic goals and financial needs
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Info className="h-4 w-4" />
                  Help
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Understanding Bursaries & Requirements
                  </DialogTitle>
                  <DialogDescription>
                    Your guide to university bursary applications and high
                    school preparation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">What are Bursaries?</h4>
                    <p>
                      Bursaries are financial assistance programs that help
                      students pay for their education. Unlike loans, bursaries
                      typically don't need to be repaid, making them an
                      excellent form of financial aid.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      For High School Students:
                    </h4>
                    <p>
                      Each bursary shows the Grade 11 and Matric marks you need
                      to achieve. Start preparing early:
                    </p>
                    <ul className="list-disc ml-4 space-y-1 mt-2">
                      <li>
                        <strong>Grade 11:</strong> Aim for 5-10% higher than the
                        minimum requirement
                      </li>
                      <li>
                        <strong>Matric:</strong> Must meet or exceed the stated
                        minimum average
                      </li>
                      <li>
                        <strong>Subject Requirements:</strong> Focus on
                        mathematics and science if required
                      </li>
                      <li>
                        <strong>NSC Requirements:</strong> Ensure you meet
                        National Senior Certificate standards
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Application Tips:
                    </h4>
                    <ul className="text-green-700 text-xs space-y-1">
                      <li>
                        • Apply early - most bursaries have strict deadlines
                      </li>
                      <li>• Start preparing documents in Grade 11</li>
                      <li>• Maintain consistent academic performance</li>
                      <li>
                        • Apply for multiple bursaries to increase chances
                      </li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search Bar Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Search Bursaries
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, provider, or field of study..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-border focus:border-green-400 focus:ring-green-400"
              />
            </div>
          </div>

          {/* Main Filters Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              Primary Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Field of Study
                </label>
                <Select
                  value={filters.fieldOfStudy || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "fieldOfStudy",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger className="h-11 border-border focus:border-green-400">
                    <SelectValue placeholder="Select field of study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All fields</SelectItem>
                    {BURSARY_FIELDS_OF_STUDY.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Province
                </label>
                <Select
                  value={filters.province || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "province",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger className="h-11 border-border focus:border-green-400">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All provinces</SelectItem>
                    {PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Min. Academic Average (%)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 65"
                  min="0"
                  max="100"
                  value={filters.minMarks || ""}
                  onChange={(e) =>
                    updateFilter(
                      "minMarks",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="h-11 border-border focus:border-green-400 focus:ring-green-400"
                />
              </div>
            </div>
          </div>

          {/* Financial & Demographics Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              Financial & Demographics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Max. Household Income (R)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 350,000"
                  min="0"
                  value={filters.maxHouseholdIncome || ""}
                  onChange={(e) =>
                    updateFilter(
                      "maxHouseholdIncome",
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="h-11 border-border focus:border-green-400 focus:ring-green-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Gender Requirements
                </label>
                <Select
                  value={filters.genderSpecific || "any"}
                  onValueChange={(value) =>
                    updateFilter(
                      "genderSpecific",
                      value === "any" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger className="h-11 border-border focus:border-green-400">
                    <SelectValue placeholder="Any gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Gender</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Race Requirements
                </label>
                <Select
                  value={filters.raceSpecific || "any"}
                  onValueChange={(value) =>
                    updateFilter(
                      "raceSpecific",
                      value === "any" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger className="h-11 border-border focus:border-green-400">
                    <SelectValue placeholder="Any race" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Race</SelectItem>
                    <SelectItem value="african">African</SelectItem>
                    <SelectItem value="coloured">Coloured</SelectItem>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Special Criteria Section removed as per requirements */}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2 border-border hover:bg-muted/50"
            >
              <AlertCircle className="h-4 w-4" />
              Clear All Filters
            </Button>
            <div className="text-sm text-muted-foreground flex items-center">
              Use filters to narrow down {filteredBursaries.length} available
              bursaries
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
        <span className="text-sm text-muted-foreground">
          Found <strong>{filteredBursaries.length}</strong> university bursaries
        </span>
        {filteredBursaries.length > 0 && (
          <Badge variant="outline">
            {
              filteredBursaries.filter((b) => b.requirements?.financialNeed)
                .length
            }{" "}
            need-based
          </Badge>
        )}
      </div>

      {/* Bursary List (simplified) */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {filteredBursaries.map((bursary) => {
          const applicationStatus = getApplicationStatus(bursary.applicationDeadline);
          return (
            <div
              key={bursary.id}
              className="p-4 sm:p-5 border-b last:border-b-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 truncate">{bursary.name}</span>
                  <Badge variant={applicationStatus.status === 'open' ? 'default' : applicationStatus.status === 'closing' ? 'destructive' : 'secondary'}>
                    {applicationStatus.message}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{bursary.provider}</div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{bursary.description}</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">{bursary.amount}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-sm text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="whitespace-nowrap">{bursary.applicationDeadline}</span>
                </div>
                {bursary.website && (
                  <a
                    href={bursary.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3" /> Apply
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredBursaries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bursaries found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters to find more bursaries.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Application deadlines and requirements may
          change. Always verify information directly with the bursary provider
          before applying. Start your applications early to avoid missing
          deadlines.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EnhancedBursaryListing;
