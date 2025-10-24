import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { School, GraduationCap, Search } from "lucide-react";
import { UNIVERSITY_YEARS, SOUTH_AFRICAN_UNIVERSITIES_SIMPLE } from "@/constants/universities";
import { PRIVATE_INSTITUTIONS } from "@/constants/private-institutions";
import { CREATE_LISTING_CATEGORIES } from "@/constants/createListingCategories";
import { BookFormData } from "@/types/book";

interface BookTypeSectionProps {
  bookType: "school" | "university";
  formData: BookFormData;
  errors: Record<string, string>;
  onBookTypeChange: (type: "school" | "university") => void;
  onSelectChange: (name: string, value: string) => void;
}

export const BookTypeSection = ({
  bookType,
  formData,
  errors,
  onBookTypeChange,
  onSelectChange,
}: BookTypeSectionProps) => {
  const [universitySearchQuery, setUniversitySearchQuery] = useState("");

  // Use shared category list across app
  // Imported from constants to keep Create Listing and Books filters in sync
  const categories = CREATE_LISTING_CATEGORIES.slice().sort((a, b) => a.localeCompare(b));

  const conditions = ["New", "Good", "Better", "Average", "Below Average"];

  const grades = [
    "N/A",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "Study Guides",
  ];

  // Combine public universities and private institutions
  const allUniversities = useMemo(() => {
    const publicUnis = SOUTH_AFRICAN_UNIVERSITIES_SIMPLE.map((uni) => ({
      id: uni.id,
      name: uni.name,
      abbreviation: uni.abbreviation,
      type: "public" as const,
    }));

    const privateUnis = PRIVATE_INSTITUTIONS.map((inst) => ({
      id: inst.id,
      name: inst.name,
      abbreviation: inst.abbreviation || inst.name.substring(0, 3).toUpperCase(),
      type: "private" as const,
    }));

    return [...publicUnis, ...privateUnis].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter universities based on search query
  const filteredUniversities = useMemo(() => {
    if (!universitySearchQuery.trim()) {
      return allUniversities;
    }

    const query = universitySearchQuery.toLowerCase();
    return allUniversities.filter(
      (uni) =>
        uni.name.toLowerCase().includes(query) ||
        uni.abbreviation.toLowerCase().includes(query)
    );
  }, [universitySearchQuery, allUniversities]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">
          Book Type <span className="text-red-500">*</span>
        </Label>
        <div className="mt-2 inline-flex rounded-lg overflow-hidden border border-gray-200">
          <button
            type="button"
            onClick={() => onBookTypeChange("school")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
              bookType === "school"
                ? "bg-book-600 text-white shadow-inner"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            aria-pressed={bookType === "school"}
          >
            <School className="h-4 w-4" />
            School
          </button>
          <button
            type="button"
            onClick={() => onBookTypeChange("university")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-l ${
              bookType === "university"
                ? "bg-book-600 text-white shadow-inner"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            aria-pressed={bookType === "university"}
          >
            <GraduationCap className="h-4 w-4" />
            University
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="category" className="text-base font-medium">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) => onSelectChange("category", value)}
        >
          <SelectTrigger className={errors.category ? "border-red-500" : ""}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500 mt-1">{errors.category}</p>
        )}
      </div>

      {bookType === "school" && (
        <div>
          <Label htmlFor="curriculum" className="text-base font-medium">
            Curriculum <span className="text-gray-400">(Optional)</span>
          </Label>
          <Select
            value={(formData as any).curriculum || ""}
            onValueChange={(value) => onSelectChange("curriculum", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select curriculum (optional)" />
            </SelectTrigger>
            <SelectContent>
              {['CAPS', 'Cambridge', 'IEB'].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="condition" className="text-base font-medium">
          Condition <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.condition}
          onValueChange={(value) => onSelectChange("condition", value)}
        >
          <SelectTrigger className={errors.condition ? "border-red-500" : ""}>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            {conditions.map((condition) => (
              <SelectItem key={condition} value={condition}>
                {condition}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.condition && (
          <p className="text-sm text-red-500 mt-1">{errors.condition}</p>
        )}
      </div>

      {bookType === "school" ? (
        <div>
          <Label htmlFor="grade" className="text-base font-medium">
            Grade <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.grade}
            onValueChange={(value) => onSelectChange("grade", value)}
          >
            <SelectTrigger className={errors.grade ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a grade" />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.grade && (
            <p className="text-sm text-red-500 mt-1">{errors.grade}</p>
          )}
        </div>
      ) : (
        <>
          {/* University Year Selection - Required */}
          <div>
            <Label htmlFor="universityYear" className="text-base font-medium">
              University Year <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.universityYear || ""}
              onValueChange={(value) => onSelectChange("universityYear", value)}
            >
              <SelectTrigger className={errors.universityYear ? "border-red-500" : ""}>
                <SelectValue placeholder="Select university year" />
              </SelectTrigger>
              <SelectContent>
                {UNIVERSITY_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.universityYear && (
              <p className="text-sm text-red-500 mt-1">{errors.universityYear}</p>
            )}
          </div>

          {/* University Selection - Optional with Search */}
          <div>
            <Label htmlFor="university" className="text-base font-medium">
              University <span className="text-gray-400">(Optional)</span>
            </Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  placeholder="Search university or private institution..."
                  value={universitySearchQuery}
                  onChange={(e) => setUniversitySearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={formData.university || ""}
                onValueChange={(value) => onSelectChange("university", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select university (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {filteredUniversities.length > 0 ? (
                    filteredUniversities.map((university) => (
                      <SelectItem key={university.id} value={university.id}>
                        {university.abbreviation} - {university.name}
                        <span className="text-xs text-gray-500 ml-2">
                          ({university.type === "private" ? "Private" : "Public"})
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      No institutions found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
