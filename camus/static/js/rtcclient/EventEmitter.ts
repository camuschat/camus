export default class EventEmitter {
    events: Map<string, Function[]>;

    constructor() {
        this.events = new Map();
    }

    listeners(event: string): Function[] {
        return this.events.get(event) || [];
    }

    on(event: string, callback: Function): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event)!.push(callback);
    }

    removeListener(event: string, callback: Function): void {
        const listeners = this.events.get(event);
        if (listeners && listeners.includes(callback)) {
            const index = listeners.indexOf(callback);
            listeners.splice(index, 1);
        }
    }

    emit(event: string, ...args: any[]): void {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            callbacks &&
                callbacks.forEach((callback) => {
                    callback(...args);
                });
        }
    }
}
