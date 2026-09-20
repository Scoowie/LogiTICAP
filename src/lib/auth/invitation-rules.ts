type InvitationCandidate = {
  email: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: Date;
};

type InvitationProfile = {
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "LOGISTICS_MEMBER" | "STUDENT";
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
};

export function canAcceptStaffInvitation(
  profile: InvitationProfile,
  invitation: InvitationCandidate,
  now = new Date(),
) {
  return (
    profile.status === "ACTIVE" &&
    profile.role === "STUDENT" &&
    profile.email.trim().toLowerCase() ===
      invitation.email.trim().toLowerCase() &&
    invitation.status === "PENDING" &&
    invitation.expiresAt > now
  );
}
