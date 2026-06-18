export function containsCjk(value: string) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(value);
}

export function normalizeDrugSearchQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function tokenizeDrugSearchQuery(value: string) {
  return normalizeDrugSearchQuery(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function looseContains(left: string, right: string) {
  return left.includes(right) || right.includes(left);
}
