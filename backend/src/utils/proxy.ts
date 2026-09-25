import https from 'https';
import http from 'http';
import { URL } from 'url';
import { ProxyRequestData, ProxyResponse } from '../types';

const HTTP_METHODS: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidMethod(method: string): method is ProxyRequestData['method'] {
  return HTTP_METHODS.includes(method);
}

async function proxyRequest(requestData: ProxyRequestData): Promise<ProxyResponse> {
  const { method, url, headers, body } = requestData;

  if (!isValidUrl(url)) {
    throw new Error('无效的 URL 地址');
  }

  if (!isValidMethod(method)) {
    throw new Error('不支持的 HTTP 方法');
  }

  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === 'https:';
  const client = isHttps ? https : http;

  const requestHeaders: Record<string, string> = {};
  headers.forEach((header) => {
    if (header.enabled && header.key.trim()) {
      requestHeaders[header.key] = header.value;
    }
  });

  const options: https.RequestOptions = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: method,
    headers: requestHeaders,
  };

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const req = client.request(options, (res) => {
      const responseChunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        responseChunks.push(chunk);
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        const responseBody = Buffer.concat(responseChunks).toString('utf8');

        const responseHeaders: Record<string, string> = {};
        Object.entries(res.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
          }
        });

        resolve({
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
          headers: responseHeaders,
          body: responseBody,
          duration,
        });
      });
    });

    req.on('error', (error) => {
      reject(new Error(`请求失败: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy(new Error('请求超时'));
    });

    if (body && method !== 'GET' && method !== 'HEAD') {
      req.write(body);
    }

    req.end();
  });
}

export { proxyRequest };
