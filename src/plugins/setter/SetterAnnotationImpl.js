/* @flow */

import {AnnotationBaseImpl} from 'reactive-di/core/pluginImpls'
import type {
    DepId,
    Deps,
    AnnotationBase
} from 'reactive-di/i/annotationInterfaces'
import type {AnyUpdater} from 'reactive-di/plugins/asyncmodel/asyncmodelInterfaces'
import type {SetterAnnotation} from 'reactive-di/plugins/setter/setterInterfaces' // eslint-disable-line

// implements SetterAnnotation
export default class SetterAnnotationImpl<V: Object, E> {
    kind: 'setter';
    base: AnnotationBase<AnyUpdater<V, E>>;
    deps: ?Deps;
    model: Class<V>; // eslint-disable-line

    constructor(
        id: DepId,
        model: Class<V>, // eslint-disable-line
        target: AnyUpdater<V, E>,
        deps: ?Deps,
        tags: Array<string>
    ) {
        this.kind = 'setter'
        this.base = new AnnotationBaseImpl(id, this.kind, tags, target)
        this.deps = deps
        this.model = model
    }
}
