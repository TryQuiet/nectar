/// <reference path="../../node_modules/@types/factory-girl/index.d.ts" />

declare module 'factory-girl' {
  class FactoryGirl {
    constructor();

    assoc: typeof factory.assoc;
    assocAttrs: typeof factory.assocAttrs;
    assocMany: typeof factory.assocMany;
    assocAttrsMany: typeof factory.assocAttrsMany;
    attrs: typeof factory.attrs;
    attrsMany: typeof factory.attrsMany;
    build: typeof factory.build;
    buildMany: typeof factory.buildMany;
    cleanUp(): typeof factory.cleanUp;
    create: typeof factory.create;
    createMany: typeof factory.createMany;
    define: typeof factory.define;
    extend: typeof factory.extend;
    seq: typeof factory.seq;
    sequence: typeof factory.sequence;
    setAdapter: typeof factory.setAdapter;
    resetSequence: typeof factory.resetSequence;
    resetSeq: typeof factory.resetSeq;
    chance: typeof factory.chance;
  }

  factory.FactoryGirl = FactoryGirl;
}
