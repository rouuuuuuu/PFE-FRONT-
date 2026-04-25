import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, NgZone, Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { forkJoin } from 'rxjs';

// D3 types only (no runtime import at top level — avoids SSR navigator errors)
import type * as D3 from 'd3';

interface TopoNode {
  id: string;
  name: string;
  ip: string;
  vendor: string;
  alarm: string;
  type: 'router' | 'switch';
  // D3 simulation fields (added at runtime)
  x?: number; y?: number; fx?: number | null; fy?: number | null;
  vx?: number; vy?: number; index?: number;
}

interface TopoLink {
  source: string | TopoNode;
  target: string | TopoNode;
  alarm: string;
  rate: string;
}

@Component({
  selector: 'app-network-topology',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './network-topology.component.html',
  styleUrl:    './network-topology.component.css'
})
export class NetworkTopologyComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('svgContainer') svgRef!: ElementRef<SVGElement>;

  loading  = true;
  error    = '';
  nodes: TopoNode[] = [];
  links: TopoLink[] = [];

  selectedNode: TopoNode | null = null;
  selectedNodeLinks: TopoLink[] = [];

  totalNodes    = 0;
  totalLinks    = 0;
  activeAlarms  = 0;
  criticalAlarms = 0;

  private simulation: any;
  private refreshTimer: any;
  private ro: ResizeObserver | null = null;

  readonly ALARM_COLORS: Record<string, string> = {
    normal:   '#4caf50',
    warning:  '#ffc107',
    minor:    '#ff9800',
    major:    '#f44336',
    critical: '#ff1744',
    none:     '#555'
  };

  readonly ALARM_SEVERITY: Record<string, number> = {
    none: 0, normal: 1, warning: 2, minor: 3, major: 4, critical: 5
  };

  constructor(
    private api: ApiService,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit()  { this.loadData(); }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ro = new ResizeObserver(() => {
      if (!this.loading && this.nodes.length) this.zone.run(() => this.renderGraph());
    });
    this.ro.observe(this.svgRef.nativeElement.parentElement!);

    this.refreshTimer = setInterval(() => this.zone.run(() => this.loadData(false)), 30_000);
  }

  ngOnDestroy() {
    this.simulation?.stop();
    clearInterval(this.refreshTimer);
    this.ro?.disconnect();
  }

  // ── Data loading ────────────────────────────────────────────────────────────
  loadData(showSpinner = true) {
    if (showSpinner) this.loading = true;

    forkJoin({
      routers: this.api.getRouters(),
      links:   this.api.getBackhaulLinks()
    }).subscribe({
      next: ({ routers, links }) => {
        const routerList: any[] = Array.isArray(routers) ? routers : (routers.results || []);
        const linkList:   any[] = Array.isArray(links)   ? links   : (links.results   || []);

        const nodeMap = new Map<string, TopoNode>();
        routerList.forEach((r: any) => {
          const id = r.name || r.loopback_ip;
          nodeMap.set(id, {
            id, name: r.name || id,
            ip: r.loopback_ip || '',
            vendor: (r.vendor || '').toLowerCase(),
            alarm: 'none', type: 'router'
          });
        });

        const topoLinks: TopoLink[] = [];
        linkList.forEach((l: any) => {
          const src  = l.source_ne;
          const tgt  = l.sink_ne;
          const alrm = (l.alarm_severity || 'normal').toLowerCase();

          if (!nodeMap.has(src)) nodeMap.set(src, { id: src, name: src, ip: '', vendor: '', alarm: 'none', type: 'router' });
          if (!nodeMap.has(tgt)) nodeMap.set(tgt, { id: tgt, name: tgt, ip: '', vendor: '', alarm: 'none', type: 'router' });

          const srcNode = nodeMap.get(src)!;
          const tgtNode = nodeMap.get(tgt)!;
          if ((this.ALARM_SEVERITY[alrm] ?? 0) > (this.ALARM_SEVERITY[srcNode.alarm] ?? 0)) srcNode.alarm = alrm;
          if ((this.ALARM_SEVERITY[alrm] ?? 0) > (this.ALARM_SEVERITY[tgtNode.alarm] ?? 0)) tgtNode.alarm = alrm;

          topoLinks.push({ source: src, target: tgt, alarm: alrm, rate: l.link_level || '' });
        });

        this.nodes = Array.from(nodeMap.values());
        this.links = topoLinks;

        this.totalNodes     = this.nodes.length;
        this.totalLinks     = this.links.length;
        this.activeAlarms   = this.nodes.filter(n => n.alarm !== 'none' && n.alarm !== 'normal').length;
        this.criticalAlarms = this.nodes.filter(n => n.alarm === 'critical' || n.alarm === 'major').length;

        this.loading = false;
        setTimeout(() => this.renderGraph(), 50);
      },
      error: err => {
        this.error = 'Failed to load topology data.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // ── D3 rendering (dynamic import → never runs on SSR) ──────────────────────
  async renderGraph() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.svgRef) return;

    // Dynamic import keeps D3 out of the SSR bundle
    const d3 = await import('d3');

    const container = this.svgRef.nativeElement.parentElement!;
    const W = container.clientWidth  || 900;
    const H = container.clientHeight || 600;

    d3.select(this.svgRef.nativeElement).selectAll('*').remove();
    this.simulation?.stop();

    const svg = d3.select(this.svgRef.nativeElement)
      .attr('width',  W)
      .attr('height', H);

    // Arrow markers
    const defs = svg.append('defs');
    Object.entries(this.ALARM_COLORS).forEach(([alarm, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${alarm}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 22).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', color);
    });

    // Zoom/pan group
    const g = svg.append('g');
    svg.call(
      d3.zoom<SVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event: any) => g.attr('transform', event.transform))
    );

    // Grid background
    const gridG = g.append('g');
    for (let x = 0; x < W * 4; x += 40)
      gridG.append('line').attr('x1', x).attr('y1', -H).attr('x2', x).attr('y2', H * 4)
        .attr('stroke', 'rgba(255,255,255,0.03)').attr('stroke-width', 1);
    for (let y = 0; y < H * 4; y += 40)
      gridG.append('line').attr('x1', -W).attr('y1', y).attr('x2', W * 4).attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.03)').attr('stroke-width', 1);

    // Clone data for D3 mutation
    const nodes: TopoNode[] = this.nodes.map(n => ({ ...n }));
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const links: any[] = this.links.map(l => ({
      ...l,
      source: nodeById.get(l.source as string) ?? l.source,
      target: nodeById.get(l.target as string) ?? l.target
    }));

    // Link lines
    const linkEl = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('stroke', (d: any) => this.ALARM_COLORS[d.alarm] || '#555')
      .attr('stroke-width', (d: any) => d.alarm === 'critical' ? 2.5 : 1.5)
      .attr('stroke-opacity', 0.7)
      .attr('marker-end', (d: any) => `url(#arrow-${d.alarm})`);

    // Node groups
    const nodeEl = g.append('g').selectAll<SVGGElement, TopoNode>('g')
      .data(nodes).join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, TopoNode>()
          .on('start', (event, d) => {
            if (!event.active) this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag',  (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end',   (event, d) => {
            if (!event.active) this.simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (_: any, d: TopoNode) => {
        this.zone.run(() => {
          this.selectedNode = d;
          this.selectedNodeLinks = this.links.filter((l: any) =>
            (typeof l.source === 'string' ? l.source : (l.source as TopoNode).id) === d.id ||
            (typeof l.target === 'string' ? l.target : (l.target as TopoNode).id) === d.id
          );
        });
      });

    // Glow ring
    nodeEl.append('circle').attr('r', 18).attr('fill', 'none')
      .attr('stroke', (d: TopoNode) => this.ALARM_COLORS[d.alarm])
      .attr('stroke-width', 2).attr('stroke-opacity', 0.5)
      .attr('class', (d: TopoNode) => (d.alarm === 'critical' || d.alarm === 'major') ? 'pulse-ring' : '');

    // Main circle
    nodeEl.append('circle').attr('r', 13)
      .attr('fill', (d: TopoNode) => d.vendor === 'huawei' ? '#1a1a2e' : '#0d1b2a')
      .attr('stroke', (d: TopoNode) => this.ALARM_COLORS[d.alarm]).attr('stroke-width', 2);

    // Vendor dot
    nodeEl.append('circle').attr('r', 5)
      .attr('fill', (d: TopoNode) => d.vendor === 'huawei' ? '#FF7900' : '#5b9bf8');

    // Label
    nodeEl.append('text').attr('dy', 26).attr('text-anchor', 'middle')
      .attr('font-size', '9px').attr('font-family', 'Outfit, sans-serif').attr('fill', '#aaa')
      .text((d: TopoNode) => d.name.length > 14 ? d.name.slice(0, 13) + '…' : d.name);

    // Force simulation
    this.simulation = d3.forceSimulation(nodes)
      .force('link',      d3.forceLink(links).id((d: any) => d.id).distance(120).strength(0.6))
      .force('charge',    d3.forceManyBody().strength(-350))
      .force('center',    d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(28))
      .on('tick', () => {
        linkEl
          .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
        nodeEl.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  alarmColor(alarm: string) { return this.ALARM_COLORS[alarm] || '#555'; }
  closePanel()              { this.selectedNode = null; }

  getLinkPeer(peer: string | TopoNode | null | undefined): string {
    if (!peer) return '?';
    if (typeof peer === 'string') return peer;
    return (peer as TopoNode).id ?? '?';
  }

  get statsNodes()    { return this.totalNodes;    }
  get statsLinks()    { return this.totalLinks;     }
  get statsAlarms()   { return this.activeAlarms;   }
  get statsCritical() { return this.criticalAlarms; }
}
