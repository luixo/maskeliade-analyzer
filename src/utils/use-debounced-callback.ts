import React from 'react';

function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    options: { maxWait?: number; leading?: boolean; trailing?: boolean } = {}
): [T, () => void, () => void] {
    const maxWait = options.maxWait;
    const maxWaitHandler = React.useRef<number | undefined>(undefined);
    const maxWaitArgs = React.useRef<unknown[]>([]);

    const leading = options.leading;
    const trailing = options.trailing === undefined ? true : options.trailing;
    const leadingCall = React.useRef(false);

    const functionTimeoutHandler = React.useRef<number | undefined>(undefined);
    const isComponentUnmounted: { current: boolean } = React.useRef(false);

    const debouncedFunction = React.useRef(callback);
    debouncedFunction.current = callback;

    const cancelDebouncedCallback: () => void = React.useCallback(() => {
        window.clearTimeout(functionTimeoutHandler.current);
        clearTimeout(maxWaitHandler.current);
        maxWaitHandler.current = undefined;
        maxWaitArgs.current = [];
        functionTimeoutHandler.current = undefined;
        leadingCall.current = false;
    }, []);

    React.useEffect(
        () => () => {
            // we use flag, as we allow to call callPending outside the hook
            isComponentUnmounted.current = true;
        },
        []
    );

    const debouncedCallback = React.useCallback(
        (...args) => {
            maxWaitArgs.current = args;
            clearTimeout(functionTimeoutHandler.current);
            if (leadingCall.current) {
                leadingCall.current = false;
            }
            if (!functionTimeoutHandler.current && leading && !leadingCall.current) {
                debouncedFunction.current(...args);
                leadingCall.current = true;
            }

            functionTimeoutHandler.current = setTimeout(() => {
                let shouldCallFunction = true;
                if (leading && leadingCall.current) {
                    shouldCallFunction = false;
                }
                cancelDebouncedCallback();

                if (!isComponentUnmounted.current && trailing && shouldCallFunction) {
                    debouncedFunction.current(...args);
                }
            }, delay);

            if (maxWait && !maxWaitHandler.current && trailing) {
                maxWaitHandler.current = setTimeout(() => {
                    const args = maxWaitArgs.current;
                    cancelDebouncedCallback();

                    if (!isComponentUnmounted.current) {
                        debouncedFunction.current.apply(null, args);
                    }
                }, maxWait);
            }
        },
        [maxWait, delay, cancelDebouncedCallback, leading, trailing]
    );

    const callPending = () => {
        // Call pending callback only if we have anything in our queue
        if (!functionTimeoutHandler.current) {
            return;
        }

        debouncedFunction.current.apply(null, maxWaitArgs.current);
        cancelDebouncedCallback();
    };

    // At the moment, we use 3 args array so that we save backward compatibility
    return [debouncedCallback as T, cancelDebouncedCallback, callPending];
}

export default useDebouncedCallback;
