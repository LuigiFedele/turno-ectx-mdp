import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarDataBR(dataISO: string) {
  const data = new Date(dataISO + "T12:00:00")
  return data.toLocaleDateString("pt-BR")
}
