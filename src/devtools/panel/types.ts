import type { TimelineEvent } from '../../devtools-shared/events';

export interface TimelineRow extends TimelineEvent {
  relativeMs: number;
}
