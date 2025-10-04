import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PRIVATE_INSTITUTIONS } from "@/constants/private-institutions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Search, ExternalLink, Globe } from "lucide-react";

const PrivateInstitutionExplorer = () => {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [showAll, setShowAll] = useState(false);

  const LEVEL_OPTIONS = [
    "Bachelor",
    "Honours",
    "Master's",
    "PhD",
    "Diploma",
    "Higher Certificate",
    "Certificate",
    "Postgraduate Diploma",
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lev = level.trim().toLowerCase();
    return PRIVATE_INSTITUTIONS.filter((inst) => {
      const inName = q ? inst.name.toLowerCase().includes(q) : true;
      const inAbbr = q ? (inst.abbreviation?.toLowerCase().includes(q) ?? false) : true;
      const inProgName = q ? (inst.programs?.some((p) => p.name.toLowerCase().includes(q)) ?? false) : true;
      const matchesQuery = inName || inAbbr || inProgName;

      const matchesLevel = lev
        ? (inst.programs?.some((p) => {
            const t = `${p.qualification || p.type || ""}`.toLowerCase();
            return (
              t.includes(lev) ||
              (lev === "master's" && (t.includes("masters") || t.includes("master")))
            );
          }) ?? false)
        : true;

      return matchesQuery && matchesLevel;
    });
  }, [query, level]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-book-100 text-book-800 px-4 py-2 rounded-full text-sm font-medium">
          <Building className="w-4 h-4" />
          Accredited Private Institutions
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Private Institutions</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore accredited private institutions across South Africa. Each profile mirrors our university pages and lists all available programs.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm flex-1">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search institutions or programs"
              className="flex-1 bg-transparent outline-none text-sm"
              aria-label="Search institutions or programs"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select value={level} onValueChange={(v) => setLevel(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                {LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {(showAll ? filtered : filtered.slice(0, 9)).map((inst) => (
            <Card key={inst.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:border-book-200">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 bg-white border-2 border-book-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {inst.logo ? (
                      <img src={inst.logo} alt={`${inst.name} logo`} className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-book-500 to-book-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {(inst.abbreviation || inst.name.substring(0, 3)).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg line-clamp-2">{inst.name}</CardTitle>
                    {inst.locations?.length ? (
                      <CardDescription className="mt-1 line-clamp-1">
                        {inst.locations.join(" • ")}
                      </CardDescription>
                    ) : inst.contact?.website ? (
                      <CardDescription className="mt-1 line-clamp-1">
                        {inst.contact.website.replace(/^https?:\/\//, "")}
                      </CardDescription>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-book-100 text-book-800 border-book-200">
                    {inst.programs?.length || 0} programs
                  </Badge>
                  {inst.accreditation?.length ? (
                    <Badge variant="outline" className="border-book-200 text-book-700 bg-book-50">
                      Accredited
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link to={`/private-institution/${inst.id}`} className="sm:flex-1">
                    <Button variant="outline" className="w-full hover:bg-book-50 hover:border-book-300 text-book-600 border-book-200">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </Link>
                  {inst.contact?.website && (
                    <a href={inst.contact.website} target="_blank" rel="noopener noreferrer" className="sm:flex-1">
                      <Button variant="outline" className="w-full border-book-200 text-book-600 hover:bg-book-50">
                        <Globe className="w-4 h-4 mr-2" />
                        Official Website
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {!showAll && filtered.length > 9 && (
          <div className="flex justify-center">
            <Button onClick={() => setShowAll(true)} variant="outline" className="mt-2">
              View More
            </Button>
          </div>
        )}
        </>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-10 text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium">
              <Search className="w-4 h-4" />
              No results
            </div>
            <h3 className="text-xl font-semibold">No private institutions available yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We’re adding accredited private institutions. Check back soon or follow us for updates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PrivateInstitutionExplorer;
