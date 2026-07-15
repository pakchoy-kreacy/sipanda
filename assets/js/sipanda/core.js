window.Sipanda = {
    compose(...parts) {
        const component = {};

        for (const part of parts) {
            for (const key of Reflect.ownKeys(part)) {
                if (Object.prototype.hasOwnProperty.call(component, key)) {
                    throw new Error(`Properti SIPANDA ganda: ${String(key)}`);
                }

                Object.defineProperty(
                    component,
                    key,
                    Object.getOwnPropertyDescriptor(part, key)
                );
            }
        }

        return component;
    }
};
