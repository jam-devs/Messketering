import { Component, Input } from '@angular/core';
import { ScheduleEvent } from '../../models/catering-manager.model';

@Component({
  selector: 'app-schedule-view',
  template: `
    <section class="panel">
      <h2>Delivery Schedule</h2>

      @for (group of groupedSchedule; track group.date) {
        <section class="date-group">
          <h3>{{ group.date }}</h3>
          <div class="schedule-grid">
            @for (event of group.events; track event.id) {
              <article class="schedule-card">
                <div>
                  <p class="category">Order #{{ event.id }} - {{ event.status }}</p>
                  <h4>{{ event.customer_name }}</h4>
                  <p class="description">{{ event.contact_number }}</p>
                  <p class="description">{{ event.address || 'No address set' }}</p>
                </div>
                <div>
                  <p class="price">PHP {{ event.total_amount }}</p>
                  @for (item of event.items; track item.name) {
                    <p class="item-line">{{ item.name }} x {{ item.quantity }}</p>
                  }
                  @if (event.notes) {
                    <p class="description">Notes: {{ event.notes }}</p>
                  }
                </div>
              </article>
            }
          </div>
        </section>
      } @empty {
        <p class="empty">No scheduled deliveries yet.</p>
      }
    </section>
  `,
  styles: [`
    .panel {
      margin-bottom: 28px;
      padding-top: 8px;
    }

    h2, h3, h4, p {
      margin: 0;
    }

    h2 {
      margin-bottom: 16px;
      font-size: 1.6rem;
      line-height: 1.15;
    }

    h3 {
      margin-bottom: 12px;
      color: #19624a;
      font-size: 1.15rem;
    }

    h4 {
      font-size: 1.1rem;
      line-height: 1.2;
    }

    .date-group {
      margin-bottom: 22px;
    }

    .schedule-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    .schedule-card,
    .empty {
      padding: 20px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
      box-shadow: 0 8px 22px rgb(33 31 28 / 8%);
    }

    .schedule-card {
      display: grid;
      gap: 18px;
    }

    .category {
      margin-bottom: 8px;
      color: #9a4b1f;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .description,
    .item-line,
    .empty {
      margin-top: 8px;
      color: #645d54;
      line-height: 1.5;
    }

    .price {
      color: #19624a;
      font-size: 1.2rem;
      font-weight: 700;
    }
  `],
})
export class ScheduleViewComponent {
  @Input({ required: true }) schedule: ScheduleEvent[] = [];

  get groupedSchedule() {
    const groups = new Map<string, ScheduleEvent[]>();

    for (const event of this.schedule) {
      groups.set(event.delivery_date, [...(groups.get(event.delivery_date) ?? []), event]);
    }

    return Array.from(groups.entries()).map(([date, events]) => ({ date, events }));
  }
}
