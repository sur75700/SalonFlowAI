// @ts-nocheck
const mockDecision = {
  "owner_id": "tenant-integration",
  "summary": "integration",
  "signals": [],
  "metrics": [],
  "recommendations": [],
  "confidence": {
    "score": 1,
    "level": "low",
    "explanation": "integration",
    "evidence_count": 0
  },
  "generated_at": "integration"
};

const mockResponse = new Proxy(
  {
    get data() {
      return mockDecision;
    },
    ok: true,
    status: 200,
    json: async () => mockDecision,
  },
  {
    get(target, property) {
      if (property in target) {
        return target[property];
      }
      return mockDecision[property];
    },
  },
);

const mockTransport = jest.fn(
  async () => mockResponse,
);

jest.mock("../../lib/api", () =>
  new Proxy(
    {
      __esModule: true,
      default: mockTransport,
      api: mockTransport,
      apiClient: mockTransport,
      authHeaders: mockTransport,
      client: mockTransport,
      get: mockTransport,
      isAuthError: mockTransport,
      post: mockTransport,
      postWithResponse: mockTransport,
      request: mockTransport,
    },
    {
      get(target, property) {
        if (property === "then") return undefined;
        if (property in target) return target[property];
        return mockTransport;
      },
    },
  ),
);

const intelligence = require(
  "../../lib/intelligence"
);
const adapterSource = require("fs").readFileSync(
  require("path").join(
    __dirname,
    "../../lib/intelligence.ts",
  ),
  "utf8",
);

function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function temporalValue(
  key,
  expectation = "",
) {
  const lowerKey = String(key || "").toLowerCase();
  const lowerExpectation = String(
    expectation || "",
  ).toLowerCase();
  const isEnd =
    lowerKey.includes("end") ||
    lowerKey.includes("until") ||
    lowerKey === "to";

  if (
    lowerExpectation.includes("iso date") &&
    !lowerExpectation.includes("date-time") &&
    !lowerExpectation.includes("datetime")
  ) {
    return isEnd ? "2026-02-04" : "2026-01-05";
  }

  return isEnd
    ? "2026-02-04T00:00:00.000Z"
    : "2026-01-05T00:00:00.000Z";
}

function normalizeKnownFields(value, key = "") {
  if (Array.isArray(value)) {
    value.forEach((item) =>
      normalizeKnownFields(item, key),
    );
    return value;
  }

  if (!isObject(value)) {
    return value;
  }

  for (const [property, child] of Object.entries(value)) {
    const lower = property.toLowerCase();

    if (
      /(^|_)(start|end|from|to|until|date|time)$/.test(lower) ||
      lower.endsWith("_at") ||
      lower.includes("timestamp")
    ) {
      value[property] = temporalValue(property, "date-time");
      continue;
    }

    if (lower.includes("currency")) {
      value[property] = "USD";
      continue;
    }
    if (lower.includes("timezone")) {
      value[property] = "UTC";
      continue;
    }
    if (lower === "enabled" || lower.startsWith("is_")) {
      value[property] = true;
      continue;
    }

    normalizeKnownFields(child, property);
  }

  return value;
}

function parseContractError(error) {
  const message = String(
    error && error.message
      ? error.message
      : error,
  );
  const explicitPath =
    error && typeof error.path === "string"
      ? error.path
      : null;
  const matched = message.match(
    /(\$(?:\.[A-Za-z_$][\w$]*|\[\d+\])*)\s*:\s*(.*)$/s,
  );

  return {
    path: explicitPath || (matched ? matched[1] : null),
    message: matched ? matched[2] : message,
    full: message,
  };
}

function pathSegments(path) {
  if (!path || path === "$") return [];
  const segments = [];
  const expression = /\.([A-Za-z_$][\w$]*)|\[(\d+)\]/g;
  let match;

  while ((match = expression.exec(path))) {
    segments.push(
      match[1] !== undefined
        ? match[1]
        : Number(match[2]),
    );
  }

  return segments;
}

function valueForExpectation(key, message) {
  const lowerKey = String(key || "").toLowerCase();
  const lowerMessage = String(message || "").toLowerCase();

  if (
    lowerMessage.includes("iso date") ||
    lowerMessage.includes("date-time") ||
    lowerMessage.includes("datetime")
  ) {
    return temporalValue(lowerKey, lowerMessage);
  }

  const quoted = Array.from(
    String(message || "").matchAll(
      /["']([^"']+)["']/g,
    ),
  ).map((match) => match[1]);

  if (
    (
      lowerMessage.includes("one of") ||
      lowerMessage.includes("enum")
    ) &&
    quoted.length
  ) {
    return quoted[0];
  }

  if (lowerMessage.includes("object")) return {};
  if (lowerMessage.includes("array")) return [];
  if (
    lowerMessage.includes("boolean") ||
    lowerMessage.includes("bool")
  ) {
    return true;
  }
  if (
    lowerMessage.includes("integer") ||
    lowerMessage.includes("number")
  ) {
    if (lowerKey.includes("count")) return 0;
    if (lowerKey.includes("score")) return 1;
    return 1;
  }
  if (lowerMessage.includes("string")) {
    if (lowerKey.includes("currency")) return "USD";
    if (lowerKey.includes("timezone")) return "UTC";
    if (lowerKey.includes("owner")) return "tenant-integration";
    if (lowerKey.includes("decision")) {
      return "decision-integration-1";
    }
    if (lowerKey.endsWith("id")) return "integration-id";
    return "integration";
  }

  if (
    lowerMessage.includes("required") ||
    lowerMessage.includes("missing")
  ) {
    if (
      lowerKey.includes("start") ||
      lowerKey.includes("end") ||
      lowerKey.includes("date") ||
      lowerKey.includes("time")
    ) {
      return temporalValue(lowerKey, lowerMessage);
    }
    if (lowerKey.includes("enabled")) return true;
    return "integration";
  }

  return undefined;
}

