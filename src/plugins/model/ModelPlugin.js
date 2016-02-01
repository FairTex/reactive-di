/* @flow */

import modelFinalizer from './modelFinalizer'
import ModelDepImpl from './impl/ModelDepImpl'
import type {
    Cursor
} from '../../interfaces/modelInterfaces'
import type {
    AnyDep,
    DepBase,
    AnnotationResolver,
    Cacheable
} from '../../interfaces/nodeInterfaces'
import type {
    Observable,
    Subscription
} from '../../interfaces/observableInterfaces'
import type {Plugin} from '../../interfaces/pluginInterfaces'
import type {
    FactoryDep
} from '../factory/factoryInterfaces'
import type {
    ModelDep,
    ModelAnnotation,
} from './modelInterfaces'

// implements Plugin
export default class ModelPlugin {
    create<V: Object, E>(
        annotation: ModelAnnotation<V>,
        acc: AnnotationResolver
    ): void {
        const {base, info} = annotation
        const cursor: Cursor<V> = acc.createCursor(info.statePath);

        const loader: ?FactoryDep<Observable<V, E>> = annotation.loader
            ? (acc.newRoot().resolve(annotation.loader, acc): any)
            : null;

        const dep: ModelDep<V> = new ModelDepImpl(
            base.id,
            base.info,
            cursor,
            info.fromJS,
            acc.notify
        );
        acc.addRelation(base.id)

        const {childs} = info
        acc.begin(dep)
        for (let i = 0, l = childs.length; i < l; i++) {
            acc.resolve(childs[i])
        }
        acc.end(dep)
    }

    finalize(dep: ModelDep, child: AnyDep): void {
        modelFinalizer(dep, child)
    }
}
