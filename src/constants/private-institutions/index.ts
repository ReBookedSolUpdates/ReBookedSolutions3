import { PrivateInstitution } from "@/types/privateInstitution";

// Central registry of all private institutions. Populate with real institutions and programs.
export const PRIVATE_INSTITUTIONS: PrivateInstitution[] = [];

export const getPrivateInstitutionById = (id: string): PrivateInstitution | null => {
  return PRIVATE_INSTITUTIONS.find((i) => i.id === id) || null;
};
