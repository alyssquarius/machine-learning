import { type Role, getRoleDisplayName } from "@/lib/roles";

const ROLE_BADGE_STYLES: Record<Role, { bg: string; text: string; border: string; dot: string }> = {
  admin: {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200/80 dark:border-red-900/50",
    dot: "bg-red-500",
  },
  buyer: {
    bg: "bg-blue-50/80 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200/80 dark:border-blue-900/50",
    dot: "bg-blue-500",
  },
  guest: {
    bg: "bg-gray-100 dark:bg-zinc-800",
    text: "text-gray-700 dark:text-zinc-300",
    border: "border-gray-200 dark:border-zinc-700",
    dot: "bg-gray-400",
  },
};

export function RoleBadge({ role, className = "" }: { role: Role; className?: string }) {
  const style = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.guest;
  const name = getRoleDisplayName(role);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{name}</span>
    </span>
  );
}
