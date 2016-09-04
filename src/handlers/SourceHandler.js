//@flow

import {DepInfo, SourceMeta, IHandler} from 'reactive-di/common'
import type {Atom, Adapter, CacheMap, Derivable} from 'reactive-di/interfaces/atom'
import type {SingleUpdate} from 'reactive-di/interfaces/updater'
import Updater from 'reactive-di/Updater'

type AsyncThunk<V: Object> = () => Promise<V>|Observable<V, Error>

function createUpdateSource<V: Object, Raw: Object>(target: Class<V>): (rec: [Updater, ?SingleUpdate]) => void {
    let oldUpdater: ?Updater
    let oldLoaderResult: ?SingleUpdate

    return function updateSource([updater, loaderResult]: [Updater, ?SingleUpdate]): void {
        if (!loaderResult) {
            return
        }

        if (
            oldUpdater &&
            (oldUpdater !== updater || (oldLoaderResult !== loaderResult))
        ) {
            oldUpdater.cancel()
        }
        if (loaderResult) {
            updater.setSingle(loaderResult, target)
        }
        oldLoaderResult = loaderResult
        oldUpdater = updater
    }
}

export default class SourceHandler {
    handle<V, C: Class<V>>({
        meta,
        target,
        ctx
    }: DepInfo<C, SourceMeta>): Atom<V> {
        let atom: Atom<V>
        const value: any = ctx.defaults[meta.key]
        if (meta.construct) {
            atom = ctx.adapter.atom(ctx.preprocess((new target(value): any)))
        } else {
            atom = ctx.adapter.isAtom(value)
                ? value
                : ctx.adapter.atom(ctx.preprocess(value || (new target(): any)))
        }

        return atom
    }

    postHandle<V, C: Class<V>>({
        meta,
        target,
        ctx
    }: DepInfo<C, SourceMeta>): void {
        if (!meta.updater) {
            return
        }

        const updaterAtom: Derivable<Updater> = ctx.val(meta.updater)
        if (!meta.loader) {
            throw new Error(`Provide loader for ${ctx.debugStr(target)}`)
        }
        const loaderAtom: Derivable<?SingleUpdate> = ctx.val(meta.loader)

        ctx.adapter.struct([updaterAtom, loaderAtom]).react(createUpdateSource(target), {
            until: ctx.stopped
        })
    }
}

if (0) ((new SourceHandler(...(0: any))): IHandler)
