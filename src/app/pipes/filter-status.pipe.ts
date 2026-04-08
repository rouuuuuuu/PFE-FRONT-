import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterStatus',
  standalone: true
})
export class FilterStatusPipe implements PipeTransform {
  transform<T extends { status?: string }>(items: T[] | null | undefined, status: string): T[] {
    if (!items || !status) {
      return items ?? [];
    }

    const normalizedStatus = status.toLowerCase();
    return items.filter(item => {
      return item?.status?.toLowerCase() === normalizedStatus;
    });
  }
}
