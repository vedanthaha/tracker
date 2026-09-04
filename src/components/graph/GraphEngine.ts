import * as d3 from "d3";
import { ThemeDefinition } from "../../lib/theme/types";

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return `rgba(128,128,128,${alpha})`;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface GNode extends d3.SimulationNodeDatum {
  id: string;
  type: "task" | "note" | "category";
  label: string;
  sublabel?: string;
  category: string;
  color: string;
  r: number;
  completed?: boolean;
  pinned?: boolean;
  originalId?: string | number;
}

export interface GEdge extends d3.SimulationLinkDatum<GNode> {
  id: string;
  source: string | GNode;
  target: string | GNode;
  kind: "cat" | "linked";
}

export class GraphEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private simulation: d3.Simulation<GNode, GEdge>;
  private zoomBehavior!: d3.ZoomBehavior<HTMLCanvasElement, unknown>;
  public transform: d3.ZoomTransform = d3.zoomIdentity;
  
  public hoveredId: string | null = null;
  public selectedId: string | null = null;
  public onSelect?: (nodeId: string | null) => void;
  
  private nodes: GNode[] = [];
  private links: GEdge[] = [];
  
  private rafPending = false;
  private hasAutoFit = false;
  private isDragging = false;
  
  private theme: ThemeDefinition | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    
    // Obsidian-style physics configuration
    this.simulation = d3.forceSimulation<GNode, GEdge>()
      .alphaDecay(0.015) // Slower cooldown = more fluid, longer settling animation
      .force("link", d3.forceLink<GNode, GEdge>().id(d => d.id).distance(60).strength(0.8)) // Tight, strong springs
      .force("charge", d3.forceManyBody().strength(-400).distanceMax(600)) // Strong long-range repulsion
      .force("center", d3.forceCenter(canvas.width / 2, canvas.height / 2).strength(0.05)) // Gentle gravity towards the center
      .force("collide", d3.forceCollide<GNode>().radius(d => d.r + 12).iterations(3)); // Rigid collision boundaries
      
    // Trigger render on tick
    this.simulation.on("tick", this.scheduleDraw);
    
    // Auto-fit when graph settles initially
    this.simulation.on("end", () => {
      if (!this.hasAutoFit) {
        this.hasAutoFit = true;
        this.fitToView(1000);
      }
    });
    
    this.initZoom();
    this.initDrag();
    this.initHover();
  }

  private initZoom() {
    this.zoomBehavior = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 4])
      .filter((e: MouseEvent | TouchEvent) => {
        // Prevent zoom/pan if clicking on a node
        if (e.type === "mousedown" || e.type === "touchstart") {
          const [px, py] = d3.pointer(e, this.canvas);
          const x = this.transform.invertX(px);
          const y = this.transform.invertY(py);
          for (let i = this.nodes.length - 1; i >= 0; i--) {
            const n = this.nodes[i];
            if (n.x === undefined || n.y === undefined) continue;
            const dx = x - n.x;
            const dy = y - n.y;
            if (dx * dx + dy * dy < 400) {
              return false; // Let d3.drag handle this
            }
          }
        }
        return ("button" in e ? e.button === 0 : true); // allow standard left-click drag or touch
      })
      .on("zoom", (e) => {
        this.transform = e.transform;
        this.scheduleDraw();
      });
    d3.select(this.canvas).call(this.zoomBehavior);
  }

  private initDrag() {
    const drag = d3.drag<HTMLCanvasElement, unknown>()
      .subject((e) => {
        const x = this.transform.invertX(e.x);
        const y = this.transform.invertY(e.y);
        for (let i = this.nodes.length - 1; i >= 0; i--) {
          const n = this.nodes[i];
          if (n.x === undefined || n.y === undefined) continue;
          const dx = x - n.x;
          const dy = y - n.y;
          if (dx * dx + dy * dy < 400) { // 20px hit radius
            return n;
          }
        }
        return null;
      })
      .on("start", (e) => {
        if (!e.active) this.simulation.alphaTarget(0.3).restart();
        e.subject.fx = e.subject.x;
        e.subject.fy = e.subject.y;
        this.isDragging = true;
      })
      .on("drag", (e) => {
        const [px, py] = d3.pointer(e.sourceEvent, this.canvas);
        e.subject.fx = this.transform.invertX(px);
        e.subject.fy = this.transform.invertY(py);
      })
      .on("end", (e) => {
        if (!e.active) this.simulation.alphaTarget(0);
        e.subject.fx = null;
        e.subject.fy = null;
        this.isDragging = false;
      });
      
    d3.select(this.canvas).call(drag);
  }

  private initHover() {
    d3.select(this.canvas).on("mousemove.hover", (e) => {
      if (this.isDragging) return;
      
      const [px, py] = d3.pointer(e, this.canvas);
      const x = this.transform.invertX(px);
      const y = this.transform.invertY(py);
      
      let found: string | null = null;
      for (let i = this.nodes.length - 1; i >= 0; i--) {
        const n = this.nodes[i];
        if (n.x === undefined || n.y === undefined) continue;
        const dx = x - n.x;
        const dy = y - n.y;
        if (dx * dx + dy * dy < (n.r + 5) ** 2) {
          found = n.id;
          break;
        }
      }
      
      if (this.hoveredId !== found) {
        this.hoveredId = found;
        this.canvas.style.cursor = found ? "pointer" : "default";
        this.scheduleDraw();
      }
    });

    d3.select(this.canvas).on("click", (e) => {
      if (e.defaultPrevented) return; 
      
      if (this.hoveredId) {
        this.selectedId = this.hoveredId;
        if (this.onSelect) this.onSelect(this.hoveredId);
        
        const node = this.nodes.find(n => n.id === this.selectedId);
        if (node && node.x != null && node.y != null) {
          this.focusOnNode(node.x, node.y);
        }
      } else {
        this.selectedId = null;
        if (this.onSelect) this.onSelect(null);
        this.scheduleDraw();
      }
    });
  }

  private focusOnNode(x: number, y: number) {
    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = this.canvas.width / dpr;
    const viewportHeight = this.canvas.height / dpr;
    
    const k = Math.max(1.2, this.transform.k); // zoom in slightly
    const tx = viewportWidth / 2 - x * k;
    const ty = viewportHeight / 2 - y * k;
    
    d3.select(this.canvas)
      .transition()
      .duration(750)
      .call(this.zoomBehavior.transform as any, d3.zoomIdentity.translate(tx, ty).scale(k));
  }

  public getNodes() {
    return this.nodes;
  }

  public setData(nodes: GNode[], links: GEdge[]) {
    const oldNodes = new Map(this.nodes.map(n => [n.id, n]));
    
    const dpr = window.devicePixelRatio || 1;
    const cx = (this.canvas.width / dpr) / 2;
    const cy = (this.canvas.height / dpr) / 2;
    
    nodes.forEach(n => {
      const old = oldNodes.get(n.id);
      if (old && old.x !== undefined && old.y !== undefined) {
        n.x = old.x;
        n.y = old.y;
        n.vx = old.vx;
        n.vy = old.vy;
      } else {
        // Jitter initialization near center
        n.x = cx + (Math.random() - 0.5) * 50;
        n.y = cy + (Math.random() - 0.5) * 50;
      }
    });

    this.nodes = nodes;
    this.links = links;

    this.simulation.nodes(this.nodes);
    const linkForce = this.simulation.force("link") as d3.ForceLink<GNode, GEdge>;
    linkForce.links(this.links);
    
    this.simulation.alpha(1).restart();
  }

  public setTheme(theme: ThemeDefinition) {
    this.theme = theme;
    this.scheduleDraw();
  }

  public fitToView(transitionDuration = 750) {
    if (this.nodes.length === 0) return;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const n of this.nodes) {
      if (n.x === undefined || n.y === undefined) continue;
      const r = 20; // approximate max node radius + label padding
      if (n.x - r < minX) minX = n.x - r;
      if (n.x + r > maxX) maxX = n.x + r;
      if (n.y - r < minY) minY = n.y - r;
      if (n.y + r > maxY) maxY = n.y + r;
    }

    if (minX === Infinity) return;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const graphCenterX = minX + graphWidth / 2;
    const graphCenterY = minY + graphHeight / 2;

    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = this.canvas.width / dpr;
    const viewportHeight = this.canvas.height / dpr;

    const padding = 80;
    const targetWidth = viewportWidth - padding * 2;
    const targetHeight = viewportHeight - padding * 2;

    const scaleX = targetWidth / Math.max(1, graphWidth);
    const scaleY = targetHeight / Math.max(1, graphHeight);
    
    // Clamp zoom to sensible boundaries (min 0.2x, max 1.5x)
    let k = Math.min(scaleX, scaleY);
    k = Math.max(0.2, Math.min(k, 1.5));

    const tx = viewportWidth / 2 - graphCenterX * k;
    const ty = viewportHeight / 2 - graphCenterY * k;

    const transform = d3.zoomIdentity.translate(tx, ty).scale(k);

    if (transitionDuration > 0) {
      d3.select(this.canvas)
        .transition()
        .duration(transitionDuration)
        .call(this.zoomBehavior.transform as any, transform);
    } else {
      d3.select(this.canvas).call(this.zoomBehavior.transform as any, transform);
    }
  }

  public scheduleDraw = () => {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.draw();
    });
  }

  private draw() {
    // Reset transform completely for clearing
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    
    const dpr = window.devicePixelRatio || 1;
    this.ctx.scale(dpr, dpr);
    
    this.ctx.translate(this.transform.x, this.transform.y);
    this.ctx.scale(this.transform.k, this.transform.k);
    
    const activeId = this.hoveredId || this.selectedId;
    let connectedIds = new Set<string>();
    
    if (activeId) {
      connectedIds.add(activeId);
      for (const link of this.links) {
        const s = link.source as GNode;
        const t = link.target as GNode;
        if (s.id === activeId) connectedIds.add(t.id);
        if (t.id === activeId) connectedIds.add(s.id);
      }
    }
    
    // Draw links
    this.ctx.lineWidth = 1;
    
    // Get base color from theme
    const edgeColor = this.theme ? this.theme.colors.foreground : "#888888";
    
    for (const link of this.links) {
      const s = link.source as GNode;
      const t = link.target as GNode;
      if (s.x != null && t.x != null) {
        this.ctx.beginPath();
        this.ctx.moveTo(s.x, s.y!);
        this.ctx.lineTo(t.x, t.y!);
        
        if (activeId) {
          if (s.id === activeId || t.id === activeId) {
            this.ctx.strokeStyle = hexToRgba(edgeColor, 0.6); // highlighted
          } else {
            this.ctx.strokeStyle = hexToRgba(edgeColor, 0.03); // heavily faded
          }
        } else {
          this.ctx.strokeStyle = hexToRgba(edgeColor, 0.15); // normal
        }
        this.ctx.stroke();
      }
    }

    // Draw nodes
    for (const node of this.nodes) {
      if (node.x != null && node.y != null) {
        let alpha = 1;
        if (activeId && !connectedIds.has(node.id)) {
          alpha = 0.15; // fade unrelated nodes
        }
        
        this.ctx.globalAlpha = alpha;
        
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.r, 0, 2 * Math.PI);
        
        // Dailys specific styling
        this.ctx.fillStyle = node.color;
        this.ctx.fill();
        
        // Only stroke if it's a category
        if (node.type === "category") {
          this.ctx.strokeStyle = "color-mix(in srgb, var(--foreground) 30%, transparent)";
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
        } else {
          this.ctx.strokeStyle = "#121212"; // dark outline for definition
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
        
        // Labels
        if (node.label && (alpha === 1 || this.transform.k > 1.2)) {
          this.ctx.fillStyle = hexToRgba(edgeColor, alpha === 1 ? 0.85 : 0.3);
          this.ctx.font = "12px Inter, sans-serif";
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "middle";
          this.ctx.fillText(node.label, node.x, node.y - node.r - 10);
        }
        
        this.ctx.globalAlpha = 1; // restore
      }
    }
    
    this.ctx.restore();
  }

  public resize(width: number, height: number, dpr: number = 1) {
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    this.simulation.force("center", d3.forceCenter(width / 2, height / 2));
    this.simulation.alpha(0.3).restart();
    this.scheduleDraw();
  }
  
  public destroy() {
    this.simulation.stop();
  }
}
