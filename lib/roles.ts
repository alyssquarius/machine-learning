/**
 * Sistem Role untuk AutoBuyCars
 */

export const ROLES = {
  ADMIN: "admin",
  DEALER: "dealer",
  BUYER: "buyer",
  GUEST: "guest",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface Permission {
  // Listing Management
  canCreateListing: boolean;
  canEditOwnListing: boolean;
  canEditAnyListing: boolean;
  canDeleteOwnListing: boolean;
  canDeleteAnyListing: boolean;
  canApproveListing: boolean;
  canRejectListing: boolean;

  // Transaction
  canMakeOffer: boolean;
  canAcceptOffer: boolean;
  canRejectOffer: boolean;
  canBuyCar: boolean;
  canViewOwnTransactions: boolean;
  canViewAllTransactions: boolean;

  // User Management
  canViewUsers: boolean;
  canEditUsers: boolean;
  canBanUsers: boolean;
  canVerifyDealer: boolean;

  // Analytics & Reports
  canViewOwnAnalytics: boolean;
  canViewAllAnalytics: boolean;
  canExportData: boolean;

  // Communication
  canContactSeller: boolean;
  canReceiveOffers: boolean;
  canSendMessages: boolean;

  // System
  canAccessDashboard: boolean;
  canChangeSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, Permission> = {
  // ADMIN - Full access ke seluruh sistem
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

  // DEALER - Mode penjual; verifikasi merupakan atribut terpisah.
  dealer: {
    canCreateListing: true,
    canEditOwnListing: true,
    canEditAnyListing: false,
    canDeleteOwnListing: true,
    canDeleteAnyListing: false,
    canApproveListing: false,
    canRejectListing: false,
    canMakeOffer: true, // Dealer juga bisa menawar mobil
    canAcceptOffer: true, // Bisa terima penawaran untuk listing sendiri
    canRejectOffer: true,
    canBuyCar: true, // Dealer bisa beli mobil
    canViewOwnTransactions: true,
    canViewAllTransactions: false,
    canViewUsers: false,
    canEditUsers: false,
    canBanUsers: false,
    canVerifyDealer: false,
    canViewOwnAnalytics: true,
    canViewAllAnalytics: false,
    canExportData: true, // Export data sendiri
    canContactSeller: true, // Bisa kontak seller lain
    canReceiveOffers: true,
    canSendMessages: true,
    canAccessDashboard: true,
    canChangeSettings: false,
  },

  // BUYER - User biasa yang ingin beli mobil
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

  // GUEST - Belum login, hanya bisa lihat
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

/**
 * Get permissions for a role
 */
export function getPermissions(role: Role): Permission {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.guest;
}

/**
 * Check if role has specific permission
 */
export function hasPermission(
  role: Role,
  permission: keyof Permission,
): boolean {
  const perms = getPermissions(role);
  return perms[permission];
}

/**
 * Check if user can perform action
 */
export function canPerformAction(
  userRole: Role,
  action: keyof Permission,
  options?: {
    isOwner?: boolean; // Apakah user adalah pemilik resource
    targetRole?: Role; // Role dari target (untuk user management)
  },
): boolean {
  const perms = getPermissions(userRole);

  // Special case: owner check
  if (action === "canEditOwnListing" || action === "canDeleteOwnListing") {
    if (options?.isOwner !== true && !(action === "canDeleteOwnListing" ? perms.canDeleteAnyListing : perms.canEditAnyListing)) {
      return false;
    }
    return perms[action];
  }

  if (action === "canAcceptOffer" || action === "canRejectOffer") {
    return perms[action] && (userRole === "admin" || options?.isOwner === true);
  }

  // Special case: role hierarchy (admin > dealer > buyer > guest)
  if (action === "canEditUsers" || action === "canBanUsers") {
    if (options?.targetRole) {
      const hierarchy: Record<Role, number> = {
        admin: 4,
        dealer: 3,
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

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    admin: "Administrator",
    dealer: "Dealer/Penjual",
    buyer: "Pembeli",
    guest: "Pengunjung",
  };
  return names[role] || "Unknown";
}

/**
 * Get role description
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    admin: "Akses penuh ke seluruh sistem, dapat mengelola user dan listing",
    dealer: "Dapat menjual mobil dan mengelola listing sendiri",
    buyer: "Dapat membeli mobil dan membuat penawaran",
    guest: "Hanya dapat melihat listing (belum login)",
  };
  return descriptions[role] || "";
}

/**
 * Get available role transitions (untuk upgrade/downgrade role)
 */
export function getAvailableRoleTransitions(currentRole: Role): Role[] {
  // Guest -> Buyer (register)
  // Buyer -> Dealer (mode penjual mandiri; tidak memberikan status verified)
  // Dealer -> Buyer (downgrade)
  // Admin tidak bisa diubah (harus dari database)

  const transitions: Record<Role, Role[]> = {
    guest: ["buyer"],
    buyer: ["dealer"],
    dealer: ["buyer"],
    admin: [], // Admin tidak bisa diubah via UI
  };

  return transitions[currentRole] || [];
}
