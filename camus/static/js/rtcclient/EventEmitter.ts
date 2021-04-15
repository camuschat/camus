export default class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    listeners(event) {
        return this.events.get(event) || [];
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push(callback);
    }

    removeListener(event, callback) {
        const listeners = this.events.get(event);
        if (listeners && listeners.includes(callback)) {
            const index = listeners.indexOf(callback);
            listeners.splice(index, 1);
        }
    }

    emit(event, ...args) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            callbacks.forEach((callback) => {
                callback(...args);
            });
        }
    }
}
