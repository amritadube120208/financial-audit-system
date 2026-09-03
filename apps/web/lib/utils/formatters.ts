import { format, parseISO } from "date-fns";

export function formatINR(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactINR(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }
  return formatINR(value);
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "—";
  try {
    const d = dateString.includes("T") ? parseISO(dateString) : new Date(dateString);
    return format(d, "dd MMM yyyy");
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return "—";
  try {
    const d = dateString.includes("T") ? parseISO(dateString) : new Date(dateString);
    return format(d, "dd MMM yyyy, HH:mm");
  } catch {
    return dateString;
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function truncateHash(hash: string, length = 8): string {
  if (!hash) return "—";
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}
