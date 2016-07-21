// @flow

export type Key = Function|string
export type DepFn<V> = (...a: any) => V
export type DepDict = {[k: string]: Key}
export type ArgDep = Key | DepDict

export type DepAlias = [Key, Key]
export type RegisterDepItem = DepAlias | Key
export type InitData<V> = [V, ?(Promise<V> | Observable<V, Error>)]
export type Initializer<V> = DepFn<InitData<V>>
