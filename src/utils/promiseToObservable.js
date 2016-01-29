/* @flow */

import type {Observer, Observable, Subscription} from '../observableInterfaces'

type Cancelable = {
    cancel(): void;
}

// implements Observable<T, E>
class PromiseObservable<T, E> {
    subscribe: (observer: Observer) => Subscription;

    constructor(promise: Promise<T>) {
        let isSubscribed: boolean = true;
        function unsubscribe(): void {
            // todo: memory leak
            isSubscribed = false
            if (typeof promise.cancel === 'function') {
                ((promise: any): Cancelable).cancel();
            }
        }

        this.subscribe = function subscribe(observer: Observer): Subscription {
            function success(data: T): void {
                if (isSubscribed) {
                    observer.next(data)
                    observer.complete()
                }
            }
            function error(e: E): void {
                if (isSubscribed) {
                    observer.error(e)
                }
            }

            promise.then(success).catch(error)

            return {unsubscribe}
        }
    }
}

export default function promiseToObservable<V, E>(
    resolver: Promise<V>|Observable<V, E>
): Observable<V, E> {
    if (typeof resolver.subscribe === 'function') {
        return ((resolver: any): Observable<V, E>)
    } else if (typeof resolver.then === 'function') {
        return new PromiseObservable(((resolver: any): Promise<V>))
    } else {
        throw new TypeError('resolver argument is not a Promise or Observable')
    }
}