export class Observable<T extends object> {
  private subs = new Set<() => void>();
  constructor(private value: T) {}
  get = (): T => this.value;
  subscribe = (cb: () => void): (() => void) => {
    this.subs.add(cb);
    return () => {
      this.subs.delete(cb);
    };
  };
  set(patch: Partial<T>): void {
    this.value = {...this.value, ...patch};
    this.subs.forEach(cb => cb());
  }
}
