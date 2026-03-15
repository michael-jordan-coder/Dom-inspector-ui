export class RingBuffer<T> {
  private readonly capacity: number;
  private buffer: T[];

  constructor(capacity: number) {
    this.capacity = Math.max(10, capacity);
    this.buffer = [];
  }

  push(item: T): void {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(item);
  }

  values(): T[] {
    return [...this.buffer];
  }
}
