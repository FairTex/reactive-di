// @flow

import type {INotifier} from '../hook/interfaces'
import {setterKey} from '../interfaces'
import type {ISource} from './interfaces'

export function fromEvent(e: Event): mixed {
    e.stopPropagation()
    e.preventDefault()
    return (e.target: any).value
}

export function getSrc<V: Object>(obj: V): ISource<V> {
    return (obj: any)[setterKey]
}

export default function createSetterFn<V: Object>(
    src: ISource<V>,
    notifier: INotifier,
    key: string,
    getValue: ?(rawVal: mixed) => mixed
) {
    const name = src.displayName + (getValue ? '.eventSetter.' : '.setter.') + key
    function setVal(rawVal: mixed) {
        const v: mixed = getValue ? getValue(rawVal) : rawVal
        const cached = src.cached
        if (cached) {
            const oldTrace = notifier.trace
            notifier.trace = name
            notifier.opId++
            src.merge({[key]: v})
            notifier.trace = oldTrace
            notifier.flush()
        }
    }
    setVal.displayName = name
    return setVal
}
