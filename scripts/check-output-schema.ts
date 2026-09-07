/**
 * 구조화 출력용 JSON Schema가 Anthropic 제약을 지키는지 검사한다.
 *
 *   npx tsx scripts/check-output-schema.ts
 *
 * 스키마를 고칠 때마다 돌려보면, 실제 API 호출로 400을 맞기 전에 잡을 수 있다.
 */
import {
  placeSpotSchema,
  tripPlanDraftSchema,
} from "../server/trip-plan-schema.js";

// 구조화 출력이 받지 않는 JSON Schema 키워드
const UNSUPPORTED = [
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
  "minItems",
  "maxItems",
  "uniqueItems",
  "minProperties",
  "maxProperties",
  "patternProperties",
  "if",
  "then",
  "else",
  "not",
  "oneOf",
];

type Issue = { path: string; problem: string };

const issues: Issue[] = [];
let objectCount = 0;
let deepest = 0;

function walk(node: unknown, path: string, depth: number) {
  if (typeof node !== "object" || node === null) return;
  deepest = Math.max(deepest, depth);
  const obj = node as Record<string, unknown>;

  for (const keyword of UNSUPPORTED) {
    if (keyword in obj) {
      issues.push({ path, problem: `지원하지 않는 키워드: ${keyword}` });
    }
  }

  if (obj.type === "object") {
    objectCount++;
    if (obj.additionalProperties !== false) {
      issues.push({ path, problem: "additionalProperties: false 누락" });
    }
    if (!obj.properties) {
      issues.push({ path, problem: "properties 없음" });
    }
    const props = (obj.properties ?? {}) as Record<string, unknown>;
    for (const name of (obj.required ?? []) as string[]) {
      if (!(name in props)) {
        issues.push({
          path,
          problem: `required의 "${name}"이 properties에 없음`,
        });
      }
    }
    for (const [name, child] of Object.entries(props)) {
      walk(child, `${path}.${name}`, depth + 1);
    }
  }

  if (obj.type === "array") {
    if (!obj.items) {
      issues.push({ path, problem: "array에 items 없음" });
    }
    walk(obj.items, `${path}[]`, depth + 1);
  }
}

const schemas = [
  ["tripPlanDraftSchema", tripPlanDraftSchema],
  ["placeSpotSchema", placeSpotSchema],
] as const;

for (const [name, schema] of schemas) {
  objectCount = 0;
  deepest = 0;
  const before = issues.length;
  walk(schema, name, 0);
  const found = issues.length - before;

  console.log(`=== ${name} ===`);
  console.log(`  object 노드    : ${objectCount}개`);
  console.log(`  최대 중첩 깊이 : ${deepest}`);
  console.log(
    `  직렬화 크기    : ${JSON.stringify(schema).length.toLocaleString()} bytes`,
  );
  console.log(`  문제           : ${found === 0 ? "없음" : `${found}건`}`);
  console.log("");
}

if (issues.length > 0) {
  console.log("!!! 문제 발견 !!!");
  for (const issue of issues) {
    console.log(`  ${issue.path} → ${issue.problem}`);
  }
  process.exit(1);
}

console.log("스키마가 Anthropic 구조화 출력 제약을 모두 만족합니다.");
