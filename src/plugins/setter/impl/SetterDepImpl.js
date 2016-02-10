/* @flow */

import resolveDeps from '../../factory/resolveDeps'
import InvokerImpl from '../../factory/InvokerImpl'
import MetaAnnotationImpl from '../../meta/MetaAnnotationImpl'
import {DepBaseImpl} from '../../../core/pluginImpls'
import type {
    AnnotationBase,
    Deps,
    DepId,
    DepFn,
    Info
} from '../../../interfaces/annotationInterfaces'
import type {
    AnyDep,
    DepBase,
    AnnotationResolver
} from '../../../interfaces/nodeInterfaces'
import type {
    Subscription,
    Observer,
    Observable
} from '../../../interfaces/observableInterfaces'
import {fastCall} from '../../../utils/fastCall'
import type {AnyUpdater, AsyncModelDep} from '../../asyncmodel/asyncmodelInterfaces'
import type {
    FactoryDep,
    Invoker
} from '../../factory/factoryInterfaces'
import type {ResolveDepsResult} from '../../factory/resolveDeps'
import type {MetaDep} from '../../meta/metaInterfaces'
import type {ModelDep} from '../../model/modelInterfaces'
import type {
    AnyModelDep,
    SetterCreator,
    SetFn
} from '../setterInterfaces'

function isObservable(data: Object): boolean {
    return !!(data.subscribe)
}

function assertAsync(result: Object, info: Info): void  {
    if (!isObservable(result)) {
        throw new Error(`${info.displayName} must return observable`)
    }
}

function assertSync(result: Object, info: Info): void {
    if (isObservable(result)) {
        throw new Error(`${info.displayName} must return raw value, not observable`)
    }
}

const defaultSubscription: Subscription = {
    unsubscribe() {}
};

class AsyncModelObserver<V: Object, E> {
    _subscription: Subscription;
    _model: AsyncModelDep<V, E>;
    _notify: () => void;

    constructor(
        observable: Observable<V, E>,
        model: AsyncModelDep<V, E>,
        notify: () => void
    ) {
        this._model = model
        this._notify = notify
        this._subscription = observable.subscribe((this: Observer<V, E>))
    }

    next(value: V): void {
        this._model.next(value)
        this._notify()
    }

    error(err: E): void {
        this._model.error(err)
        this._notify()
        this.complete()
    }

    complete(): void {
        this._subscription.unsubscribe()
    }
}

// implements SetterDep
export default class SetterDepImpl<V: Object, E> {
    kind: 'setter';
    base: DepBase;
    _notify: () => void;
    _invoker: Invoker;
    _value: SetFn;
    _model: AnyModelDep<V, E>;
    _meta: MetaDep<E>;

    _observer: ?Observer<V, E>;

    constructor(
        id: DepId,
        info: Info,
        notify: () => void,
        model: AnyModelDep<V, E>,
        meta: MetaDep<E>
    ) {
        this.kind = 'setter'
        this._notify = notify
        this._model = model
        this._meta = meta
        this.base = new DepBaseImpl(id, info)
    }

    init(invoker: Invoker): void {
        this._invoker = invoker
    }

    unsubscribe(): void {
        if (this._observer) {
            this._observer.complete()
            this._observer = null
        }
    }

    _setterResolver(
        {deps, middlewares}: ResolveDepsResult,
        args: Array<any>
    ): void {
        const {base, _model: model, _notify: notify, _invoker: invoker} = this
        const result: V = fastCall(invoker.target, [model.resolve()].concat(deps, args));
        if (middlewares) {
            const middleareArgs = [result].concat(args)
            for (let i = 0, l = middlewares.length; i < l; i++) {
                fastCall(middlewares[i], middleareArgs)
            }
        }

        switch (model.kind) {
            case 'model':
                assertSync(result, base.info)
                model.set(result)
                break
            case 'asyncmodel':
                assertAsync(result, base.info)
                model.pending()
                if (this._observer) {
                    this._observer.complete()
                }
                this._observer = new AsyncModelObserver(result, model, notify);
                break
            default:
                throw new Error('Unknown type: ' + model.kind + ' in ' + model.base.info.displayName)
        }
        notify()
    }

    resolve(): SetFn {
        const {base} = this
        if (!base.isRecalculate) {
            return this._value
        }
        const self = this
        const {_meta: meta, _invoker: invoker} = this

        const depsResult: ResolveDepsResult = resolveDeps(invoker.depArgs);

        this._value = function setValue(...args: any): void {
            if (meta.resolve().fulfilled) {
                self._setterResolver(depsResult, args)
            } else {
                function success(): void {
                    self._setterResolver(depsResult, args)
                }
                meta.promise.then(success)
            }
        }

        base.isRecalculate = false

        return this._value
    }
}