import { PrivateInstitution } from "@/types/privateInstitution";
import { PRIVATE_GROUP_1 } from "./data/group1";
import { PRIVATE_GROUP_2 } from "./data/group2";
import { PRIVATE_GROUP_3 } from "./data/group3";
import { PRIVATE_GROUP_4 } from "./data/group4";
import { PRIVATE_GROUP_5 } from "./data/group5";
import { PRIVATE_GROUP_6 } from "./data/group6";

export const PRIVATE_INSTITUTIONS: PrivateInstitution[] = [
  ...PRIVATE_GROUP_1,
  ...PRIVATE_GROUP_2,
  ...PRIVATE_GROUP_3,
  ...PRIVATE_GROUP_4,
  ...PRIVATE_GROUP_5,
  ...PRIVATE_GROUP_6,
];

export const getPrivateInstitutionById = (id: string): PrivateInstitution | null => {
  return PRIVATE_INSTITUTIONS.find((i) => i.id === id) || null;
};
