import {
          api,
          authHeaders,
          isAuthError,
        } from "./api";
        import { getErrorMessage } from "./errors";
        import type {
          IntelligenceDecisionRequest,
          IntelligenceDecisionResponse,
          IntelligenceJsonValue,
        } from "../types/intelligence";

        export const INTELLIGENCE_DECISION_ENDPOINT =
          "/intelligence/decision" as const;

        type RuntimeSchema = Readonly<{
          readonly $ref?: string;
          readonly type?: string | ReadonlyArray<string>;
          readonly format?: string;
          readonly enum?: ReadonlyArray<unknown>;
          readonly const?: unknown;
          readonly anyOf?: ReadonlyArray<RuntimeSchema>;
          readonly oneOf?: ReadonlyArray<RuntimeSchema>;
          readonly allOf?: ReadonlyArray<RuntimeSchema>;
          readonly items?: RuntimeSchema;
          readonly properties?: Readonly<Record<string, RuntimeSchema>>;
          readonly required?: ReadonlyArray<string>;
          readonly additionalProperties?: boolean | RuntimeSchema;
          readonly nullable?: boolean;
          readonly minimum?: number;
          readonly maximum?: number;
          readonly exclusiveMinimum?: number;
          readonly exclusiveMaximum?: number;
          readonly minLength?: number;
          readonly maxLength?: number;
          readonly pattern?: string;
          readonly minItems?: number;
          readonly maxItems?: number;
          readonly uniqueItems?: boolean;
        }>;

        const SCHEMA_PREFIX = "#/components/schemas/";

        const INTELLIGENCE_SCHEMAS: Readonly<
          Record<string, RuntimeSchema>
        > = {
  "AnalysisWindowRequest": {
    "additionalProperties": false,
    "properties": {
      "end": {
        "format": "date",
        "type": "string"
      },
      "label": {
        "maxLength": 64,
        "minLength": 1,
        "type": "string"
      },
      "start": {
        "format": "date",
        "type": "string"
      }
    },
    "required": [
      "start",
      "end"
    ],
    "type": "object"
  },
  "ConfidenceResponse": {
    "additionalProperties": false,
    "properties": {
      "evidence_count": {
        "type": "integer"
      },
      "explanation": {
        "type": "string"
      },
      "level": {
        "enum": [
          "low",
          "medium",
          "high"
        ],
        "type": "string"
      },
      "score": {
        "type": "number"
      }
    },
    "required": [
      "score",
      "level",
      "explanation",
      "evidence_count"
    ],
    "type": "object"
  },
  "EvidenceResponse": {
    "additionalProperties": false,
    "properties": {
      "description": {
        "type": "string"
      },
      "observed_at": {
        "type": "string"
      },
      "source": {
        "type": "string"
      },
      "value": {
        "anyOf": [
          {},
          {
            "type": "null"
          }
        ]
      }
    },
    "required": [
      "source",
      "description",
      "observed_at"
    ],
    "type": "object"
  },
  "ExpectedImpactResponse": {
    "additionalProperties": false,
    "properties": {
      "estimated_change": {
        "type": "number"
      },
      "metric": {
        "type": "string"
      },
      "timeframe_days": {
        "type": "integer"
      },
      "unit": {
        "type": "string"
      }
    },
    "required": [
      "metric",
      "estimated_change",
      "unit",
      "timeframe_days"
    ],
    "type": "object"
  },
  "IntelligenceDecisionRequest": {
    "additionalProperties": false,
    "properties": {
      "currency": {
        "maxLength": 8,
        "minLength": 3,
        "type": "string"
      },
      "window": {
        "$ref": "#/components/schemas/AnalysisWindowRequest"
      }
    },
    "required": [
      "window"
    ],
    "type": "object"
  },
  "IntelligenceDecisionResponse": {
    "additionalProperties": false,
    "properties": {
      "confidence": {
        "$ref": "#/components/schemas/ConfidenceResponse"
      },
      "generated_at": {
        "type": "string"
      },
      "metrics": {
        "items": {
          "$ref": "#/components/schemas/MetricResponse"
        },
        "type": "array"
      },
      "owner_id": {
        "type": "string"
      },
      "recommendations": {
        "items": {
          "$ref": "#/components/schemas/RecommendationResponse"
        },
        "type": "array"
      },
      "signals": {
        "items": {
          "$ref": "#/components/schemas/SignalResponse"
        },
        "type": "array"
      },
      "summary": {
        "type": "string"
      }
    },
    "required": [
      "owner_id",
      "summary",
      "signals",
      "metrics",
      "recommendations",
      "confidence",
      "generated_at"
    ],
    "type": "object"
  },
  "MetricResponse": {
    "additionalProperties": false,
    "properties": {
      "comparison_value": {
        "anyOf": [
          {
            "type": "number"
          },
          {
            "type": "null"
          }
        ]
      },
      "key": {
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "unit": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "value": {
        "type": "number"
      }
    },
    "required": [
      "key",
      "label",
      "value"
    ],
    "type": "object"
  },
  "RecommendationResponse": {
    "additionalProperties": false,
    "properties": {
      "code": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "expected_impacts": {
        "items": {
          "$ref": "#/components/schemas/ExpectedImpactResponse"
        },
        "type": "array"
      },
      "priority": {
        "type": "integer"
      },
      "title": {
        "type": "string"
      }
    },
    "required": [
      "code",
      "title",
      "description",
      "priority",
      "expected_impacts"
    ],
    "type": "object"
  },
  "SignalResponse": {
    "additionalProperties": false,
    "properties": {
      "code": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "evidence": {
        "items": {
          "$ref": "#/components/schemas/EvidenceResponse"
        },
        "type": "array"
      },
      "severity": {
        "enum": [
          "info",
          "opportunity",
          "warning",
          "critical"
        ],
        "type": "string"
      },
      "title": {
        "type": "string"
      }
    },
    "required": [
      "code",
      "title",
      "description",
      "severity",
      "evidence"
    ],
    "type": "object"
  }
} as const;

        const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
        const AWARE_DATE_TIME_PATTERN =
          /(?:Z|[+-]\d{2}:\d{2})$/;

        export class IntelligenceContractError extends Error {
          readonly path: string;

          constructor(path: string, message: string) {
            super(`${path}: ${message}`);
            this.name = "IntelligenceContractError";
            this.path = path;
          }
        }

        export type IntelligenceDecisionRequestErrorKind =
          | "auth"
          | "not_entitled"
          | "entitlement_unavailable"
          | "request";

        export class IntelligenceDecisionRequestError extends Error {
          readonly authFailure: boolean;
          readonly status: number | null;
          readonly sourceError: unknown;
          readonly kind: IntelligenceDecisionRequestErrorKind;

          constructor(
            message: string,
            options: Readonly<{
              authFailure: boolean;
              status: number | null;
              sourceError: unknown;
              kind: IntelligenceDecisionRequestErrorKind;
            }>,
          ) {
            super(message);
            this.name = "IntelligenceDecisionRequestError";
            this.authFailure = options.authFailure;
            this.status = options.status;
            this.sourceError = options.sourceError;
            this.kind = options.kind;
          }
        }

        function isRecord(
          value: unknown,
        ): value is Record<string, unknown> {
          return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          );
        }

        function fail(path: string, message: string): never {
          throw new IntelligenceContractError(path, message);
        }

        function resolveReference(reference: string): RuntimeSchema {
          if (!reference.startsWith(SCHEMA_PREFIX)) {
            throw new IntelligenceContractError(
              "$schema",
              `unsupported reference ${reference}`,
            );
          }

          const name = reference.slice(SCHEMA_PREFIX.length);
          const schema = INTELLIGENCE_SCHEMAS[name];
          if (!schema) {
            throw new IntelligenceContractError(
              "$schema",
              `missing schema ${name}`,
            );
          }
          return schema;
        }

        function matchesSchema(
          schema: RuntimeSchema,
          value: unknown,
          path: string,
        ): boolean {
          try {
            assertSchema(schema, value, path);
            return true;
          } catch (error) {
            if (error instanceof IntelligenceContractError) {
              return false;
            }
            throw error;
          }
        }

        function assertString(
          schema: RuntimeSchema,
          value: unknown,
          path: string,
        ): asserts value is string {
          if (typeof value !== "string") {
            fail(path, "expected string");
          }
          if (
            schema.minLength !== undefined &&
            value.length < schema.minLength
          ) {
            fail(path, `minimum length is ${schema.minLength}`);
          }
          if (
            schema.maxLength !== undefined &&
            value.length > schema.maxLength
          ) {
            fail(path, `maximum length is ${schema.maxLength}`);
          }
          if (
            schema.pattern !== undefined &&
            !new RegExp(schema.pattern).test(value)
          ) {
            fail(path, "string pattern mismatch");
          }
          if (
            schema.format === "date" &&
            (
              !DATE_PATTERN.test(value) ||
              Number.isNaN(Date.parse(`${value}T00:00:00Z`))
            )
          ) {
            fail(path, "expected ISO date");
          }
          if (
            schema.format === "date-time" &&
            (
              !AWARE_DATE_TIME_PATTERN.test(value) ||
              Number.isNaN(Date.parse(value))
            )
          ) {
            fail(path, "expected timezone-aware ISO date-time");
          }
        }

        function assertNumber(
          schema: RuntimeSchema,
          value: unknown,
          path: string,
          integer: boolean,
        ): asserts value is number {
          if (
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            (integer && !Number.isInteger(value))
          ) {
            fail(path, integer ? "expected integer" : "expected number");
          }
          if (
            schema.minimum !== undefined &&
            value < schema.minimum
          ) {
            fail(path, `minimum is ${schema.minimum}`);
          }
          if (
            schema.maximum !== undefined &&
            value > schema.maximum
          ) {
            fail(path, `maximum is ${schema.maximum}`);
          }
          if (
            schema.exclusiveMinimum !== undefined &&
            value <= schema.exclusiveMinimum
          ) {
            fail(
              path,
              `must be greater than ${schema.exclusiveMinimum}`,
            );
          }
          if (
            schema.exclusiveMaximum !== undefined &&
            value >= schema.exclusiveMaximum
          ) {
            fail(
              path,
              `must be less than ${schema.exclusiveMaximum}`,
            );
          }
        }

        function assertArray(
          schema: RuntimeSchema,
          value: unknown,
          path: string,
        ): asserts value is ReadonlyArray<unknown> {
          if (!Array.isArray(value)) {
            fail(path, "expected array");
          }
          if (
            schema.minItems !== undefined &&
            value.length < schema.minItems
          ) {
            fail(path, `minimum item count is ${schema.minItems}`);
          }
          if (
            schema.maxItems !== undefined &&
            value.length > schema.maxItems
          ) {
            fail(path, `maximum item count is ${schema.maxItems}`);
          }
          if (schema.uniqueItems) {
            const serialized = value.map((item) => JSON.stringify(item));
            if (new Set(serialized).size !== serialized.length) {
              fail(path, "array items must be unique");
            }
          }
          if (schema.items) {
            value.forEach((item, index) => {
              assertSchema(
                schema.items as RuntimeSchema,
                item,
                `${path}[${index}]`,
              );
            });
          }
        }

        function assertObject(
          schema: RuntimeSchema,
          value: unknown,
          path: string,
        ): asserts value is Record<string, unknown> {
          if (!isRecord(value)) {
            fail(path, "expected object");
          }

          const properties = schema.properties ?? {};
          const required = schema.required ?? [];
          for (const name of required) {
            if (!Object.prototype.hasOwnProperty.call(value, name)) {
              fail(`${path}.${name}`, "required field is missing");
            }
          }

          for (const [name, child] of Object.entries(properties)) {
            if (Object.prototype.hasOwnProperty.call(value, name)) {
              assertSchema(child, value[name], `${path}.${name}`);
            }
          }

          for (const [name, childValue] of Object.entries(value)) {
            if (Object.prototype.hasOwnProperty.call(properties, name)) {
              continue;
            }
            if (schema.additionalProperties === false) {
              fail(`${path}.${name}`, "unexpected field");
            }
            if (
              typeof schema.additionalProperties === "object" &&
              schema.additionalProperties !== null
            ) {
              assertSchema(
                schema.additionalProperties,
                childValue,
                `${path}.${name}`,
              );
            }
          }
        }

        function assertSchema(
          schema: RuntimeSchema,
          value: unknown,
          path: string,
        ): void {
          if (schema.$ref) {
            assertSchema(resolveReference(schema.$ref), value, path);
            return;
          }

          if (schema.nullable && value === null) {
            return;
          }

          if (schema.const !== undefined && !Object.is(schema.const, value)) {
            fail(path, `expected constant ${JSON.stringify(schema.const)}`);
          }

          if (
            schema.enum &&
            !schema.enum.some((candidate) => Object.is(candidate, value))
          ) {
            fail(path, "value is not in the allowed enum");
          }

          if (schema.allOf) {
            schema.allOf.forEach((child) => {
              assertSchema(child, value, path);
            });
          }

          if (
            schema.anyOf &&
            !schema.anyOf.some((child) => matchesSchema(child, value, path))
          ) {
            fail(path, "value does not match any allowed schema");
          }

          if (schema.oneOf) {
            const matches = schema.oneOf.filter((child) =>
              matchesSchema(child, value, path)
            ).length;
            if (matches !== 1) {
              fail(path, "value must match exactly one allowed schema");
            }
          }

          const types = Array.isArray(schema.type)
            ? schema.type
            : schema.type
              ? [schema.type]
              : [];

          if (types.length > 1) {
            const matches = types.some((type) =>
              matchesSchema({ ...schema, type }, value, path)
            );
            if (!matches) {
              fail(path, "value does not match an allowed type");
            }
            return;
          }

          const type = types[0];
          if (type === "null") {
            if (value !== null) {
              fail(path, "expected null");
            }
            return;
          }
          if (type === "string") {
            assertString(schema, value, path);
            return;
          }
          if (type === "number") {
            assertNumber(schema, value, path, false);
            return;
          }
          if (type === "integer") {
            assertNumber(schema, value, path, true);
            return;
          }
          if (type === "boolean") {
            if (typeof value !== "boolean") {
              fail(path, "expected boolean");
            }
            return;
          }
          if (type === "array") {
            assertArray(schema, value, path);
            return;
          }
          if (
            type === "object" ||
            schema.properties !== undefined ||
            schema.additionalProperties !== undefined
          ) {
            assertObject(schema, value, path);
          }
        }

        function parseSchema<T>(
          schemaName: string,
          value: unknown,
        ): T {
          const schema = INTELLIGENCE_SCHEMAS[schemaName];
          if (!schema) {
            throw new IntelligenceContractError(
              "$schema",
              `missing schema ${schemaName}`,
            );
          }
          assertSchema(schema, value, "$");
          return value as T;
        }

        export function validateIntelligenceDecisionRequest(
          request: IntelligenceDecisionRequest,
        ): void {
          parseSchema<IntelligenceDecisionRequest>(
            "IntelligenceDecisionRequest",
            request,
          );
        }

        function assertAwareDateTime(
          value: unknown,
          path: string,
        ): asserts value is string {
          if (
            typeof value !== "string" ||
            !AWARE_DATE_TIME_PATTERN.test(value) ||
            Number.isNaN(Date.parse(value))
          ) {
            fail(path, "expected timezone-aware ISO date-time");
          }
        }

        export function parseIntelligenceDecisionResponse(
          value: unknown,
        ): IntelligenceDecisionResponse {
          const response = parseSchema<IntelligenceDecisionResponse>(
            "IntelligenceDecisionResponse",
            value,
          );
          assertAwareDateTime(
            response.generated_at,
            "$.generated_at",
          );
          return response;
        }

        export function createIntelligenceDecisionRequestKey(
          request: IntelligenceDecisionRequest,
        ): string {
          validateIntelligenceDecisionRequest(request);
          return JSON.stringify([
            request.window.start,
            request.window.end,
            request.window.label ?? null,
            request.currency ?? null,
          ]);
        }

        function readHttpStatus(error: unknown): number | null {
          if (!isRecord(error)) {
            return null;
          }
          const response = error.response;
          if (!isRecord(response)) {
            return null;
          }
          const status = response.status;
          return typeof status === "number" && Number.isInteger(status)
            ? status
            : null;
        }

        function readIntelligenceServerErrorCode(
          error: unknown,
        ): string | null {
          if (typeof error !== "object" || error === null) {
            return null;
          }

          const response = (
            error as {
              response?: {
                data?: unknown;
              };
            }
          ).response;

          const data = response?.data;
          if (typeof data !== "object" || data === null) {
            return null;
          }

          const detail = (
            data as {
              detail?: unknown;
            }
          ).detail;

          if (typeof detail !== "object" || detail === null) {
            return null;
          }

          const code = (
            detail as {
              code?: unknown;
            }
          ).code;

          return typeof code === "string" ? code : null;
        }

        export async function fetchIntelligenceDecision(
          token: string,
          request: IntelligenceDecisionRequest,
          signal?: AbortSignal,
        ): Promise<IntelligenceDecisionResponse> {
          validateIntelligenceDecisionRequest(request);
          if (!token.trim()) {
            throw new IntelligenceDecisionRequestError(
              "Authentication is required",
              {
                authFailure: true,
                status: 401,
                sourceError: null,
                kind: "auth",
              },
            );
          }

          try {
            const response = await api.post<unknown>(
              INTELLIGENCE_DECISION_ENDPOINT,
              request,
              {
                headers: authHeaders(token),
                signal,
              },
            );
            return parseIntelligenceDecisionResponse(response.data);
          } catch (error) {
            if (signal?.aborted) {
              throw error;
            }
            const status = readHttpStatus(error);
            const serverCode =
              readIntelligenceServerErrorCode(error);

            const entitlementDenied =
              status === 403 &&
              serverCode === "feature_not_entitled";
            const entitlementUnavailable =
              status === 503 &&
              serverCode ===
                "entitlement_source_unavailable";
            const authFailure =
              !entitlementDenied &&
              !entitlementUnavailable &&
              isAuthError(error);

            const kind: IntelligenceDecisionRequestErrorKind =
              entitlementDenied
                ? "not_entitled"
                : entitlementUnavailable
                  ? "entitlement_unavailable"
                  : authFailure
                    ? "auth"
                    : "request";

            const message =
              kind === "not_entitled"
                ? "Intelligence access is not included"
                : kind === "entitlement_unavailable"
                  ? "Intelligence access could not be verified"
                  : getErrorMessage(
                      error,
                      "Unable to load Intelligence decision",
                    );

            throw new IntelligenceDecisionRequestError(
              message,
              {
                authFailure,
                status,
                sourceError: error,
                kind,
              },
            );
          }
        }

        export function isIntelligenceJsonValue(
          value: unknown,
        ): value is IntelligenceJsonValue {
          if (
            value === null ||
            typeof value === "string" ||
            typeof value === "boolean"
          ) {
            return true;
          }
          if (typeof value === "number") {
            return Number.isFinite(value);
          }
          if (Array.isArray(value)) {
            return value.every(isIntelligenceJsonValue);
          }
          if (isRecord(value)) {
            return Object.values(value).every(isIntelligenceJsonValue);
          }
          return false;
        }
