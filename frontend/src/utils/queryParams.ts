import { Param } from '../types';

export interface ParsedUrl {
  /** 去掉查询串和 fragment 后的地址部分 */
  base: string;
  /** 含前导 # 的 fragment，没有则为空串 */
  fragment: string;
  /** 从查询串解析出的参数（全部视为勾选） */
  params: Param[];
}

/**
 * 解析地址中的查询参数。
 * 注意：这里只做字符串切分，不做 URL 解码，
 * 这样 {{变量}} 和已编码的内容都能原样保留，不会在发送时被二次编码。
 */
export const parseUrl = (url: string): ParsedUrl => {
  let rest = url;
  let fragment = '';

  const hashIndex = rest.indexOf('#');
  if (hashIndex >= 0) {
    fragment = rest.slice(hashIndex);
    rest = rest.slice(0, hashIndex);
  }

  const queryIndex = rest.indexOf('?');
  if (queryIndex < 0) {
    return { base: rest, fragment, params: [] };
  }

  const base = rest.slice(0, queryIndex);
  const query = rest.slice(queryIndex + 1);
  const params: Param[] = [];

  query.split('&').forEach((pair) => {
    if (!pair) return;
    const eqIndex = pair.indexOf('=');
    const key = eqIndex >= 0 ? pair.slice(0, eqIndex) : pair;
    const value = eqIndex >= 0 ? pair.slice(eqIndex + 1) : '';
    if (!key.trim()) return;
    params.push({ key, value, enabled: true });
  });

  return { base, fragment, params };
};

/**
 * 序列化要随请求发送的参数：只取勾选且参数名非空的行，
 * 同名参数只保留第一次出现的值。
 */
export const serializeParams = (params: Param[]): string => {
  const seen = new Set<string>();
  const parts: string[] = [];

  params.forEach((param) => {
    const key = param.key.trim();
    if (!param.enabled || !key) return;
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(`${key}=${param.value}`);
  });

  return parts.join('&');
};

/** 用 base 地址 + 参数表重建完整地址（查询内容以参数表为准） */
export const buildUrl = (base: string, params: Param[], fragment = ''): string => {
  const query = serializeParams(params);
  return query ? `${base}?${query}${fragment}` : `${base}${fragment}`;
};

/**
 * 把地址里解析出的参数合并进参数表：
 * 同名（且本次尚未被匹配过）的行更新值并勾选，否则追加新行。
 * 已有的行不会因为地址里没写而被删除 —— 参数表以表中内容为准。
 */
export const mergeParams = (existing: Param[], incoming: Param[]): Param[] => {
  const result = existing.map((param) => ({ ...param }));
  const matched = new Set<number>();

  incoming.forEach((inc) => {
    const index = result.findIndex((param, i) => !matched.has(i) && param.key === inc.key);
    if (index >= 0) {
      result[index] = { ...result[index], value: inc.value, enabled: true };
      matched.add(index);
    } else {
      result.push({ ...inc });
      matched.add(result.length - 1);
    }
  });

  return result;
};

/** 找出表中出现多次的参数名（忽略空名字） */
export const findDuplicateKeys = (params: Param[]): string[] => {
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
