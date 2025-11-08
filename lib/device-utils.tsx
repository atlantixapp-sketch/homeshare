import { Smartphone, Monitor, Tablet } from "lucide-react"

export function getDeviceType(): string {
  if (typeof window === "undefined") return "desktop"

  const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
    ? /iPad|Tablet/.test(navigator.userAgent)
      ? "tablet"
      : "mobile"
    : "desktop"

  return deviceType
}

export function getDeviceName(type: string): string {
  if (type === "mobile") return "Móvil"
  if (type === "tablet") return "Tablet"
  return "PC"
}

export function getDeviceIcon(type: string) {
  const iconStyle = { width: "1.25rem", height: "1.25rem" }

  if (type === "mobile") return <Smartphone style={iconStyle} />
  if (type === "tablet") return <Tablet style={iconStyle} />
  return <Monitor style={iconStyle} />
}