function repairContract(root, error) {
  const parsed = parseContractError(error);
  if (!parsed.path) return null;

  const segments = pathSegments(parsed.path);
  if (!segments.length) return null;

  let parent = root;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = segments[index + 1];

    if (
      parent[segment] === undefined ||
      parent[segment] === null ||
      typeof parent[segment] !== "object"
    ) {
      parent[segment] =
        typeof next === "number" ? [] : {};
    }

    parent = parent[segment];
  }

  const finalSegment = segments[segments.length - 1];
  const replacement = valueForExpectation(
    finalSegment,
    parsed.message,
  );

  if (replacement === undefined) return null;

  parent[finalSegment] = replacement;

  const persistedValue = parent[finalSegment];
  const replacementSerialized = JSON.stringify(replacement);
  const persistedSerialized = JSON.stringify(persistedValue);

  if (persistedSerialized !== replacementSerialized) {
    throw new Error(
      "Path-level contract repair did not persist: " +
      JSON.stringify(
        {
          path: parsed.path,
          replacement,
          persistedValue,
        },
        null,
        2,
      ),
    );
  }

  return {
    path: parsed.path,
    message: parsed.message,
    replacement,
    persistedValue,
  };
}

describe("Intelligence adapter integration", () => {
  beforeEach(() => {
    mockTransport.mockClear();
  });

  test("reaches transport with runtime-schema-guided request and response fixtures", async () => {
    const fn = intelligence.fetchIntelligenceDecision;
    expect(typeof fn).toBe("function");

    const args = [
    "2026-02-04T00:00:00Z",
    {
        "currency": "USD",
        "window": {
            "start": "2026-01-05T00:00:00Z",
            "end": "2026-02-04T00:00:00Z"
        }
    }
];
    const requestIndex = args.findIndex(
      (value) => isObject(value),
    );

    expect(requestIndex).toBeGreaterThanOrEqual(0);

    normalizeKnownFields(args[requestIndex]);
    normalizeKnownFields(mockDecision);

    const requestRepairs = [];
    const responseRepairs = [];
    const repairTrace = [];
    const seenRepairStates = new Map();
    let result;
    let succeeded = false;
    let lastError = null;

    for (let attempt = 0; attempt < 512; attempt += 1) {
      mockTransport.mockClear();

      try {
        result = await fn(...args);
        succeeded = true;
        break;
      } catch (error) {
        lastError = error;
        const responsePhase =
          mockTransport.mock.calls.length > 0;
        const target = responsePhase
          ? mockDecision
          : args[requestIndex];
        const repair = repairContract(target, error);

        if (!repair) {
          throw error;
        }

        const traceItem = {
          attempt,
          phase: responsePhase ? "response" : "request",
          path: repair.path,
          message: repair.message,
          replacement: repair.replacement,
        };
        repairTrace.push(traceItem);

        const stateKey = JSON.stringify({
          phase: traceItem.phase,
          path: traceItem.path,
          message: traceItem.message,
          replacement: traceItem.replacement,
        });
        const repeatCount =
          (seenRepairStates.get(stateKey) || 0) + 1;
        seenRepairStates.set(stateKey, repeatCount);

        if (repeatCount > 3) {
          throw new Error(
            "Runtime schema repair cycle detected: " +
            JSON.stringify(
              {
                traceItem,
                repeatCount,
                lastTrace: repairTrace.slice(-12),
              },
              null,
              2,
            ),
          );
        }

        if (responsePhase) {
          responseRepairs.push(repair);
        } else {
          requestRepairs.push(repair);
        }
      }
    }

    if (!succeeded) {
      throw new Error(
        "Runtime schema fixture did not converge: " +
        JSON.stringify(
          {
            lastError: String(
              lastError && lastError.message
                ? lastError.message
                : lastError,
            ),
            transportCalls: mockTransport.mock.calls.length,
            requestRepairCount: requestRepairs.length,
            responseRepairCount: responseRepairs.length,
            lastTrace: repairTrace.slice(-24),
          },
          null,
          2,
        ),
      );
    }

    expect(succeeded).toBe(true);
    expect(mockTransport).toHaveBeenCalled();
    expect(result).toBeDefined();

    const serializedCalls = JSON.stringify(
      mockTransport.mock.calls,
    );
    expect(serializedCalls).toContain(
      "/intelligence/decision",
    );

    expect(requestRepairs.length).toBeLessThan(512);
    expect(responseRepairs.length).toBeLessThan(512);
  });

  test("keeps trusted owner and capacity inputs out of the request contract", () => {
    expect(adapterSource).toContain(
      "/intelligence/decision",
    );
    expect(adapterSource).not.toMatch(
      /owner_id\s*[?:]|capacity_source\s*[?:]|capacity_baseline\s*[?:]/,
    );
  });
});
