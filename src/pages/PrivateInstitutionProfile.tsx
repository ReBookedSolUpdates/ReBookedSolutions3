import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getPrivateInstitutionById } from "@/constants/private-institutions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, ExternalLink, ArrowLeft, GraduationCap } from "lucide-react";
import SEO from "@/components/SEO";
import CampusNavbar from "@/components/CampusNavbar";

const PrivateInstitutionProfile = () => {
  const { id } = useParams<{ id: string }>();
  const institution = useMemo(() => (id ? getPrivateInstitutionById(id) : null), [id]);

  if (!institution) {
    return (
      <>
        <SEO title="Institution Not Found" description="The requested private institution was not found." url={window.location.href} />
        <CampusNavbar />
        <div className="container mx-auto px-4 py-10">
          <Card className="border-0 shadow-sm">
            <CardContent className="py-10 text-center space-y-4">
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium">
                <Building className="w-4 h-4" />
                Private Institution
              </div>
              <h1 className="text-2xl font-bold">Institution not found</h1>
              <p className="text-gray-600">The institution you’re looking for doesn’t exist or hasn’t been added yet.</p>
              <div className="flex justify-center">
                <Link to="/university-info?tool=private-institutions">
                  <Button variant="outline" className="hover:bg-book-50 hover:border-book-300 text-book-600 border-book-200">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Private Institutions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`${institution.name} – Private Institution Profile`}
        description={institution.description || `${institution.name} private institution profile`}
        url={window.location.href}
      />
      <CampusNavbar />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white border-2 border-book-200 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {institution.logo ? (
                    <img src={institution.logo} alt={`${institution.name} logo`} className="w-14 h-14 object-contain" />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-book-500 to-book-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {(institution.abbreviation || institution.name.substring(0, 3)).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <div className="inline-flex items-center gap-2 bg-book-100 text-book-800 px-3 py-1.5 rounded-full text-xs font-medium">
                      <Building className="w-3.5 h-3.5" />
                      Private Institution
                    </div>
                    {institution.accreditation?.length ? (
                      <Badge variant="outline" className="border-book-200 text-book-700 bg-book-50">
                        Accredited
                      </Badge>
                    ) : null}
                  </div>
                  <CardTitle className="text-2xl">{institution.name}</CardTitle>
                  {institution.contact?.website ? (
                    <CardDescription className="mt-1">
                      <a
                        href={institution.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-book-600 hover:text-book-800 underline"
                      >
                        Visit website <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </CardDescription>
                  ) : null}
                </div>
                <div className="flex-shrink-0">
                  <Link to="/university-info?tool=private-institutions">
                    <Button variant="outline" className="hover:bg-book-50 hover:border-book-300 text-book-600 border-book-200">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          {institution.description ? (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>About</CardTitle>
                {institution.locations?.length ? (
                  <CardDescription>{institution.locations.join(" • ")}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{institution.description}</p>
              </CardContent>
            </Card>
          ) : null}

          {/* Programs */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-book-600" />
                Programs
              </CardTitle>
              <CardDescription>All programs offered by {institution.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {institution.programs?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institution.programs.map((p) => (
                    <Card key={p.id} className="border border-gray-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <CardDescription className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary" className="bg-book-100 text-book-800 border-book-200 capitalize">
                            {p.type.replace(/-/g, " ")}
                          </Badge>
                          {p.mode ? (
                            <Badge variant="outline" className="border-book-200 text-book-700 bg-book-50 capitalize">
                              {Array.isArray(p.mode) ? p.mode.join(" • ") : p.mode}
                            </Badge>
                          ) : null}
                          {p.duration ? (
                            <Badge variant="outline" className="border-gray-200 text-gray-700">
                              {p.duration}
                            </Badge>
                          ) : null}
                        </CardDescription>
                      </CardHeader>
                      {p.description ? (
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{p.description}</p>
                        </CardContent>
                      ) : null}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-gray-600">No programs have been added for this institution yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PrivateInstitutionProfile;
