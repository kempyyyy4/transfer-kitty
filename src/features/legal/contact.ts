import { LEGAL, TO_BE_CONFIRMED } from "@/config/legal";

export const operatorName = () => LEGAL.operatorName ?? TO_BE_CONFIRMED;
export const postalAddress = () => LEGAL.postalAddress ?? TO_BE_CONFIRMED;
export const contactEmail = () => LEGAL.contactEmail ?? TO_BE_CONFIRMED;
