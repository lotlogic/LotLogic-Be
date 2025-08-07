
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Lot
 * 
 */
export type Lot = $Result.DefaultSelection<Prisma.$LotPayload>
/**
 * Model Estate
 * 
 */
export type Estate = $Result.DefaultSelection<Prisma.$EstatePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Lots
 * const lots = await prisma.lot.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Lots
   * const lots = await prisma.lot.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.lot`: Exposes CRUD operations for the **Lot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Lots
    * const lots = await prisma.lot.findMany()
    * ```
    */
  get lot(): Prisma.LotDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.estate`: Exposes CRUD operations for the **Estate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Estates
    * const estates = await prisma.estate.findMany()
    * ```
    */
  get estate(): Prisma.EstateDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.11.0
   * Query Engine version: 9c30299f5a0ea26a96790e13f796dc6094db3173
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Lot: 'Lot',
    Estate: 'Estate'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "lot" | "estate"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Lot: {
        payload: Prisma.$LotPayload<ExtArgs>
        fields: Prisma.LotFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LotFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LotFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload>
          }
          findFirst: {
            args: Prisma.LotFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LotFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload>
          }
          findMany: {
            args: Prisma.LotFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload>[]
          }
          create: {
            args: Prisma.LotCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload>
          }
          createMany: {
            args: Prisma.LotCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LotCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload>[]
          }
          delete: {
            args: Prisma.LotDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload>
          }
          update: {
            args: Prisma.LotUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload>
          }
          deleteMany: {
            args: Prisma.LotDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LotUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LotUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload>[]
          }
          upsert: {
            args: Prisma.LotUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LotPayload>
          }
          aggregate: {
            args: Prisma.LotAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLot>
          }
          groupBy: {
            args: Prisma.LotGroupByArgs<ExtArgs>
            result: $Utils.Optional<LotGroupByOutputType>[]
          }
          count: {
            args: Prisma.LotCountArgs<ExtArgs>
            result: $Utils.Optional<LotCountAggregateOutputType> | number
          }
        }
      }
      Estate: {
        payload: Prisma.$EstatePayload<ExtArgs>
        fields: Prisma.EstateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EstateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EstateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload>
          }
          findFirst: {
            args: Prisma.EstateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EstateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload>
          }
          findMany: {
            args: Prisma.EstateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload>[]
          }
          create: {
            args: Prisma.EstateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload>
          }
          createMany: {
            args: Prisma.EstateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EstateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload>[]
          }
          delete: {
            args: Prisma.EstateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload>
          }
          update: {
            args: Prisma.EstateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload>
          }
          deleteMany: {
            args: Prisma.EstateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EstateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EstateUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload>[]
          }
          upsert: {
            args: Prisma.EstateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstatePayload>
          }
          aggregate: {
            args: Prisma.EstateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEstate>
          }
          groupBy: {
            args: Prisma.EstateGroupByArgs<ExtArgs>
            result: $Utils.Optional<EstateGroupByOutputType>[]
          }
          count: {
            args: Prisma.EstateCountArgs<ExtArgs>
            result: $Utils.Optional<EstateCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    lot?: LotOmit
    estate?: EstateOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type EstateCountOutputType
   */

  export type EstateCountOutputType = {
    lots: number
  }

  export type EstateCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lots?: boolean | EstateCountOutputTypeCountLotsArgs
  }

  // Custom InputTypes
  /**
   * EstateCountOutputType without action
   */
  export type EstateCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstateCountOutputType
     */
    select?: EstateCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EstateCountOutputType without action
   */
  export type EstateCountOutputTypeCountLotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LotWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Lot
   */

  export type AggregateLot = {
    _count: LotCountAggregateOutputType | null
    _avg: LotAvgAggregateOutputType | null
    _sum: LotSumAggregateOutputType | null
    _min: LotMinAggregateOutputType | null
    _max: LotMaxAggregateOutputType | null
  }

  export type LotAvgAggregateOutputType = {
    blockNumber: number | null
    sectionNumber: number | null
    areaSqm: number | null
    shapeArea: number | null
    shapeLength: number | null
  }

  export type LotSumAggregateOutputType = {
    blockNumber: number | null
    sectionNumber: number | null
    areaSqm: number | null
    shapeArea: number | null
    shapeLength: number | null
  }

  export type LotMinAggregateOutputType = {
    id: string | null
    blockKey: string | null
    blockNumber: number | null
    sectionNumber: number | null
    areaSqm: number | null
    zoning: string | null
    overlays: string | null
    address: string | null
    district: string | null
    division: string | null
    lifecycleStage: string | null
    shapeArea: number | null
    shapeLength: number | null
    globalId: string | null
    estateId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LotMaxAggregateOutputType = {
    id: string | null
    blockKey: string | null
    blockNumber: number | null
    sectionNumber: number | null
    areaSqm: number | null
    zoning: string | null
    overlays: string | null
    address: string | null
    district: string | null
    division: string | null
    lifecycleStage: string | null
    shapeArea: number | null
    shapeLength: number | null
    globalId: string | null
    estateId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LotCountAggregateOutputType = {
    id: number
    blockKey: number
    blockNumber: number
    sectionNumber: number
    areaSqm: number
    zoning: number
    overlays: number
    address: number
    district: number
    division: number
    lifecycleStage: number
    shapeArea: number
    shapeLength: number
    globalId: number
    geojson: number
    estateId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LotAvgAggregateInputType = {
    blockNumber?: true
    sectionNumber?: true
    areaSqm?: true
    shapeArea?: true
    shapeLength?: true
  }

  export type LotSumAggregateInputType = {
    blockNumber?: true
    sectionNumber?: true
    areaSqm?: true
    shapeArea?: true
    shapeLength?: true
  }

  export type LotMinAggregateInputType = {
    id?: true
    blockKey?: true
    blockNumber?: true
    sectionNumber?: true
    areaSqm?: true
    zoning?: true
    overlays?: true
    address?: true
    district?: true
    division?: true
    lifecycleStage?: true
    shapeArea?: true
    shapeLength?: true
    globalId?: true
    estateId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LotMaxAggregateInputType = {
    id?: true
    blockKey?: true
    blockNumber?: true
    sectionNumber?: true
    areaSqm?: true
    zoning?: true
    overlays?: true
    address?: true
    district?: true
    division?: true
    lifecycleStage?: true
    shapeArea?: true
    shapeLength?: true
    globalId?: true
    estateId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LotCountAggregateInputType = {
    id?: true
    blockKey?: true
    blockNumber?: true
    sectionNumber?: true
    areaSqm?: true
    zoning?: true
    overlays?: true
    address?: true
    district?: true
    division?: true
    lifecycleStage?: true
    shapeArea?: true
    shapeLength?: true
    globalId?: true
    geojson?: true
    estateId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Lot to aggregate.
     */
    where?: LotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lots to fetch.
     */
    orderBy?: LotOrderByWithRelationInput | LotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Lots
    **/
    _count?: true | LotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LotAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LotSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LotMaxAggregateInputType
  }

  export type GetLotAggregateType<T extends LotAggregateArgs> = {
        [P in keyof T & keyof AggregateLot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLot[P]>
      : GetScalarType<T[P], AggregateLot[P]>
  }




  export type LotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LotWhereInput
    orderBy?: LotOrderByWithAggregationInput | LotOrderByWithAggregationInput[]
    by: LotScalarFieldEnum[] | LotScalarFieldEnum
    having?: LotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LotCountAggregateInputType | true
    _avg?: LotAvgAggregateInputType
    _sum?: LotSumAggregateInputType
    _min?: LotMinAggregateInputType
    _max?: LotMaxAggregateInputType
  }

  export type LotGroupByOutputType = {
    id: string
    blockKey: string
    blockNumber: number | null
    sectionNumber: number | null
    areaSqm: number
    zoning: string
    overlays: string | null
    address: string | null
    district: string | null
    division: string | null
    lifecycleStage: string | null
    shapeArea: number | null
    shapeLength: number | null
    globalId: string | null
    geojson: JsonValue | null
    estateId: string | null
    createdAt: Date
    updatedAt: Date
    _count: LotCountAggregateOutputType | null
    _avg: LotAvgAggregateOutputType | null
    _sum: LotSumAggregateOutputType | null
    _min: LotMinAggregateOutputType | null
    _max: LotMaxAggregateOutputType | null
  }

  type GetLotGroupByPayload<T extends LotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LotGroupByOutputType[P]>
            : GetScalarType<T[P], LotGroupByOutputType[P]>
        }
      >
    >


  export type LotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    blockKey?: boolean
    blockNumber?: boolean
    sectionNumber?: boolean
    areaSqm?: boolean
    zoning?: boolean
    overlays?: boolean
    address?: boolean
    district?: boolean
    division?: boolean
    lifecycleStage?: boolean
    shapeArea?: boolean
    shapeLength?: boolean
    globalId?: boolean
    geojson?: boolean
    estateId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    estate?: boolean | Lot$estateArgs<ExtArgs>
  }, ExtArgs["result"]["lot"]>

  export type LotSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    blockKey?: boolean
    blockNumber?: boolean
    sectionNumber?: boolean
    areaSqm?: boolean
    zoning?: boolean
    overlays?: boolean
    address?: boolean
    district?: boolean
    division?: boolean
    lifecycleStage?: boolean
    shapeArea?: boolean
    shapeLength?: boolean
    globalId?: boolean
    geojson?: boolean
    estateId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    estate?: boolean | Lot$estateArgs<ExtArgs>
  }, ExtArgs["result"]["lot"]>

  export type LotSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    blockKey?: boolean
    blockNumber?: boolean
    sectionNumber?: boolean
    areaSqm?: boolean
    zoning?: boolean
    overlays?: boolean
    address?: boolean
    district?: boolean
    division?: boolean
    lifecycleStage?: boolean
    shapeArea?: boolean
    shapeLength?: boolean
    globalId?: boolean
    geojson?: boolean
    estateId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    estate?: boolean | Lot$estateArgs<ExtArgs>
  }, ExtArgs["result"]["lot"]>

  export type LotSelectScalar = {
    id?: boolean
    blockKey?: boolean
    blockNumber?: boolean
    sectionNumber?: boolean
    areaSqm?: boolean
    zoning?: boolean
    overlays?: boolean
    address?: boolean
    district?: boolean
    division?: boolean
    lifecycleStage?: boolean
    shapeArea?: boolean
    shapeLength?: boolean
    globalId?: boolean
    geojson?: boolean
    estateId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LotOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "blockKey" | "blockNumber" | "sectionNumber" | "areaSqm" | "zoning" | "overlays" | "address" | "district" | "division" | "lifecycleStage" | "shapeArea" | "shapeLength" | "globalId" | "geojson" | "estateId" | "createdAt" | "updatedAt", ExtArgs["result"]["lot"]>
  export type LotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    estate?: boolean | Lot$estateArgs<ExtArgs>
  }
  export type LotIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    estate?: boolean | Lot$estateArgs<ExtArgs>
  }
  export type LotIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    estate?: boolean | Lot$estateArgs<ExtArgs>
  }

  export type $LotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Lot"
    objects: {
      estate: Prisma.$EstatePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      blockKey: string
      blockNumber: number | null
      sectionNumber: number | null
      areaSqm: number
      zoning: string
      overlays: string | null
      address: string | null
      district: string | null
      division: string | null
      lifecycleStage: string | null
      shapeArea: number | null
      shapeLength: number | null
      globalId: string | null
      geojson: Prisma.JsonValue | null
      estateId: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["lot"]>
    composites: {}
  }

  type LotGetPayload<S extends boolean | null | undefined | LotDefaultArgs> = $Result.GetResult<Prisma.$LotPayload, S>

  type LotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LotFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LotCountAggregateInputType | true
    }

  export interface LotDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Lot'], meta: { name: 'Lot' } }
    /**
     * Find zero or one Lot that matches the filter.
     * @param {LotFindUniqueArgs} args - Arguments to find a Lot
     * @example
     * // Get one Lot
     * const lot = await prisma.lot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LotFindUniqueArgs>(args: SelectSubset<T, LotFindUniqueArgs<ExtArgs>>): Prisma__LotClient<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Lot that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LotFindUniqueOrThrowArgs} args - Arguments to find a Lot
     * @example
     * // Get one Lot
     * const lot = await prisma.lot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LotFindUniqueOrThrowArgs>(args: SelectSubset<T, LotFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LotClient<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Lot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LotFindFirstArgs} args - Arguments to find a Lot
     * @example
     * // Get one Lot
     * const lot = await prisma.lot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LotFindFirstArgs>(args?: SelectSubset<T, LotFindFirstArgs<ExtArgs>>): Prisma__LotClient<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Lot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LotFindFirstOrThrowArgs} args - Arguments to find a Lot
     * @example
     * // Get one Lot
     * const lot = await prisma.lot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LotFindFirstOrThrowArgs>(args?: SelectSubset<T, LotFindFirstOrThrowArgs<ExtArgs>>): Prisma__LotClient<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Lots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Lots
     * const lots = await prisma.lot.findMany()
     * 
     * // Get first 10 Lots
     * const lots = await prisma.lot.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const lotWithIdOnly = await prisma.lot.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LotFindManyArgs>(args?: SelectSubset<T, LotFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Lot.
     * @param {LotCreateArgs} args - Arguments to create a Lot.
     * @example
     * // Create one Lot
     * const Lot = await prisma.lot.create({
     *   data: {
     *     // ... data to create a Lot
     *   }
     * })
     * 
     */
    create<T extends LotCreateArgs>(args: SelectSubset<T, LotCreateArgs<ExtArgs>>): Prisma__LotClient<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Lots.
     * @param {LotCreateManyArgs} args - Arguments to create many Lots.
     * @example
     * // Create many Lots
     * const lot = await prisma.lot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LotCreateManyArgs>(args?: SelectSubset<T, LotCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Lots and returns the data saved in the database.
     * @param {LotCreateManyAndReturnArgs} args - Arguments to create many Lots.
     * @example
     * // Create many Lots
     * const lot = await prisma.lot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Lots and only return the `id`
     * const lotWithIdOnly = await prisma.lot.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LotCreateManyAndReturnArgs>(args?: SelectSubset<T, LotCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Lot.
     * @param {LotDeleteArgs} args - Arguments to delete one Lot.
     * @example
     * // Delete one Lot
     * const Lot = await prisma.lot.delete({
     *   where: {
     *     // ... filter to delete one Lot
     *   }
     * })
     * 
     */
    delete<T extends LotDeleteArgs>(args: SelectSubset<T, LotDeleteArgs<ExtArgs>>): Prisma__LotClient<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Lot.
     * @param {LotUpdateArgs} args - Arguments to update one Lot.
     * @example
     * // Update one Lot
     * const lot = await prisma.lot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LotUpdateArgs>(args: SelectSubset<T, LotUpdateArgs<ExtArgs>>): Prisma__LotClient<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Lots.
     * @param {LotDeleteManyArgs} args - Arguments to filter Lots to delete.
     * @example
     * // Delete a few Lots
     * const { count } = await prisma.lot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LotDeleteManyArgs>(args?: SelectSubset<T, LotDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Lots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Lots
     * const lot = await prisma.lot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LotUpdateManyArgs>(args: SelectSubset<T, LotUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Lots and returns the data updated in the database.
     * @param {LotUpdateManyAndReturnArgs} args - Arguments to update many Lots.
     * @example
     * // Update many Lots
     * const lot = await prisma.lot.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Lots and only return the `id`
     * const lotWithIdOnly = await prisma.lot.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LotUpdateManyAndReturnArgs>(args: SelectSubset<T, LotUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Lot.
     * @param {LotUpsertArgs} args - Arguments to update or create a Lot.
     * @example
     * // Update or create a Lot
     * const lot = await prisma.lot.upsert({
     *   create: {
     *     // ... data to create a Lot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Lot we want to update
     *   }
     * })
     */
    upsert<T extends LotUpsertArgs>(args: SelectSubset<T, LotUpsertArgs<ExtArgs>>): Prisma__LotClient<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Lots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LotCountArgs} args - Arguments to filter Lots to count.
     * @example
     * // Count the number of Lots
     * const count = await prisma.lot.count({
     *   where: {
     *     // ... the filter for the Lots we want to count
     *   }
     * })
    **/
    count<T extends LotCountArgs>(
      args?: Subset<T, LotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Lot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LotAggregateArgs>(args: Subset<T, LotAggregateArgs>): Prisma.PrismaPromise<GetLotAggregateType<T>>

    /**
     * Group by Lot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LotGroupByArgs['orderBy'] }
        : { orderBy?: LotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Lot model
   */
  readonly fields: LotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Lot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LotClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    estate<T extends Lot$estateArgs<ExtArgs> = {}>(args?: Subset<T, Lot$estateArgs<ExtArgs>>): Prisma__EstateClient<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Lot model
   */
  interface LotFieldRefs {
    readonly id: FieldRef<"Lot", 'String'>
    readonly blockKey: FieldRef<"Lot", 'String'>
    readonly blockNumber: FieldRef<"Lot", 'Int'>
    readonly sectionNumber: FieldRef<"Lot", 'Int'>
    readonly areaSqm: FieldRef<"Lot", 'Float'>
    readonly zoning: FieldRef<"Lot", 'String'>
    readonly overlays: FieldRef<"Lot", 'String'>
    readonly address: FieldRef<"Lot", 'String'>
    readonly district: FieldRef<"Lot", 'String'>
    readonly division: FieldRef<"Lot", 'String'>
    readonly lifecycleStage: FieldRef<"Lot", 'String'>
    readonly shapeArea: FieldRef<"Lot", 'Float'>
    readonly shapeLength: FieldRef<"Lot", 'Float'>
    readonly globalId: FieldRef<"Lot", 'String'>
    readonly geojson: FieldRef<"Lot", 'Json'>
    readonly estateId: FieldRef<"Lot", 'String'>
    readonly createdAt: FieldRef<"Lot", 'DateTime'>
    readonly updatedAt: FieldRef<"Lot", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Lot findUnique
   */
  export type LotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    /**
     * Filter, which Lot to fetch.
     */
    where: LotWhereUniqueInput
  }

  /**
   * Lot findUniqueOrThrow
   */
  export type LotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    /**
     * Filter, which Lot to fetch.
     */
    where: LotWhereUniqueInput
  }

  /**
   * Lot findFirst
   */
  export type LotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    /**
     * Filter, which Lot to fetch.
     */
    where?: LotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lots to fetch.
     */
    orderBy?: LotOrderByWithRelationInput | LotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Lots.
     */
    cursor?: LotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Lots.
     */
    distinct?: LotScalarFieldEnum | LotScalarFieldEnum[]
  }

  /**
   * Lot findFirstOrThrow
   */
  export type LotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    /**
     * Filter, which Lot to fetch.
     */
    where?: LotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lots to fetch.
     */
    orderBy?: LotOrderByWithRelationInput | LotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Lots.
     */
    cursor?: LotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Lots.
     */
    distinct?: LotScalarFieldEnum | LotScalarFieldEnum[]
  }

  /**
   * Lot findMany
   */
  export type LotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    /**
     * Filter, which Lots to fetch.
     */
    where?: LotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Lots to fetch.
     */
    orderBy?: LotOrderByWithRelationInput | LotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Lots.
     */
    cursor?: LotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Lots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Lots.
     */
    skip?: number
    distinct?: LotScalarFieldEnum | LotScalarFieldEnum[]
  }

  /**
   * Lot create
   */
  export type LotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    /**
     * The data needed to create a Lot.
     */
    data: XOR<LotCreateInput, LotUncheckedCreateInput>
  }

  /**
   * Lot createMany
   */
  export type LotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Lots.
     */
    data: LotCreateManyInput | LotCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Lot createManyAndReturn
   */
  export type LotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * The data used to create many Lots.
     */
    data: LotCreateManyInput | LotCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Lot update
   */
  export type LotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    /**
     * The data needed to update a Lot.
     */
    data: XOR<LotUpdateInput, LotUncheckedUpdateInput>
    /**
     * Choose, which Lot to update.
     */
    where: LotWhereUniqueInput
  }

  /**
   * Lot updateMany
   */
  export type LotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Lots.
     */
    data: XOR<LotUpdateManyMutationInput, LotUncheckedUpdateManyInput>
    /**
     * Filter which Lots to update
     */
    where?: LotWhereInput
    /**
     * Limit how many Lots to update.
     */
    limit?: number
  }

  /**
   * Lot updateManyAndReturn
   */
  export type LotUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * The data used to update Lots.
     */
    data: XOR<LotUpdateManyMutationInput, LotUncheckedUpdateManyInput>
    /**
     * Filter which Lots to update
     */
    where?: LotWhereInput
    /**
     * Limit how many Lots to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Lot upsert
   */
  export type LotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    /**
     * The filter to search for the Lot to update in case it exists.
     */
    where: LotWhereUniqueInput
    /**
     * In case the Lot found by the `where` argument doesn't exist, create a new Lot with this data.
     */
    create: XOR<LotCreateInput, LotUncheckedCreateInput>
    /**
     * In case the Lot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LotUpdateInput, LotUncheckedUpdateInput>
  }

  /**
   * Lot delete
   */
  export type LotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    /**
     * Filter which Lot to delete.
     */
    where: LotWhereUniqueInput
  }

  /**
   * Lot deleteMany
   */
  export type LotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Lots to delete
     */
    where?: LotWhereInput
    /**
     * Limit how many Lots to delete.
     */
    limit?: number
  }

  /**
   * Lot.estate
   */
  export type Lot$estateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    where?: EstateWhereInput
  }

  /**
   * Lot without action
   */
  export type LotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
  }


  /**
   * Model Estate
   */

  export type AggregateEstate = {
    _count: EstateCountAggregateOutputType | null
    _min: EstateMinAggregateOutputType | null
    _max: EstateMaxAggregateOutputType | null
  }

  export type EstateMinAggregateOutputType = {
    id: string | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EstateMaxAggregateOutputType = {
    id: string | null
    name: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EstateCountAggregateOutputType = {
    id: number
    name: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EstateMinAggregateInputType = {
    id?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EstateMaxAggregateInputType = {
    id?: true
    name?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EstateCountAggregateInputType = {
    id?: true
    name?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EstateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Estate to aggregate.
     */
    where?: EstateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Estates to fetch.
     */
    orderBy?: EstateOrderByWithRelationInput | EstateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EstateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Estates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Estates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Estates
    **/
    _count?: true | EstateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EstateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EstateMaxAggregateInputType
  }

  export type GetEstateAggregateType<T extends EstateAggregateArgs> = {
        [P in keyof T & keyof AggregateEstate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEstate[P]>
      : GetScalarType<T[P], AggregateEstate[P]>
  }




  export type EstateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EstateWhereInput
    orderBy?: EstateOrderByWithAggregationInput | EstateOrderByWithAggregationInput[]
    by: EstateScalarFieldEnum[] | EstateScalarFieldEnum
    having?: EstateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EstateCountAggregateInputType | true
    _min?: EstateMinAggregateInputType
    _max?: EstateMaxAggregateInputType
  }

  export type EstateGroupByOutputType = {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    _count: EstateCountAggregateOutputType | null
    _min: EstateMinAggregateOutputType | null
    _max: EstateMaxAggregateOutputType | null
  }

  type GetEstateGroupByPayload<T extends EstateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EstateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EstateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EstateGroupByOutputType[P]>
            : GetScalarType<T[P], EstateGroupByOutputType[P]>
        }
      >
    >


  export type EstateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lots?: boolean | Estate$lotsArgs<ExtArgs>
    _count?: boolean | EstateCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["estate"]>

  export type EstateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["estate"]>

  export type EstateSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["estate"]>

  export type EstateSelectScalar = {
    id?: boolean
    name?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EstateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "createdAt" | "updatedAt", ExtArgs["result"]["estate"]>
  export type EstateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lots?: boolean | Estate$lotsArgs<ExtArgs>
    _count?: boolean | EstateCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type EstateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type EstateIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $EstatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Estate"
    objects: {
      lots: Prisma.$LotPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["estate"]>
    composites: {}
  }

  type EstateGetPayload<S extends boolean | null | undefined | EstateDefaultArgs> = $Result.GetResult<Prisma.$EstatePayload, S>

  type EstateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EstateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EstateCountAggregateInputType | true
    }

  export interface EstateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Estate'], meta: { name: 'Estate' } }
    /**
     * Find zero or one Estate that matches the filter.
     * @param {EstateFindUniqueArgs} args - Arguments to find a Estate
     * @example
     * // Get one Estate
     * const estate = await prisma.estate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EstateFindUniqueArgs>(args: SelectSubset<T, EstateFindUniqueArgs<ExtArgs>>): Prisma__EstateClient<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Estate that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EstateFindUniqueOrThrowArgs} args - Arguments to find a Estate
     * @example
     * // Get one Estate
     * const estate = await prisma.estate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EstateFindUniqueOrThrowArgs>(args: SelectSubset<T, EstateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EstateClient<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Estate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstateFindFirstArgs} args - Arguments to find a Estate
     * @example
     * // Get one Estate
     * const estate = await prisma.estate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EstateFindFirstArgs>(args?: SelectSubset<T, EstateFindFirstArgs<ExtArgs>>): Prisma__EstateClient<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Estate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstateFindFirstOrThrowArgs} args - Arguments to find a Estate
     * @example
     * // Get one Estate
     * const estate = await prisma.estate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EstateFindFirstOrThrowArgs>(args?: SelectSubset<T, EstateFindFirstOrThrowArgs<ExtArgs>>): Prisma__EstateClient<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Estates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Estates
     * const estates = await prisma.estate.findMany()
     * 
     * // Get first 10 Estates
     * const estates = await prisma.estate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const estateWithIdOnly = await prisma.estate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EstateFindManyArgs>(args?: SelectSubset<T, EstateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Estate.
     * @param {EstateCreateArgs} args - Arguments to create a Estate.
     * @example
     * // Create one Estate
     * const Estate = await prisma.estate.create({
     *   data: {
     *     // ... data to create a Estate
     *   }
     * })
     * 
     */
    create<T extends EstateCreateArgs>(args: SelectSubset<T, EstateCreateArgs<ExtArgs>>): Prisma__EstateClient<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Estates.
     * @param {EstateCreateManyArgs} args - Arguments to create many Estates.
     * @example
     * // Create many Estates
     * const estate = await prisma.estate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EstateCreateManyArgs>(args?: SelectSubset<T, EstateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Estates and returns the data saved in the database.
     * @param {EstateCreateManyAndReturnArgs} args - Arguments to create many Estates.
     * @example
     * // Create many Estates
     * const estate = await prisma.estate.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Estates and only return the `id`
     * const estateWithIdOnly = await prisma.estate.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EstateCreateManyAndReturnArgs>(args?: SelectSubset<T, EstateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Estate.
     * @param {EstateDeleteArgs} args - Arguments to delete one Estate.
     * @example
     * // Delete one Estate
     * const Estate = await prisma.estate.delete({
     *   where: {
     *     // ... filter to delete one Estate
     *   }
     * })
     * 
     */
    delete<T extends EstateDeleteArgs>(args: SelectSubset<T, EstateDeleteArgs<ExtArgs>>): Prisma__EstateClient<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Estate.
     * @param {EstateUpdateArgs} args - Arguments to update one Estate.
     * @example
     * // Update one Estate
     * const estate = await prisma.estate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EstateUpdateArgs>(args: SelectSubset<T, EstateUpdateArgs<ExtArgs>>): Prisma__EstateClient<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Estates.
     * @param {EstateDeleteManyArgs} args - Arguments to filter Estates to delete.
     * @example
     * // Delete a few Estates
     * const { count } = await prisma.estate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EstateDeleteManyArgs>(args?: SelectSubset<T, EstateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Estates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Estates
     * const estate = await prisma.estate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EstateUpdateManyArgs>(args: SelectSubset<T, EstateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Estates and returns the data updated in the database.
     * @param {EstateUpdateManyAndReturnArgs} args - Arguments to update many Estates.
     * @example
     * // Update many Estates
     * const estate = await prisma.estate.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Estates and only return the `id`
     * const estateWithIdOnly = await prisma.estate.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EstateUpdateManyAndReturnArgs>(args: SelectSubset<T, EstateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Estate.
     * @param {EstateUpsertArgs} args - Arguments to update or create a Estate.
     * @example
     * // Update or create a Estate
     * const estate = await prisma.estate.upsert({
     *   create: {
     *     // ... data to create a Estate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Estate we want to update
     *   }
     * })
     */
    upsert<T extends EstateUpsertArgs>(args: SelectSubset<T, EstateUpsertArgs<ExtArgs>>): Prisma__EstateClient<$Result.GetResult<Prisma.$EstatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Estates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstateCountArgs} args - Arguments to filter Estates to count.
     * @example
     * // Count the number of Estates
     * const count = await prisma.estate.count({
     *   where: {
     *     // ... the filter for the Estates we want to count
     *   }
     * })
    **/
    count<T extends EstateCountArgs>(
      args?: Subset<T, EstateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EstateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Estate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EstateAggregateArgs>(args: Subset<T, EstateAggregateArgs>): Prisma.PrismaPromise<GetEstateAggregateType<T>>

    /**
     * Group by Estate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EstateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EstateGroupByArgs['orderBy'] }
        : { orderBy?: EstateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EstateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEstateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Estate model
   */
  readonly fields: EstateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Estate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EstateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    lots<T extends Estate$lotsArgs<ExtArgs> = {}>(args?: Subset<T, Estate$lotsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Estate model
   */
  interface EstateFieldRefs {
    readonly id: FieldRef<"Estate", 'String'>
    readonly name: FieldRef<"Estate", 'String'>
    readonly createdAt: FieldRef<"Estate", 'DateTime'>
    readonly updatedAt: FieldRef<"Estate", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Estate findUnique
   */
  export type EstateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    /**
     * Filter, which Estate to fetch.
     */
    where: EstateWhereUniqueInput
  }

  /**
   * Estate findUniqueOrThrow
   */
  export type EstateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    /**
     * Filter, which Estate to fetch.
     */
    where: EstateWhereUniqueInput
  }

  /**
   * Estate findFirst
   */
  export type EstateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    /**
     * Filter, which Estate to fetch.
     */
    where?: EstateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Estates to fetch.
     */
    orderBy?: EstateOrderByWithRelationInput | EstateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Estates.
     */
    cursor?: EstateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Estates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Estates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Estates.
     */
    distinct?: EstateScalarFieldEnum | EstateScalarFieldEnum[]
  }

  /**
   * Estate findFirstOrThrow
   */
  export type EstateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    /**
     * Filter, which Estate to fetch.
     */
    where?: EstateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Estates to fetch.
     */
    orderBy?: EstateOrderByWithRelationInput | EstateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Estates.
     */
    cursor?: EstateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Estates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Estates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Estates.
     */
    distinct?: EstateScalarFieldEnum | EstateScalarFieldEnum[]
  }

  /**
   * Estate findMany
   */
  export type EstateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    /**
     * Filter, which Estates to fetch.
     */
    where?: EstateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Estates to fetch.
     */
    orderBy?: EstateOrderByWithRelationInput | EstateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Estates.
     */
    cursor?: EstateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Estates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Estates.
     */
    skip?: number
    distinct?: EstateScalarFieldEnum | EstateScalarFieldEnum[]
  }

  /**
   * Estate create
   */
  export type EstateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    /**
     * The data needed to create a Estate.
     */
    data: XOR<EstateCreateInput, EstateUncheckedCreateInput>
  }

  /**
   * Estate createMany
   */
  export type EstateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Estates.
     */
    data: EstateCreateManyInput | EstateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Estate createManyAndReturn
   */
  export type EstateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * The data used to create many Estates.
     */
    data: EstateCreateManyInput | EstateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Estate update
   */
  export type EstateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    /**
     * The data needed to update a Estate.
     */
    data: XOR<EstateUpdateInput, EstateUncheckedUpdateInput>
    /**
     * Choose, which Estate to update.
     */
    where: EstateWhereUniqueInput
  }

  /**
   * Estate updateMany
   */
  export type EstateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Estates.
     */
    data: XOR<EstateUpdateManyMutationInput, EstateUncheckedUpdateManyInput>
    /**
     * Filter which Estates to update
     */
    where?: EstateWhereInput
    /**
     * Limit how many Estates to update.
     */
    limit?: number
  }

  /**
   * Estate updateManyAndReturn
   */
  export type EstateUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * The data used to update Estates.
     */
    data: XOR<EstateUpdateManyMutationInput, EstateUncheckedUpdateManyInput>
    /**
     * Filter which Estates to update
     */
    where?: EstateWhereInput
    /**
     * Limit how many Estates to update.
     */
    limit?: number
  }

  /**
   * Estate upsert
   */
  export type EstateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    /**
     * The filter to search for the Estate to update in case it exists.
     */
    where: EstateWhereUniqueInput
    /**
     * In case the Estate found by the `where` argument doesn't exist, create a new Estate with this data.
     */
    create: XOR<EstateCreateInput, EstateUncheckedCreateInput>
    /**
     * In case the Estate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EstateUpdateInput, EstateUncheckedUpdateInput>
  }

  /**
   * Estate delete
   */
  export type EstateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
    /**
     * Filter which Estate to delete.
     */
    where: EstateWhereUniqueInput
  }

  /**
   * Estate deleteMany
   */
  export type EstateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Estates to delete
     */
    where?: EstateWhereInput
    /**
     * Limit how many Estates to delete.
     */
    limit?: number
  }

  /**
   * Estate.lots
   */
  export type Estate$lotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Lot
     */
    select?: LotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Lot
     */
    omit?: LotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LotInclude<ExtArgs> | null
    where?: LotWhereInput
    orderBy?: LotOrderByWithRelationInput | LotOrderByWithRelationInput[]
    cursor?: LotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LotScalarFieldEnum | LotScalarFieldEnum[]
  }

  /**
   * Estate without action
   */
  export type EstateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Estate
     */
    select?: EstateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Estate
     */
    omit?: EstateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstateInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const LotScalarFieldEnum: {
    id: 'id',
    blockKey: 'blockKey',
    blockNumber: 'blockNumber',
    sectionNumber: 'sectionNumber',
    areaSqm: 'areaSqm',
    zoning: 'zoning',
    overlays: 'overlays',
    address: 'address',
    district: 'district',
    division: 'division',
    lifecycleStage: 'lifecycleStage',
    shapeArea: 'shapeArea',
    shapeLength: 'shapeLength',
    globalId: 'globalId',
    geojson: 'geojson',
    estateId: 'estateId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LotScalarFieldEnum = (typeof LotScalarFieldEnum)[keyof typeof LotScalarFieldEnum]


  export const EstateScalarFieldEnum: {
    id: 'id',
    name: 'name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type EstateScalarFieldEnum = (typeof EstateScalarFieldEnum)[keyof typeof EstateScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    
  /**
   * Deep Input Types
   */


  export type LotWhereInput = {
    AND?: LotWhereInput | LotWhereInput[]
    OR?: LotWhereInput[]
    NOT?: LotWhereInput | LotWhereInput[]
    id?: StringFilter<"Lot"> | string
    blockKey?: StringFilter<"Lot"> | string
    blockNumber?: IntNullableFilter<"Lot"> | number | null
    sectionNumber?: IntNullableFilter<"Lot"> | number | null
    areaSqm?: FloatFilter<"Lot"> | number
    zoning?: StringFilter<"Lot"> | string
    overlays?: StringNullableFilter<"Lot"> | string | null
    address?: StringNullableFilter<"Lot"> | string | null
    district?: StringNullableFilter<"Lot"> | string | null
    division?: StringNullableFilter<"Lot"> | string | null
    lifecycleStage?: StringNullableFilter<"Lot"> | string | null
    shapeArea?: FloatNullableFilter<"Lot"> | number | null
    shapeLength?: FloatNullableFilter<"Lot"> | number | null
    globalId?: StringNullableFilter<"Lot"> | string | null
    geojson?: JsonNullableFilter<"Lot">
    estateId?: StringNullableFilter<"Lot"> | string | null
    createdAt?: DateTimeFilter<"Lot"> | Date | string
    updatedAt?: DateTimeFilter<"Lot"> | Date | string
    estate?: XOR<EstateNullableScalarRelationFilter, EstateWhereInput> | null
  }

  export type LotOrderByWithRelationInput = {
    id?: SortOrder
    blockKey?: SortOrder
    blockNumber?: SortOrderInput | SortOrder
    sectionNumber?: SortOrderInput | SortOrder
    areaSqm?: SortOrder
    zoning?: SortOrder
    overlays?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    district?: SortOrderInput | SortOrder
    division?: SortOrderInput | SortOrder
    lifecycleStage?: SortOrderInput | SortOrder
    shapeArea?: SortOrderInput | SortOrder
    shapeLength?: SortOrderInput | SortOrder
    globalId?: SortOrderInput | SortOrder
    geojson?: SortOrderInput | SortOrder
    estateId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    estate?: EstateOrderByWithRelationInput
  }

  export type LotWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    blockKey?: string
    AND?: LotWhereInput | LotWhereInput[]
    OR?: LotWhereInput[]
    NOT?: LotWhereInput | LotWhereInput[]
    blockNumber?: IntNullableFilter<"Lot"> | number | null
    sectionNumber?: IntNullableFilter<"Lot"> | number | null
    areaSqm?: FloatFilter<"Lot"> | number
    zoning?: StringFilter<"Lot"> | string
    overlays?: StringNullableFilter<"Lot"> | string | null
    address?: StringNullableFilter<"Lot"> | string | null
    district?: StringNullableFilter<"Lot"> | string | null
    division?: StringNullableFilter<"Lot"> | string | null
    lifecycleStage?: StringNullableFilter<"Lot"> | string | null
    shapeArea?: FloatNullableFilter<"Lot"> | number | null
    shapeLength?: FloatNullableFilter<"Lot"> | number | null
    globalId?: StringNullableFilter<"Lot"> | string | null
    geojson?: JsonNullableFilter<"Lot">
    estateId?: StringNullableFilter<"Lot"> | string | null
    createdAt?: DateTimeFilter<"Lot"> | Date | string
    updatedAt?: DateTimeFilter<"Lot"> | Date | string
    estate?: XOR<EstateNullableScalarRelationFilter, EstateWhereInput> | null
  }, "id" | "blockKey">

  export type LotOrderByWithAggregationInput = {
    id?: SortOrder
    blockKey?: SortOrder
    blockNumber?: SortOrderInput | SortOrder
    sectionNumber?: SortOrderInput | SortOrder
    areaSqm?: SortOrder
    zoning?: SortOrder
    overlays?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    district?: SortOrderInput | SortOrder
    division?: SortOrderInput | SortOrder
    lifecycleStage?: SortOrderInput | SortOrder
    shapeArea?: SortOrderInput | SortOrder
    shapeLength?: SortOrderInput | SortOrder
    globalId?: SortOrderInput | SortOrder
    geojson?: SortOrderInput | SortOrder
    estateId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LotCountOrderByAggregateInput
    _avg?: LotAvgOrderByAggregateInput
    _max?: LotMaxOrderByAggregateInput
    _min?: LotMinOrderByAggregateInput
    _sum?: LotSumOrderByAggregateInput
  }

  export type LotScalarWhereWithAggregatesInput = {
    AND?: LotScalarWhereWithAggregatesInput | LotScalarWhereWithAggregatesInput[]
    OR?: LotScalarWhereWithAggregatesInput[]
    NOT?: LotScalarWhereWithAggregatesInput | LotScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Lot"> | string
    blockKey?: StringWithAggregatesFilter<"Lot"> | string
    blockNumber?: IntNullableWithAggregatesFilter<"Lot"> | number | null
    sectionNumber?: IntNullableWithAggregatesFilter<"Lot"> | number | null
    areaSqm?: FloatWithAggregatesFilter<"Lot"> | number
    zoning?: StringWithAggregatesFilter<"Lot"> | string
    overlays?: StringNullableWithAggregatesFilter<"Lot"> | string | null
    address?: StringNullableWithAggregatesFilter<"Lot"> | string | null
    district?: StringNullableWithAggregatesFilter<"Lot"> | string | null
    division?: StringNullableWithAggregatesFilter<"Lot"> | string | null
    lifecycleStage?: StringNullableWithAggregatesFilter<"Lot"> | string | null
    shapeArea?: FloatNullableWithAggregatesFilter<"Lot"> | number | null
    shapeLength?: FloatNullableWithAggregatesFilter<"Lot"> | number | null
    globalId?: StringNullableWithAggregatesFilter<"Lot"> | string | null
    geojson?: JsonNullableWithAggregatesFilter<"Lot">
    estateId?: StringNullableWithAggregatesFilter<"Lot"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Lot"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Lot"> | Date | string
  }

  export type EstateWhereInput = {
    AND?: EstateWhereInput | EstateWhereInput[]
    OR?: EstateWhereInput[]
    NOT?: EstateWhereInput | EstateWhereInput[]
    id?: StringFilter<"Estate"> | string
    name?: StringFilter<"Estate"> | string
    createdAt?: DateTimeFilter<"Estate"> | Date | string
    updatedAt?: DateTimeFilter<"Estate"> | Date | string
    lots?: LotListRelationFilter
  }

  export type EstateOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lots?: LotOrderByRelationAggregateInput
  }

  export type EstateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EstateWhereInput | EstateWhereInput[]
    OR?: EstateWhereInput[]
    NOT?: EstateWhereInput | EstateWhereInput[]
    name?: StringFilter<"Estate"> | string
    createdAt?: DateTimeFilter<"Estate"> | Date | string
    updatedAt?: DateTimeFilter<"Estate"> | Date | string
    lots?: LotListRelationFilter
  }, "id">

  export type EstateOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EstateCountOrderByAggregateInput
    _max?: EstateMaxOrderByAggregateInput
    _min?: EstateMinOrderByAggregateInput
  }

  export type EstateScalarWhereWithAggregatesInput = {
    AND?: EstateScalarWhereWithAggregatesInput | EstateScalarWhereWithAggregatesInput[]
    OR?: EstateScalarWhereWithAggregatesInput[]
    NOT?: EstateScalarWhereWithAggregatesInput | EstateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Estate"> | string
    name?: StringWithAggregatesFilter<"Estate"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Estate"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Estate"> | Date | string
  }

  export type LotCreateInput = {
    id?: string
    blockKey: string
    blockNumber?: number | null
    sectionNumber?: number | null
    areaSqm: number
    zoning: string
    overlays?: string | null
    address?: string | null
    district?: string | null
    division?: string | null
    lifecycleStage?: string | null
    shapeArea?: number | null
    shapeLength?: number | null
    globalId?: string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    estate?: EstateCreateNestedOneWithoutLotsInput
  }

  export type LotUncheckedCreateInput = {
    id?: string
    blockKey: string
    blockNumber?: number | null
    sectionNumber?: number | null
    areaSqm: number
    zoning: string
    overlays?: string | null
    address?: string | null
    district?: string | null
    division?: string | null
    lifecycleStage?: string | null
    shapeArea?: number | null
    shapeLength?: number | null
    globalId?: string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    estateId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LotUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    blockKey?: StringFieldUpdateOperationsInput | string
    blockNumber?: NullableIntFieldUpdateOperationsInput | number | null
    sectionNumber?: NullableIntFieldUpdateOperationsInput | number | null
    areaSqm?: FloatFieldUpdateOperationsInput | number
    zoning?: StringFieldUpdateOperationsInput | string
    overlays?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    division?: NullableStringFieldUpdateOperationsInput | string | null
    lifecycleStage?: NullableStringFieldUpdateOperationsInput | string | null
    shapeArea?: NullableFloatFieldUpdateOperationsInput | number | null
    shapeLength?: NullableFloatFieldUpdateOperationsInput | number | null
    globalId?: NullableStringFieldUpdateOperationsInput | string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    estate?: EstateUpdateOneWithoutLotsNestedInput
  }

  export type LotUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    blockKey?: StringFieldUpdateOperationsInput | string
    blockNumber?: NullableIntFieldUpdateOperationsInput | number | null
    sectionNumber?: NullableIntFieldUpdateOperationsInput | number | null
    areaSqm?: FloatFieldUpdateOperationsInput | number
    zoning?: StringFieldUpdateOperationsInput | string
    overlays?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    division?: NullableStringFieldUpdateOperationsInput | string | null
    lifecycleStage?: NullableStringFieldUpdateOperationsInput | string | null
    shapeArea?: NullableFloatFieldUpdateOperationsInput | number | null
    shapeLength?: NullableFloatFieldUpdateOperationsInput | number | null
    globalId?: NullableStringFieldUpdateOperationsInput | string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    estateId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LotCreateManyInput = {
    id?: string
    blockKey: string
    blockNumber?: number | null
    sectionNumber?: number | null
    areaSqm: number
    zoning: string
    overlays?: string | null
    address?: string | null
    district?: string | null
    division?: string | null
    lifecycleStage?: string | null
    shapeArea?: number | null
    shapeLength?: number | null
    globalId?: string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    estateId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LotUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    blockKey?: StringFieldUpdateOperationsInput | string
    blockNumber?: NullableIntFieldUpdateOperationsInput | number | null
    sectionNumber?: NullableIntFieldUpdateOperationsInput | number | null
    areaSqm?: FloatFieldUpdateOperationsInput | number
    zoning?: StringFieldUpdateOperationsInput | string
    overlays?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    division?: NullableStringFieldUpdateOperationsInput | string | null
    lifecycleStage?: NullableStringFieldUpdateOperationsInput | string | null
    shapeArea?: NullableFloatFieldUpdateOperationsInput | number | null
    shapeLength?: NullableFloatFieldUpdateOperationsInput | number | null
    globalId?: NullableStringFieldUpdateOperationsInput | string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LotUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    blockKey?: StringFieldUpdateOperationsInput | string
    blockNumber?: NullableIntFieldUpdateOperationsInput | number | null
    sectionNumber?: NullableIntFieldUpdateOperationsInput | number | null
    areaSqm?: FloatFieldUpdateOperationsInput | number
    zoning?: StringFieldUpdateOperationsInput | string
    overlays?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    division?: NullableStringFieldUpdateOperationsInput | string | null
    lifecycleStage?: NullableStringFieldUpdateOperationsInput | string | null
    shapeArea?: NullableFloatFieldUpdateOperationsInput | number | null
    shapeLength?: NullableFloatFieldUpdateOperationsInput | number | null
    globalId?: NullableStringFieldUpdateOperationsInput | string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    estateId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstateCreateInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lots?: LotCreateNestedManyWithoutEstateInput
  }

  export type EstateUncheckedCreateInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
    lots?: LotUncheckedCreateNestedManyWithoutEstateInput
  }

  export type EstateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lots?: LotUpdateManyWithoutEstateNestedInput
  }

  export type EstateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lots?: LotUncheckedUpdateManyWithoutEstateNestedInput
  }

  export type EstateCreateManyInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EstateNullableScalarRelationFilter = {
    is?: EstateWhereInput | null
    isNot?: EstateWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type LotCountOrderByAggregateInput = {
    id?: SortOrder
    blockKey?: SortOrder
    blockNumber?: SortOrder
    sectionNumber?: SortOrder
    areaSqm?: SortOrder
    zoning?: SortOrder
    overlays?: SortOrder
    address?: SortOrder
    district?: SortOrder
    division?: SortOrder
    lifecycleStage?: SortOrder
    shapeArea?: SortOrder
    shapeLength?: SortOrder
    globalId?: SortOrder
    geojson?: SortOrder
    estateId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LotAvgOrderByAggregateInput = {
    blockNumber?: SortOrder
    sectionNumber?: SortOrder
    areaSqm?: SortOrder
    shapeArea?: SortOrder
    shapeLength?: SortOrder
  }

  export type LotMaxOrderByAggregateInput = {
    id?: SortOrder
    blockKey?: SortOrder
    blockNumber?: SortOrder
    sectionNumber?: SortOrder
    areaSqm?: SortOrder
    zoning?: SortOrder
    overlays?: SortOrder
    address?: SortOrder
    district?: SortOrder
    division?: SortOrder
    lifecycleStage?: SortOrder
    shapeArea?: SortOrder
    shapeLength?: SortOrder
    globalId?: SortOrder
    estateId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LotMinOrderByAggregateInput = {
    id?: SortOrder
    blockKey?: SortOrder
    blockNumber?: SortOrder
    sectionNumber?: SortOrder
    areaSqm?: SortOrder
    zoning?: SortOrder
    overlays?: SortOrder
    address?: SortOrder
    district?: SortOrder
    division?: SortOrder
    lifecycleStage?: SortOrder
    shapeArea?: SortOrder
    shapeLength?: SortOrder
    globalId?: SortOrder
    estateId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LotSumOrderByAggregateInput = {
    blockNumber?: SortOrder
    sectionNumber?: SortOrder
    areaSqm?: SortOrder
    shapeArea?: SortOrder
    shapeLength?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type LotListRelationFilter = {
    every?: LotWhereInput
    some?: LotWhereInput
    none?: LotWhereInput
  }

  export type LotOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EstateCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EstateMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EstateMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EstateCreateNestedOneWithoutLotsInput = {
    create?: XOR<EstateCreateWithoutLotsInput, EstateUncheckedCreateWithoutLotsInput>
    connectOrCreate?: EstateCreateOrConnectWithoutLotsInput
    connect?: EstateWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EstateUpdateOneWithoutLotsNestedInput = {
    create?: XOR<EstateCreateWithoutLotsInput, EstateUncheckedCreateWithoutLotsInput>
    connectOrCreate?: EstateCreateOrConnectWithoutLotsInput
    upsert?: EstateUpsertWithoutLotsInput
    disconnect?: EstateWhereInput | boolean
    delete?: EstateWhereInput | boolean
    connect?: EstateWhereUniqueInput
    update?: XOR<XOR<EstateUpdateToOneWithWhereWithoutLotsInput, EstateUpdateWithoutLotsInput>, EstateUncheckedUpdateWithoutLotsInput>
  }

  export type LotCreateNestedManyWithoutEstateInput = {
    create?: XOR<LotCreateWithoutEstateInput, LotUncheckedCreateWithoutEstateInput> | LotCreateWithoutEstateInput[] | LotUncheckedCreateWithoutEstateInput[]
    connectOrCreate?: LotCreateOrConnectWithoutEstateInput | LotCreateOrConnectWithoutEstateInput[]
    createMany?: LotCreateManyEstateInputEnvelope
    connect?: LotWhereUniqueInput | LotWhereUniqueInput[]
  }

  export type LotUncheckedCreateNestedManyWithoutEstateInput = {
    create?: XOR<LotCreateWithoutEstateInput, LotUncheckedCreateWithoutEstateInput> | LotCreateWithoutEstateInput[] | LotUncheckedCreateWithoutEstateInput[]
    connectOrCreate?: LotCreateOrConnectWithoutEstateInput | LotCreateOrConnectWithoutEstateInput[]
    createMany?: LotCreateManyEstateInputEnvelope
    connect?: LotWhereUniqueInput | LotWhereUniqueInput[]
  }

  export type LotUpdateManyWithoutEstateNestedInput = {
    create?: XOR<LotCreateWithoutEstateInput, LotUncheckedCreateWithoutEstateInput> | LotCreateWithoutEstateInput[] | LotUncheckedCreateWithoutEstateInput[]
    connectOrCreate?: LotCreateOrConnectWithoutEstateInput | LotCreateOrConnectWithoutEstateInput[]
    upsert?: LotUpsertWithWhereUniqueWithoutEstateInput | LotUpsertWithWhereUniqueWithoutEstateInput[]
    createMany?: LotCreateManyEstateInputEnvelope
    set?: LotWhereUniqueInput | LotWhereUniqueInput[]
    disconnect?: LotWhereUniqueInput | LotWhereUniqueInput[]
    delete?: LotWhereUniqueInput | LotWhereUniqueInput[]
    connect?: LotWhereUniqueInput | LotWhereUniqueInput[]
    update?: LotUpdateWithWhereUniqueWithoutEstateInput | LotUpdateWithWhereUniqueWithoutEstateInput[]
    updateMany?: LotUpdateManyWithWhereWithoutEstateInput | LotUpdateManyWithWhereWithoutEstateInput[]
    deleteMany?: LotScalarWhereInput | LotScalarWhereInput[]
  }

  export type LotUncheckedUpdateManyWithoutEstateNestedInput = {
    create?: XOR<LotCreateWithoutEstateInput, LotUncheckedCreateWithoutEstateInput> | LotCreateWithoutEstateInput[] | LotUncheckedCreateWithoutEstateInput[]
    connectOrCreate?: LotCreateOrConnectWithoutEstateInput | LotCreateOrConnectWithoutEstateInput[]
    upsert?: LotUpsertWithWhereUniqueWithoutEstateInput | LotUpsertWithWhereUniqueWithoutEstateInput[]
    createMany?: LotCreateManyEstateInputEnvelope
    set?: LotWhereUniqueInput | LotWhereUniqueInput[]
    disconnect?: LotWhereUniqueInput | LotWhereUniqueInput[]
    delete?: LotWhereUniqueInput | LotWhereUniqueInput[]
    connect?: LotWhereUniqueInput | LotWhereUniqueInput[]
    update?: LotUpdateWithWhereUniqueWithoutEstateInput | LotUpdateWithWhereUniqueWithoutEstateInput[]
    updateMany?: LotUpdateManyWithWhereWithoutEstateInput | LotUpdateManyWithWhereWithoutEstateInput[]
    deleteMany?: LotScalarWhereInput | LotScalarWhereInput[]
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EstateCreateWithoutLotsInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstateUncheckedCreateWithoutLotsInput = {
    id?: string
    name: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstateCreateOrConnectWithoutLotsInput = {
    where: EstateWhereUniqueInput
    create: XOR<EstateCreateWithoutLotsInput, EstateUncheckedCreateWithoutLotsInput>
  }

  export type EstateUpsertWithoutLotsInput = {
    update: XOR<EstateUpdateWithoutLotsInput, EstateUncheckedUpdateWithoutLotsInput>
    create: XOR<EstateCreateWithoutLotsInput, EstateUncheckedCreateWithoutLotsInput>
    where?: EstateWhereInput
  }

  export type EstateUpdateToOneWithWhereWithoutLotsInput = {
    where?: EstateWhereInput
    data: XOR<EstateUpdateWithoutLotsInput, EstateUncheckedUpdateWithoutLotsInput>
  }

  export type EstateUpdateWithoutLotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstateUncheckedUpdateWithoutLotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LotCreateWithoutEstateInput = {
    id?: string
    blockKey: string
    blockNumber?: number | null
    sectionNumber?: number | null
    areaSqm: number
    zoning: string
    overlays?: string | null
    address?: string | null
    district?: string | null
    division?: string | null
    lifecycleStage?: string | null
    shapeArea?: number | null
    shapeLength?: number | null
    globalId?: string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LotUncheckedCreateWithoutEstateInput = {
    id?: string
    blockKey: string
    blockNumber?: number | null
    sectionNumber?: number | null
    areaSqm: number
    zoning: string
    overlays?: string | null
    address?: string | null
    district?: string | null
    division?: string | null
    lifecycleStage?: string | null
    shapeArea?: number | null
    shapeLength?: number | null
    globalId?: string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LotCreateOrConnectWithoutEstateInput = {
    where: LotWhereUniqueInput
    create: XOR<LotCreateWithoutEstateInput, LotUncheckedCreateWithoutEstateInput>
  }

  export type LotCreateManyEstateInputEnvelope = {
    data: LotCreateManyEstateInput | LotCreateManyEstateInput[]
    skipDuplicates?: boolean
  }

  export type LotUpsertWithWhereUniqueWithoutEstateInput = {
    where: LotWhereUniqueInput
    update: XOR<LotUpdateWithoutEstateInput, LotUncheckedUpdateWithoutEstateInput>
    create: XOR<LotCreateWithoutEstateInput, LotUncheckedCreateWithoutEstateInput>
  }

  export type LotUpdateWithWhereUniqueWithoutEstateInput = {
    where: LotWhereUniqueInput
    data: XOR<LotUpdateWithoutEstateInput, LotUncheckedUpdateWithoutEstateInput>
  }

  export type LotUpdateManyWithWhereWithoutEstateInput = {
    where: LotScalarWhereInput
    data: XOR<LotUpdateManyMutationInput, LotUncheckedUpdateManyWithoutEstateInput>
  }

  export type LotScalarWhereInput = {
    AND?: LotScalarWhereInput | LotScalarWhereInput[]
    OR?: LotScalarWhereInput[]
    NOT?: LotScalarWhereInput | LotScalarWhereInput[]
    id?: StringFilter<"Lot"> | string
    blockKey?: StringFilter<"Lot"> | string
    blockNumber?: IntNullableFilter<"Lot"> | number | null
    sectionNumber?: IntNullableFilter<"Lot"> | number | null
    areaSqm?: FloatFilter<"Lot"> | number
    zoning?: StringFilter<"Lot"> | string
    overlays?: StringNullableFilter<"Lot"> | string | null
    address?: StringNullableFilter<"Lot"> | string | null
    district?: StringNullableFilter<"Lot"> | string | null
    division?: StringNullableFilter<"Lot"> | string | null
    lifecycleStage?: StringNullableFilter<"Lot"> | string | null
    shapeArea?: FloatNullableFilter<"Lot"> | number | null
    shapeLength?: FloatNullableFilter<"Lot"> | number | null
    globalId?: StringNullableFilter<"Lot"> | string | null
    geojson?: JsonNullableFilter<"Lot">
    estateId?: StringNullableFilter<"Lot"> | string | null
    createdAt?: DateTimeFilter<"Lot"> | Date | string
    updatedAt?: DateTimeFilter<"Lot"> | Date | string
  }

  export type LotCreateManyEstateInput = {
    id?: string
    blockKey: string
    blockNumber?: number | null
    sectionNumber?: number | null
    areaSqm: number
    zoning: string
    overlays?: string | null
    address?: string | null
    district?: string | null
    division?: string | null
    lifecycleStage?: string | null
    shapeArea?: number | null
    shapeLength?: number | null
    globalId?: string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LotUpdateWithoutEstateInput = {
    id?: StringFieldUpdateOperationsInput | string
    blockKey?: StringFieldUpdateOperationsInput | string
    blockNumber?: NullableIntFieldUpdateOperationsInput | number | null
    sectionNumber?: NullableIntFieldUpdateOperationsInput | number | null
    areaSqm?: FloatFieldUpdateOperationsInput | number
    zoning?: StringFieldUpdateOperationsInput | string
    overlays?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    division?: NullableStringFieldUpdateOperationsInput | string | null
    lifecycleStage?: NullableStringFieldUpdateOperationsInput | string | null
    shapeArea?: NullableFloatFieldUpdateOperationsInput | number | null
    shapeLength?: NullableFloatFieldUpdateOperationsInput | number | null
    globalId?: NullableStringFieldUpdateOperationsInput | string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LotUncheckedUpdateWithoutEstateInput = {
    id?: StringFieldUpdateOperationsInput | string
    blockKey?: StringFieldUpdateOperationsInput | string
    blockNumber?: NullableIntFieldUpdateOperationsInput | number | null
    sectionNumber?: NullableIntFieldUpdateOperationsInput | number | null
    areaSqm?: FloatFieldUpdateOperationsInput | number
    zoning?: StringFieldUpdateOperationsInput | string
    overlays?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    division?: NullableStringFieldUpdateOperationsInput | string | null
    lifecycleStage?: NullableStringFieldUpdateOperationsInput | string | null
    shapeArea?: NullableFloatFieldUpdateOperationsInput | number | null
    shapeLength?: NullableFloatFieldUpdateOperationsInput | number | null
    globalId?: NullableStringFieldUpdateOperationsInput | string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LotUncheckedUpdateManyWithoutEstateInput = {
    id?: StringFieldUpdateOperationsInput | string
    blockKey?: StringFieldUpdateOperationsInput | string
    blockNumber?: NullableIntFieldUpdateOperationsInput | number | null
    sectionNumber?: NullableIntFieldUpdateOperationsInput | number | null
    areaSqm?: FloatFieldUpdateOperationsInput | number
    zoning?: StringFieldUpdateOperationsInput | string
    overlays?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    division?: NullableStringFieldUpdateOperationsInput | string | null
    lifecycleStage?: NullableStringFieldUpdateOperationsInput | string | null
    shapeArea?: NullableFloatFieldUpdateOperationsInput | number | null
    shapeLength?: NullableFloatFieldUpdateOperationsInput | number | null
    globalId?: NullableStringFieldUpdateOperationsInput | string | null
    geojson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}