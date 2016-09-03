//@flow

import {DepInfo, ComponentMeta, IContext, IHandler} from 'reactive-di/common'
import type {RdiMeta} from 'reactive-di/common'
import type {Atom, Derivable, CacheMap, Adapter} from 'reactive-di/interfaces/atom'
import type {ArgDep} from 'reactive-di/interfaces/deps'
import type {CreateControllable, IComponentControllable, CreateWidget, RawStyleSheet} from 'reactive-di/interfaces/component'

type ThemesReactor = (rec: [RawStyleSheet[], boolean]) => void
function createThemesReactor(): ThemesReactor {
    let oldThemes: RawStyleSheet[] = []
    let mountCount: number = 0

    return function themesReactor([themes, isMounted]: [RawStyleSheet[], boolean]): void {
        const themesChanged: boolean = themes !== oldThemes
        if (!themesChanged) {
            mountCount = mountCount + (isMounted ? 1 : -1)
        }

        if (mountCount === 0 || themesChanged) {
            for (let i = 0; i < oldThemes.length; i++) {
                oldThemes[i].__styles.detach()
            }
        }
        if (mountCount === 1 || themesChanged) {
            for (let i = 0; i < themes.length; i++) {
                themes[i].__styles.attach()
            }
            oldThemes = themes
        }
    }
}

class ThemesCollector {
    themes: Derivable<RawStyleSheet>[] = []
    add(di: DepInfo<*>, atom: Derivable<RawStyleSheet>) {
        if (di.meta.type === 'theme') {
            this.themes.push(atom)
        }
    }
}

function pickFirstArg<V>(v: any[]): V {
    return v[0]
}

function noop() {}

class ComponentControllable<State> {
    _isDisposed: Atom<boolean>
    _isMounted: Atom<boolean>
    _stateAtom: ?Derivable<State>

    constructor(
        {deps, meta, ctx, name}: DepInfo<ComponentMeta>,
        themesReactor: ThemesReactor,
        setState: (state: State) => void
    ) {
        const container: IContext = meta.register
            ? ctx.create(name).register(meta.register)
            : ctx
        const ad: Adapter = ctx.adapter
        const isDisposed: Atom<boolean> = ad.atom(false)
        this._isMounted = ad.atom(false)

        let tc: ?ThemesCollector

        if (deps.length) {
            tc = new ThemesCollector()
            this._stateAtom = container.resolveDeps(deps, tc).derive(pickFirstArg)
            this._stateAtom
                .react(setState, {
                    skipFirst: true,
                    from: this._isMounted,
                    while: this._isMounted,
                    until: (isDisposed: Derivable<boolean>)
                })
        }

        if (tc && tc.themes.length) {
            ad
                .struct([ad.struct(tc.themes), this._isMounted])
                .react(themesReactor, {
                    from: this._isMounted,
                    while: this._isMounted,
                    until: (isDisposed: Derivable<boolean>)
                })
        }
    }

    getState(): State {
        return this._stateAtom ? this._stateAtom.get() : ({}: any)
    }

    onUnmount(): void {
        this._isMounted.set(false)
    }

    onMount(): void {
        this._isMounted.set(true)
    }
}
if (0) ((new ComponentControllable(...(0: any))): IComponentControllable<*>)

export default class ComponentHandler {
    _componentCache: CacheMap = new Map()
    _createComponent: CreateWidget<*, *, *>

    constructor(
        createComponent: CreateWidget<*, *, *>
    ) {
        this._createComponent = createComponent
    }

    handle(depInfo: DepInfo<ComponentMeta>): Atom<*> {
        let atom: ?Atom<*> = this._componentCache.get(depInfo.key)
        if (atom) {
            return atom
        }
        const themesReactor = createThemesReactor()

        function createControllable<State>(setState: (state: State) => void): IComponentControllable<State> {
            return new ComponentControllable(depInfo, themesReactor, setState)
        }

        atom = depInfo.ctx.adapter.atom((this._createComponent(
            depInfo.target,
            createControllable
        ): any))

        this._componentCache.set(depInfo.key, atom)

        return atom
    }

    postHandle(): void {}
}

if (0) ((new ComponentHandler(...(0: any))): IHandler<ComponentMeta, Atom<*>>)