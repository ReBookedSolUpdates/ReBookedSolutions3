export type ProgramMode = "full-time" | "part-time" | "online" | "hybrid" | "contact" | "distance" | "blended";

export type ProgramType =
  | "short-course"
  | "certificate"
  | "advanced-certificate"
  | "higher-certificate"
  | "diploma"
  | "advanced-diploma"
  | "bachelor"
  | "honours"
  | "postgraduate-certificate"
  | "postgraduate-diploma"
  | "masters"
  | "phd";

export interface ProgramAccreditation {
  body: string;
  accreditationId?: string;
  status?: string;
}

export interface ProgramResource {
  title: string;
  url: string;
  description?: string;
}

export interface Program {
  id: string;
  name: string;
  type: ProgramType;
  qualification?: string;
  duration?: string;
  mode?: ProgramMode | ProgramMode[];
  description?: string;
  campus?: string;
  faculty?: string;
  website?: string;
  credits?: number;
  nqfLevel?: number | string;
  accreditation?: ProgramAccreditation[];
  resources?: ProgramResource[];
}

export interface AccreditationInfo {
  body: string;
  accreditationId?: string;
  status?: string;
}

export interface InstitutionContact {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface PrivateInstitution {
  id: string;
  name: string;
  abbreviation?: string;
  logo?: string;
  bannerImage?: string;
  description?: string;
  locations?: string[];
  contact?: InstitutionContact;
  accreditation?: AccreditationInfo[];
  programs: Program[];
}
