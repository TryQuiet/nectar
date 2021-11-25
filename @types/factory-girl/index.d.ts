declare module 'factory-girl' {
  export class FactoryGirl {
    constructor();

    /**
     * Associate the factory to other model
     */
    assoc(
      name: string,
      key?: string,
      attrs?: Attributes<any>,
      buildOptions?: BuildOptions
    ): Static['assoc'];

    /**
     * Associate the factory to a model that's not persisted
     */
    assocAttrs(
      name: string,
      key?: string,
      attrs?: Attributes<any>,
      buildOptions?: BuildOptions
    ): Static['assocAttrs'];

    /**
     * Associate the factory to multiple other models
     */
    assocMany(
      name: string,
      num: number,
      key?: string,
      attrs?: Attributes<any>,
      buildOptions?: BuildOptions
    ): Static['assocMany'];

    /**
     * Associate the factory to multiple other models that aren't persisted
     */
    assocAttrsMany(
      name: string,
      num: number,
      key?: string,
      attrs?: Attributes<any>,
      buildOptions?: BuildOptions
    ): Static['assocAttrsMany'];

    /**
     * Generates and returns model attributes as an object hash instead of the model instance
     */
    attrs<T>(
      name: string,
      attrs?: Attributes<Partial<T>>,
      buildOptions?: BuildOptions
    ): Static['attrs'];

    /**
     * Generates and returns a collection of model attributes as an object hash instead of the model instance
     */
    attrsMany<T>(
      name: string,
      num: number,
      attrs?: MaybeReadonlyArray<Attributes<Partial<T>>>,
      buildOptions?: BuildOptions | ReadonlyArray<BuildOptions>
    ): Static['attrsMany'];

    /**
     * Builds a new model instance that is not persisted
     */
    build<T>(
      name: string,
      attrs?: Attributes<Partial<T>>,
      buildOptions?: BuildOptions
    ): Static['build'];

    /**
     * Builds an array of model instances that are not persisted
     */
    buildMany<T>(
      name: string,
      num: number,
      attrs?: MaybeReadonlyArray<Attributes<Partial<T>>>,
      buildOptions?: MaybeReadonlyArray<BuildOptions>
    ): Static['buildMany'];

    /**
     * Destroys all of the created models
     */
    cleanUp(): Static['cleanUp'];

    /**
     * Builds a new model instance that is persisted
     */
    create<T>(
      name: string,
      attrs?: Attributes<Partial<T>>,
      buildOptions?: BuildOptions
    ): Static['create'];

    /**
     * Builds an array of model instances that are persisted
     */
    createMany<T>(
      name: string,
      num: number,
      attrs?: MaybeReadonlyArray<Attributes<Partial<T>>>,
      buildOptions?: MaybeReadonlyArray<BuildOptions>
    ): Static['createMany'];
    createMany<T>(
      name: string,
      attrs?: ReadonlyArray<Attributes<Partial<T>>>,
      buildOptions?: MaybeReadonlyArray<BuildOptions>
    ): Static['createMany'];

    /**
     * Define a new factory with a set of options
     */
    define<T>(
      name: string,
      model: any,
      attrs: Initializer<Partial<T>>,
      options?: Options<T>
    ): Static['define'];
    /**
     * Extends a factory
     */
    extend(
      parent: string,
      name: string,
      initializer: any,
      options?: Options<any>
    ): Static['extend'];

    /**
     * Generate values sequentially inside a factory
     */
    seq(name?: string): Static['seq'];
    seq<T>(name: string, fn: (sequence: number) => T): Static['seq'];
    seq<T>(fn: (sequence: number) => T): Static['seq'];

    sequence(name?: string): Static['sequence'];
    sequence<T>(name: string, fn: (sequence: number) => T): Static['sequence'];
    sequence<T>(fn: (sequence: number) => T): Static['sequence'];

    /**
     * Register an adapter, either as default or tied to a specific model
     */
    setAdapter(adapter: any, name?: string): Static['setAdapter'];

    /**
     *  Reset sequence generator with the given name
     *  or all generators if no name is given.
     */
    resetSequence(name?: string): Static['resetSequence'];
    resetSeq(name?: string): Static['resetSeq'];

    chance(chanceMethod: string, ...options: any): Static['chance'];
  }
}
