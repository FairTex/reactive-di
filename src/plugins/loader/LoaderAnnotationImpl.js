/* @flow */

import {AnnotationBaseImpl} from 'reactive-di/core/pluginImpls'
import type {
    DepId,
    AnnotationBase,
    Deps
} from 'reactive-di/i/annotationInterfaces'
import type {AsyncUpdater} from 'reactive-di/plugins/asyncmodel/asyncmodelInterfaces'
import type {LoaderAnnotation} from 'reactive-di/plugins/loader/loaderInterfaces' // eslint-disable-line

// implements LoaderAnnotation
export default class LoaderAnnotationImpl<V: Object, E> {
    kind: 'loader';
    base: AnnotationBase<AsyncUpdater<V, E>>;
    model: Class<V>; // eslint-disable-line
    deps: ?Deps;

    constructor(
        id: DepId,
        target: AsyncUpdater<V, E>,
        model: Class<V>, // eslint-disable-line
        deps: ?Deps,
        tags: Array<string>
    ) {
        this.kind = 'loader'
        this.base = new AnnotationBaseImpl(id, this.kind, tags, target)
        this.model = model
        this.deps = deps
    }
}
