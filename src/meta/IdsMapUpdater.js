/* @flow */

import DepMeta from './DepMeta'
import type {DepId, IdsMap} from '../interfaces'
import {DepNode, AbstractSelector} from '../selectorInterfaces'
import CacheRec from '../CacheRec'

type CacheMap = {[id: DepId]: CacheRec};

class PathMapUpdater {
    _pathsSets: {[id: DepId]: Set<DepId>};
    _depPath: Array<DepId>;

    _stateIdToIdsMap: IdsMap;
    _depNodeMap: {[id: DepId]: DepNode};

    constructor(
        stateIdToIdsMap: IdsMap,
        depNodeMap: {[id: DepId]: DepNode}
    ) {
        this._stateIdToIdsMap = stateIdToIdsMap
        this._depNodeMap = depNodeMap
        this._pathsSets = Object.create(null)
        this._depPath = []
    }

    isAffected(id: DepId): boolean {
        const node = this._depNodeMap[id]
        if (node) {
            const {relations} = node
            for (let i = 0, l = relations.length; i < l; i++) {
                this.addPath(relations[i])
            }
            return true
        }

        return false
    }

    begin(id: DepId): void {
        const {_pathsSets: pathsSets, _depPath: depPath, _depNodeMap: depNodeMap} = this
        const node = new DepNode(depPath.concat([]), [])
        depNodeMap[id] = node
        pathsSets[id] = new Set()
        const parentId = depPath[depPath.length - 1]
        if (parentId) {
            // add nearest child to parent
            depNodeMap[parentId].childs.push(id)
        }
        depPath.push(id)
    }

    addPath(stateId: DepId): void {
        const {_pathsSets: pathsSets, _depPath: depPath} = this
        for (let i = 0, j = depPath.length; i < j; i++) {
            pathsSets[depPath[i]].add(stateId)
        }
    }

    end(id: DepId): void {
        const {_depPath: depPath, _stateIdToIdsMap: stateIdToIdsMap, _pathsSets: pathsSets} = this
        const {relations} = this._depNodeMap[id]
        pathsSets[id].forEach(function iterate(stateId) {
            let facets: Array<DepId> = stateIdToIdsMap[stateId];
            if (!facets) {
                facets = []
                stateIdToIdsMap[stateId] = facets
            }
            facets.push(id)
            relations.push(stateId)
        })

        depPath.pop()
    }
}

function dependencyScanner(
    id: DepId,
    parentDeps: Array<DepMeta>,
    acc: PathMapUpdater
): void {
    if (!acc.isAffected(id)) {
        acc.begin(id)
        for (let i = 0, j = parentDeps.length; i < j; i++) {
            const dep = parentDeps[i];
            dependencyScanner(dep.id, dep.deps, acc)
        }
        acc.end(id)
    }
}

export default class IdsMapUpdater {
    _stateIdToIdsMap: IdsMap;
    _depNodeMap: {[id: DepId]: DepNode};
    _cache: CacheMap;
    _selector: AbstractSelector;

    constructor(selector: AbstractSelector) {
        this._cache = Object.create(null)
        this._stateIdToIdsMap = Object.create(null)
        this._depNodeMap = selector.depNodeMap
        this._selector = selector
    }

    _notify(id: DepId): void {
        const {_cache: cache, _stateIdToIdsMap: stateIdToIdsMap} = this
        const ids = stateIdToIdsMap[id]
        if (ids) {
            for (let i = 0, k = ids.length; i < k; i++) {
                const cacheItem = cache[ids[i]]
                if (cacheItem) {
                    cacheItem.reCalculate = true
                }
            }
        }
    }

    reset(id: DepId): void {
        const cacheRec = this._cache[id]
        if (cacheRec) {
            cacheRec.reset()
        }
    }

    get(id: DepId, deps: Array<DepMeta>): CacheRec {
        const {_cache: cache, _stateIdToIdsMap: stateIdToIdsMap, _depNodeMap: depNodeMap, _selector: selector} = this
        let cacheRec
        if (!cacheRec) {
            const isDep = !this._depNodeMap[id]
            if (isDep) {
                dependencyScanner(id, deps, new PathMapUpdater(stateIdToIdsMap, depNodeMap))
            }
            cacheRec = new CacheRec(isDep ? null : selector.select(id), () => this._notify(id))
            cache[id] = cacheRec
        }
        return cacheRec
    }
}
