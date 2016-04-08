/* @flow */

import type {
    Tag
} from 'reactive-di/i/annotationInterfaces'

import type {
    Provider,
    CreateResolverOptions,
    ResolveDepsResult
} from 'reactive-di/i/nodeInterfaces'

import ResolveHelper from 'reactive-di/core/ResolveHelper'

function resolveDeps(
    deps: Array<Provider>,
    depNames: ?Array<string>,
    middlewares: ?Array<Provider>
): ResolveDepsResult {
    const argsArray = []
    const argsObject = {}
    for (let i = 0, j = deps.length; i < j; i++) {
        const dep = deps[i];
        if (depNames) {
            argsObject[depNames[i]] = dep.resolve()
        } else {
            argsArray.push(dep.resolve())
        }
    }

    let resolvedMiddlewares: ?Array<any> = null;
    if (middlewares) {
        resolvedMiddlewares = []
        for (let i = 0, j = middlewares.length; i < j; i++) {
            const mdl = middlewares[i];
            resolvedMiddlewares.push(mdl.resolve())
        }
    }

    return {
        deps: depNames ? [argsObject] : argsArray,
        middlewares: resolvedMiddlewares
    }
}

export default function createDepResolverCreator(
    helper: ResolveHelper
): (
    rec: CreateResolverOptions,
    tags: Array<Tag>
) => () => ResolveDepsResult {
    return function createDepResolver(
        rec: CreateResolverOptions,
        tags: Array<Tag>
    ): () => ResolveDepsResult {
        const {deps, depNames} = helper.getDeps(rec.deps);
        const middlewares = helper.getMiddlewares(
            rec.target,
            tags
        );

        return function resolve(): ResolveDepsResult {
            return resolveDeps(deps, depNames, middlewares)
        }
    }
}