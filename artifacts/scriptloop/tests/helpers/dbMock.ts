import { vi } from "vitest";

/**
 * In-memory state that test cases configure to control what each Drizzle
 * chain resolves to. The fake builders ignore their arguments — tests are
 * responsible for seeding only the rows the handler is expected to see.
 */
export interface FakeDbState {
  selectResult: unknown[];
  insertResult: unknown[];
  updateResult: unknown[];
  deleteResult: unknown[];
  insertCalls: Array<{ values: unknown }>;
  updateCalls: Array<{ set: unknown }>;
  deleteCalls: number;
  // When true, the next insert() throws — used to test DB-failure paths.
  insertShouldThrow: Error | null;
}

export const dbState: FakeDbState = {
  selectResult: [],
  insertResult: [],
  updateResult: [],
  deleteResult: [],
  insertCalls: [],
  updateCalls: [],
  deleteCalls: 0,
  insertShouldThrow: null,
};

export function resetDbState(): void {
  dbState.selectResult = [];
  dbState.insertResult = [];
  dbState.updateResult = [];
  dbState.deleteResult = [];
  dbState.insertCalls = [];
  dbState.updateCalls = [];
  dbState.deleteCalls = 0;
  dbState.insertShouldThrow = null;
}

function thenableArray<T>(value: T[]): PromiseLike<T[]> & {
  where: (..._args: unknown[]) => PromiseLike<T[]> & { limit: (n: number) => Promise<T[]> };
  limit: (n: number) => Promise<T[]>;
} {
  const p = Promise.resolve(value);
  return {
    then: p.then.bind(p) as PromiseLike<T[]>["then"],
    where: () => thenableArray(value),
    limit: () => Promise.resolve(value),
  };
}

export const fakeDb = {
  select: vi.fn(() => ({
    from: () => thenableArray(dbState.selectResult),
  })),
  insert: vi.fn(() => ({
    values: (values: unknown) => {
      dbState.insertCalls.push({ values });
      const ret = {
        returning: async () => {
          if (dbState.insertShouldThrow) throw dbState.insertShouldThrow;
          return dbState.insertResult;
        },
        onConflictDoUpdate: () => ret,
      };
      return ret;
    },
  })),
  update: vi.fn(() => ({
    set: (values: unknown) => {
      dbState.updateCalls.push({ set: values });
      return {
        where: () => ({
          returning: async () => dbState.updateResult,
        }),
      };
    },
  })),
  delete: vi.fn(() => {
    dbState.deleteCalls += 1;
    return {
      where: () => ({
        returning: async () => dbState.deleteResult,
      }),
    };
  }),
};
