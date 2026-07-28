/**
 * ip-extractor.spec.ts
 *
 * Unit tests for extractIps().
 * Run with:  npx ng test  (or  npx jest  if Jest is configured)
 */

import { extractIps } from './ip-extractor';

describe('extractIps()', () => {

  // ── Empty / null / undefined inputs ──────────────────────────────────────

  it('returns nulls for null input', () => {
    expect(extractIps(null)).toEqual({ privateIp: null, publicIp: null });
  });

  it('returns nulls for undefined input', () => {
    expect(extractIps(undefined)).toEqual({ privateIp: null, publicIp: null });
  });

  it('returns nulls for empty string', () => {
    expect(extractIps('')).toEqual({ privateIp: null, publicIp: null });
  });

  it('returns nulls for whitespace-only string', () => {
    expect(extractIps('   \n  ')).toEqual({ privateIp: null, publicIp: null });
  });

  it('returns nulls when no pattern matches', () => {
    expect(extractIps('no relevant content here')).toEqual({ privateIp: null, publicIp: null });
  });

  // ── Juniper patterns ─────────────────────────────────────────────────────

  it('extracts Juniper private IP', () => {
    const output = `
      interfaces {
        ge-0/0/0 {
          unit 0 {
            family inet address 192.168.10.5/24;
          }
        }
      }
    `;
    expect(extractIps(output)).toEqual({ privateIp: '192.168.10.5', publicIp: null });
  });

  it('extracts Juniper public IP', () => {
    const output = `
      routing-options {
        static {
          route 203.0.113.1/32 next-hop 10.0.0.1;
        }
      }
    `;
    expect(extractIps(output)).toEqual({ privateIp: null, publicIp: '203.0.113.1' });
  });

  it('extracts both Juniper IPs', () => {
    const output = `
      family inet address 10.51.2.14/30;
      routing-options static route 85.120.44.2/32 next-hop 10.51.2.13;
    `;
    expect(extractIps(output)).toEqual({ privateIp: '10.51.2.14', publicIp: '85.120.44.2' });
  });

  // ── Huawei patterns ───────────────────────────────────────────────────────

  it('extracts Huawei private IP (skipping route-static line)', () => {
    const output = [
      ' ip route-static vpn-instance SOMEVPN 10.200.1.1 255.255.255.0',
      ' ip address 192.168.50.2 255.255.255.0',
    ].join('\n');
    expect(extractIps(output)).toEqual({ privateIp: '192.168.50.2', publicIp: '10.200.1.1' });
  });

  it('does NOT pick ip address from a route-static line as private IP', () => {
    const output = ' ip route-static vpn-instance VPN1 172.16.0.1 255.255.255.0\n';
    // route-static line must be excluded; no standalone "ip address" line present
    expect(extractIps(output)).toEqual({ privateIp: null, publicIp: '172.16.0.1' });
  });

  it('extracts both Huawei IPs', () => {
    const output = [
      ' ip address 10.20.30.40 255.255.255.0',
      ' ip route-static vpn-instance CLIENT_VPN 203.0.113.50 255.255.255.255',
    ].join('\n');
    expect(extractIps(output)).toEqual({ privateIp: '10.20.30.40', publicIp: '203.0.113.50' });
  });

  // ── Juniper takes priority over Huawei when both patterns present ─────────

  it('prefers Juniper over Huawei when both patterns are present', () => {
    const output = [
      'family inet address 10.1.1.1/24;',
      ' ip address 10.2.2.2 255.255.255.0',
    ].join('\n');
    const result = extractIps(output);
    // Juniper matched first, so we should get the Juniper private IP
    expect(result.privateIp).toBe('10.1.1.1');
  });
});
