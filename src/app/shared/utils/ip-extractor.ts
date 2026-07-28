/**
 * ip-extractor.ts
 *
 * Pure utility for extracting private/public IP addresses from provisioning
 * script output strings.  Supports two device vendor output formats:
 *   - Juniper  (family inet / routing-options static route)
 *   - Huawei   (ip address / ip route-static vpn-instance)
 *
 * Keeping this as a plain function (no Angular decorators) makes it trivially
 * unit-testable with Jest / Jasmine without any TestBed setup.
 */

export interface ExtractedIps {
  privateIp: string | null;
  publicIp:  string | null;
}

/**
 * Extracts the private IP and public IP from a provisioning script output.
 *
 * Strategy (tried in order):
 *  1. Juniper patterns
 *  2. Huawei patterns
 *  3. If nothing matches (or input is empty/null) → both fields are null.
 */
export function extractIps(scriptOutput: string | null | undefined): ExtractedIps {
  if (!scriptOutput || scriptOutput.trim() === '') {
    return { privateIp: null, publicIp: null };
  }

  // ── 1. Juniper ──────────────────────────────────────────────────────────
  //   Private IP: family inet address <IP>/<prefix>
  //   Public  IP: routing-options static route <IP>/<prefix> next-hop
  const juniperPrivateMatch = scriptOutput.match(
    /family\s+inet\s+address\s+(\d+\.\d+\.\d+\.\d+)\/\d+/
  );
  const juniperPublicMatch = scriptOutput.match(
    /routing-options\s+static\s+route\s+(\d+\.\d+\.\d+\.\d+)\/\d+\s+next-hop/
  );

  if (juniperPrivateMatch || juniperPublicMatch) {
    return {
      privateIp: juniperPrivateMatch ? juniperPrivateMatch[1] : null,
      publicIp:  juniperPublicMatch  ? juniperPublicMatch[1]  : null,
    };
  }

  // ── 2. Huawei ───────────────────────────────────────────────────────────
  //   Private IP: lines containing "ip address <IP> <mask>"
  //               but NOT lines that also contain "route-static"
  //   Public  IP: ip route-static vpn-instance <name> <IP>
  let huaweiPrivateIp: string | null = null;
  const lines = scriptOutput.split('\n');
  for (const line of lines) {
    if (line.includes('route-static')) {
      continue; // skip route-static lines for private IP matching
    }
    const m = line.match(/ip\s+address\s+(\d+\.\d+\.\d+\.\d+)\s+\d+\.\d+\.\d+\.\d+/);
    if (m) {
      huaweiPrivateIp = m[1];
      break;
    }
  }

  const huaweiPublicMatch = scriptOutput.match(
    /ip\s+route-static\s+vpn-instance\s+\S+\s+(\d+\.\d+\.\d+\.\d+)/
  );

  if (huaweiPrivateIp !== null || huaweiPublicMatch) {
    return {
      privateIp: huaweiPrivateIp,
      publicIp:  huaweiPublicMatch ? huaweiPublicMatch[1] : null,
    };
  }

  // ── 3. No pattern matched ────────────────────────────────────────────────
  return { privateIp: null, publicIp: null };
}
