/* @flow */

import CacheImpl from './CacheImpl'
import EntityMetaImpl from './EntityMetaImpl'
import {InfoImpl} from '../../annotations/annotationImpl'
import type {Info} from '../../annotations/annotationInterfaces'
import type {ModelDep, Cache, AnyDep, Cursor} from '../nodeInterfaces'

export default class ModelDepImpl<T> {
    kind: 1;
    meta: EntityMetaImpl;
    cache: Cache<T>;
    info: Info;
    relations: Array<AnyDep>;
    childs: Array<ModelDep>;
    cursor: Cursor<T>;

    set: (value: T|Promise<T>) => void;
    get: () => T;

    constructor(cursor: Cursor<T>, displayName: string, tags: Array<string>) {
        this.kind = 1
        this.meta = new EntityMetaImpl()
        this.info = new InfoImpl(displayName, tags)
        const relations = this.relations = []
        this.childs = []

        const self = this
        const cache = new CacheImpl()

        // chrome not optimized for bind syntax: place methods in cosntructor
        function notify(): void {
            cache.isRecalculate = true
            for (let i = 0, l = relations.length; i < l; i++) {
                relations[i].cache.isRecalculate = true
            }
        }

        function success(value: T): void {
            const isDataChanged = cursor.set(value)
            const newMeta = self.meta.success()
            if (newMeta !== self.meta || isDataChanged) {
                notify()
            }
            self.meta = newMeta
        }

        function error(reason: Error): void {
            const newMeta = self.meta.error(reason)
            if (newMeta !== self.meta) {
                notify()
            }
            self.meta = newMeta
        }

        this.get = function get(): T {
            return cursor.get()
        }

        this.set = function set(value: T|Promise<T>): void {
            if (typeof value.then === 'function') {
                const newMeta = self.meta.setPending()
                if (self.meta === newMeta) {
                    // if previous value is pending - do not handle this value: only first
                    return
                }
                notify()
                self.meta = newMeta;
                ((value: any): Promise<T>).then(success).catch(error);
            } else {
                success(((value: any): T))
            }
        }
    }
}
