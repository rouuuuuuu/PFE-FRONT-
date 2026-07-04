import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'causeLabel',
  standalone: true,
  pure: true
})
export class CauseLabelPipe implements PipeTransform {

  private labels: Record<string, string> = {
    ssh_timeout:      'SSH Timeout',
    connect_closed:   'Connection Closed',
    dirty_candidate:  'Dirty Candidate',
    vrf_conflict:     'VRF Conflict',
    interface_down:   'Interface Down',
    script_mismatch:  'Script Mismatch',
    bgp_unreachable:  'BGP Unreachable',
    auth_failure:     'Auth Failure',
    qos_push_failure: 'QoS Push Failure',
    unknown:          'Unknown',
  };

  transform(value: string | null | undefined): string {
    if (!value) return 'Unknown';
    return this.labels[value] ?? value;
  }
}
