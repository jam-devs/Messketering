import {
  Component,
  ElementRef,
  input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-card',
  standalone: true,
  template: `
    <div class="chart-wrap">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: `
    .chart-wrap { position: relative; height: 260px; width: 100%; }
    canvas { max-height: 260px; }
  `,
})
export class ChartCardComponent implements OnChanges, OnDestroy {
  readonly config = input.required<ChartConfiguration>();
  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    afterNextRender(() => this.render());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    const el = this.canvasRef()?.nativeElement;
    if (!el) return;
    this.chart?.destroy();
    this.chart = new Chart(el, this.config());
  }
}
