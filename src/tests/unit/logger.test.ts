import { describe, it, expect } from "vitest";
import createLogger, { setTransport } from "@/lib/utils/logger";

describe("logger", () => {
  it("should create a logger with child scope", () => {
    const log = createLogger("test");
    const child = log.child("db");
    expect(child).toBeDefined();
  });

  it("should call transport on info", () => {
    const log = createLogger("test");
    const entries: any[] = [];

    setTransport((e: any) => entries.push(e));
    log.info("hello", { data: { x: 1 } });

    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("info");
    expect(entries[0].message).toBe("hello");
    expect(entries[0].module).toBe("test");
  });
});
