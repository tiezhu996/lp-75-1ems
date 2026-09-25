import { QueryParam } from '../types';

/**
 * 从地址中拆出基础地址和查询参数。
 * 地址中 ? 之后、# 之前的内容会被解析成参数行，全部默认勾选。
 */
export const parseQueryFromUrl = (
  rawUrl: string
): { baseUrl: string; params: QueryParam[]; hasQuery: boolean } => {
  const hashIndex = rawUrl.indexOf('#');
  const queryIndex = rawUrl.indexOf('?');

  if (queryIndex === -1) {
    return { baseUrl: rawUrl, params: [], hasQuery: false };
  }

  const baseUrl = rawUrl.slice(0, queryIndex) + (hashIndex === -1 ? '' : rawUrl.slice(hashIndex));
  const queryEnd = hashIndex === -1 ? rawUrl.length : hashIndex;
  const queryString = rawUrl.slice(queryIndex + 1, queryEnd);

  if (!queryString) {
    return { baseUrl, params: [], hasQuery: true };
  }

  const searchParams = new URLSearchParams(queryString);
  const params: QueryParam[] = [];
  searchParams.forEach((value, key) => {
    params.push({ key, value, enabled: true });
  });

  return { baseUrl, params, hasQuery: true };
};

/**
 * 把地址里的查询参数合并进参数表：表里已有的同名参数以表内为准，只追加新名字。
 */
export const mergeParams = (existing: QueryParam[], incoming: QueryParam[]): QueryParam[] => {
  const merged = [...existing];
  const existingKeys = new Set(existing.map((p) => p.key));

  incoming.forEach((param) => {
    if (!existingKeys.has(param.key)) {
      merged.push(param);
      existingKeys.add(param.key);
    }
  });

  return merged;
};

/**
 * 以参数表为准重建查询串：只有勾选且名字非空的行才发送，
 * 同名参数只取第一次填写的值。
 */
export const buildUrlWithParams = (baseUrl: string, params: QueryParam[]): string => {
  const seen = new Set<string>();
  const searchParams = new URLSearchParams();

  params.forEach((param) => {
    const key = param.key.trim();
    if (!key || !param.enabled || seen.has(key)) {
      return;
    }
    seen.add(key);
    searchParams.append(key, param.value);
  });

  const queryString = searchParams.toString();
  if (!queryString) {
    return baseUrl;
  }

  const hashIndex = baseUrl.indexOf('#');
  if (hashIndex === -1) {
    return `${baseUrl}?${queryString}`;
  }
  return `${baseUrl.slice(0, hashIndex)}?${queryString}${baseUrl.slice(hashIndex)}`;
};

/**
 * 找出表里重复填写的参数名（名字非空才算），按首次出现顺序返回。
 */
export const getDuplicateParamKeys = (params: QueryParam[]): string[] => {
  const counts = new Map<string, number>();
  params.forEach((param) => {
    const key = param.key.trim();
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
};
