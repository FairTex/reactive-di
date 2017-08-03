// @flow

import assert from 'assert'
import Injector from '../src/Injector'

describe('Injector.hierarchy', () => {
    class B {}
    class A {
        b: B
        static deps = [B]
        constructor(b: B) {
            this.b = b
        }
    }

    it('dependency resolved from parent, if already exists in parent', () => {
        const parent = new Injector()
        const child = parent.copy()

        const aParent: A = parent.value(A)
        const aChild: A = child.value(A)

        assert(aChild.b === aParent.b)
    })

    it('dependency resolved from child, if not exists in parent, parent dependency set to undefined', () => {
        const parent = new Injector()
        const child = parent.copy()

        const aChild: A = child.value(A)
        const aParent: A = parent.value(A)
        assert(aParent === undefined)
    })

    it('dependency resolved from child, if exists in parent, but registered in child', () => {
        const parent = new Injector()
        const child = parent.copy([
            A
        ])

        const aParent: A = parent.value(A)
        const aChild: A = child.value(A)
        assert(aChild !== aParent)
        assert(aChild.b === aParent.b)
    })
})
