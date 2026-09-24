export const DATA_PRIVACY_AGREEMENT_VERSION = "v1";

export const dataPrivacyAgreementSections = [
  {
    title: "Information collected",
    body: "TLMS collects the account identity, contact details, thesis-group information, appointment details, and operational records you submit or generate while using the portal.",
  },
  {
    title: "How information is used",
    body: "The information is used to verify accounts, administer logistics appointments, communicate service updates, support attendance workflows, prevent abuse, and maintain operational audit records.",
  },
  {
    title: "Who can access it",
    body: "Access is limited according to assigned roles and operational responsibilities. Authorized staff can access only the records needed to perform their logistics duties.",
  },
  {
    title: "Your responsibilities and choices",
    body: "Provide accurate information and avoid submitting sensitive details that the portal does not request. Use a verified TICAP channel to request a correction or raise a privacy concern.",
  },
] as const;
