export const ROLES = {
  ADMIN: "admin",
  BUYER: "buyer",
  GUEST: "guest",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface Permission {
  canCreateListing: boolean;
  canEditOwnListing: boolean;
  canEditAnyListing: boolean;
  canDeleteOwnListing: boolean;
  canDeleteAnyListing: boolean;
  canApproveListing: boolean;
  canRejectListing: boolean;

  canMakeOffer: boolean;
  canAcceptOffer: boolean;
  canRejectOffer: boolean;
  canBuyCar: boolean;
  canViewOwnTransactions: boolean;
  canViewAllTransactions: boolean;

  canViewUsers: boolean;
  canEditUsers: boolean;
  canBanUsers: boolean;
  canVerifyDealer: boolean;

  canViewOwnAnalytics: boolean;
  canViewAllAnalytics: boolean;
  canExportData: boolean;

  canContactSeller: boolean;
  canReceiveOffers: boolean;
  canSendMessages: boolean;

  canAccessDashboard: boolean;
  canChangeSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, Permission> = {
  admin: {
    canCreateListing: true,
    canEditOwnListing: true,
    canEditAnyListing: true,
    canDeleteOwnListing: true,
    canDeleteAnyListing: true,
    canApproveListing: true,
    canRejectListing: true,
    canMakeOffer: true,
    canAcceptOffer: true,
    canRejectOffer: true,
    canBuyCar: true,
    canViewOwnTransactions: true,
    canViewAllTransactions: true,
    canViewUsers: true,
    canEditUsers: true,
    canBanUsers: true,
    canVerifyDealer: true,
    canViewOwnAnalytics: true,
    canViewAllAnalytics: true,
    canExportData: true,
    canContactSeller: true,
    canReceiveOffers: true,
    canSendMessages: true,
    canAccessDashboard: true,
    canChangeSettings: true,
  },

  buyer: {
    canCreateListing: false, // Buyer tidak bisa jual
    canEditOwnListing: false,
    canEditAnyListing: false,
    canDeleteOwnListing: false,
    canDeleteAnyListing: false,
    canApproveListing: false,
    canRejectListing: false,
    canMakeOffer: true, // Bisa tawar mobil
    canAcceptOffer: false,
    canRejectOffer: false,
    canBuyCar: true, // Bisa beli mobil
    canViewOwnTransactions: true,
    canViewAllTransactions: false,
    canViewUsers: false,
    canEditUsers: false,
    canBanUsers: false,
    canVerifyDealer: false,
    canViewOwnAnalytics: true, // Analytics transaksi sendiri
    canViewAllAnalytics: false,
    canExportData: false,
    canContactSeller: true, // Bisa kontak penjual via WhatsApp
    canReceiveOffers: false,
    canSendMessages: true,
    canAccessDashboard: false, // Buyer fokus belanja di katalog, tidak butuh dashboard penjualan
    canChangeSettings: false,
  },

  guest: {
    canCreateListing: false,
    canEditOwnListing: false,
    canEditAnyListing: false,
    canDeleteOwnListing: false,
    canDeleteAnyListing: false,
    canApproveListing: false,
    canRejectListing: false,
    canMakeOffer: false,
    canAcceptOffer: false,
    canRejectOffer: false,
    canBuyCar: false,
    canViewOwnTransactions: false,
    canViewAllTransactions: false,
    canViewUsers: false,
    canEditUsers: false,
    canBanUsers: false,
    canVerifyDealer: false,
    canViewOwnAnalytics: false,
    canViewAllAnalytics: false,
    canExportData: false,
    canContactSeller: true, // Guest bisa kontak via WhatsApp (untuk lead generation)
    canReceiveOffers: false,
    canSendMessages: false,
    canAccessDashboard: false,
    canChangeSettings: false,
  },
};

export function getPermissions(role: Role): Permission {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.guest;
}

export function hasPermission(role: Role, permission: keyof Permission): boolean {
  const perms = getPermissions(role);
  return perms[permission];
}

export function canPerformAction(
  userRole: Role,
  action: keyof Permission,
  options?: {
    isOwner?: boolean; // Apakah user adalah pemilik resource
    targetRole?: Role; // Role dari target (untuk user management)
  },
): boolean {
  const perms = getPermissions(userRole);

  if (action === "canEditOwnListing" || action === "canDeleteOwnListing") {
    if (
      options?.isOwner !== true &&
      !(action === "canDeleteOwnListing" ? perms.canDeleteAnyListing : perms.canEditAnyListing)
    ) {
      return false;
    }
    return perms[action];
  }

  if (action === "canAcceptOffer" || action === "canRejectOffer") {
    return perms[action] && (userRole === "admin" || options?.isOwner === true);
  }

  // Special case: role hierarchy (admin > buyer > guest)
  if (action === "canEditUsers" || action === "canBanUsers") {
    if (options?.targetRole) {
      const hierarchy: Record<Role, number> = {
        admin: 4,
        buyer: 2,
        guest: 1,
      };
      // Tidak bisa edit user dengan role lebih tinggi atau sama
      if (hierarchy[userRole] <= hierarchy[options.targetRole]) {
        return false;
      }
    }
  }

  return perms[action];
}

export function getRoleDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    admin: "Administrator",
    buyer: "Pembeli",
    guest: "Pengunjung",
  };
  return names[role] || "Unknown";
}

export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    admin: "Akses penuh ke seluruh sistem, dapat mengelola user dan listing",
    buyer: "Dapat membeli mobil dan membuat penawaran",
    guest: "Hanya dapat melihat listing (belum login)",
  };
  return descriptions[role] || "";
}

export function getAvailableRoleTransitions(currentRole: Role): Role[] {
  // Guest -> Buyer (register)
  // Admin tidak bisa diubah (harus dari database)

  const transitions: Record<Role, Role[]> = {
    guest: ["buyer"],
    buyer: [],
    admin: [], // Admin tidak bisa diubah via UI
  };

  return transitions[currentRole] || [];
}
