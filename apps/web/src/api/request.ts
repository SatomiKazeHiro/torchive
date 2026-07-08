import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  returnAll?: boolean;
}

// 自定义返回类型
export interface CustomResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, unknown>;
  config: CustomAxiosRequestConfig;
}

// 统一错误类型
export interface CustomError<T = unknown> {
  code: number | string;
  message: string;
  data?: T;
}

// 后端错误类型
export interface BackendErrorResponse {
  error: string;
}

// ----------------------
// HttpMethod 类型重载
// ----------------------
export interface HttpMethod {
  // 只有 url
  <T = unknown>(url: string): Promise<T>;

  // url + 数据（无配置）
  <T = unknown>(url: string, data: Record<string, unknown>): Promise<T>;

  // url + 配置（returnAll = false）
  <T = unknown>(
    url: string,
    options: CustomAxiosRequestConfig & { returnAll?: false }
  ): Promise<T>;

  // url + 配置（returnAll = true）
  <T = unknown>(
    url: string,
    options: CustomAxiosRequestConfig & { returnAll: true }
  ): Promise<CustomResponse<T>>;

  // url + 数据 + 配置（returnAll = false）
  <T = unknown>(
    url: string,
    data: Record<string, unknown>,
    options: CustomAxiosRequestConfig & { returnAll?: false }
  ): Promise<T>;

  // url + 数据 + 配置（returnAll = true）
  <T = unknown>(
    url: string,
    data: Record<string, unknown>,
    options: CustomAxiosRequestConfig & { returnAll: true }
  ): Promise<CustomResponse<T>>;
}

export interface HttpInstance {
  get: HttpMethod;
  head: HttpMethod;
  options: HttpMethod;
  trace: HttpMethod;
  del: HttpMethod;
  post: HttpMethod;
  put: HttpMethod;
  patch: HttpMethod;
}

export function createInstance(
  config?: CustomAxiosRequestConfig
): HttpInstance {
  const instance: AxiosInstance = axios.create({
    timeout: 10 * 1000,
    headers: {
      "Content-Type": "application/json",
      ...config?.headers,
    },
    ...config,
  });

  // 错误拦截器
  instance.interceptors.response.use(
    (res) => res,
    (error: AxiosError<BackendErrorResponse>) => {
      const errInfo: CustomError<BackendErrorResponse> = {
        code: error.response?.status ?? "ECONNABORTED",
        message: error.message,
        data: error.response?.data,
      };

      // 示例：可以开启 message 提示
      // if ([400, 404].includes(error.response?.status as number)) {
      //   message.error(errInfo.data?.error ?? error.response?.statusText);
      // }

      return Promise.reject(errInfo);
    }
  );

  const PARAMS_METHODS = ["get", "delete", "head", "options", "trace"] as const;
  const PAYLOAD_METHODS = ["post", "put", "patch"] as const;
  const http = {} as HttpInstance;

  const createMethod = (method: string, usePayload: boolean): HttpMethod => {
    const fn = (<T = unknown>(
      url: string,
      dataOrOptions?: unknown,
      maybeOptions?: CustomAxiosRequestConfig
    ) => {
      let data: Record<string, unknown> = {};
      let options: CustomAxiosRequestConfig = {};

      // 判断参数位置
      if (
        dataOrOptions &&
        typeof dataOrOptions === "object" &&
        ("headers" in dataOrOptions || "returnAll" in dataOrOptions)
      ) {
        // 第二个参数其实是 options
        options = dataOrOptions as CustomAxiosRequestConfig;
      } else {
        data = (dataOrOptions as Record<string, unknown>) ?? {};
        options = maybeOptions ?? {};
      }

      const cfg: CustomAxiosRequestConfig = { ...options };

      if (usePayload) {
        cfg.data = data;
      } else {
        cfg.params = data;
      }

      return instance
        .request<T>({ url, method, ...cfg })
        .then((res: AxiosResponse<T>) => {
          if (options.returnAll) {
            return {
              data: res.data,
              status: res.status,
              headers: res.headers,
              config: res.config,
            } satisfies CustomResponse<T>;
          }
          return res.data;
        });
    }) as HttpMethod;

    return fn;
  };

  PAYLOAD_METHODS.forEach(
    (method) => (http[method] = createMethod(method, true))
  );
  PARAMS_METHODS.forEach(
    (method) =>
      (http[method === "delete" ? "del" : method] = createMethod(method, false))
  );

  return http;
}

/** 
// 使用示例：
const http = createInstance({ baseURL: "/api" });

// 1. 默认直接返回 data
const list = await http.get<PageResponse>("/demo", { page: 1 });

// 2. returnAll = true → 返回完整响应
const full = await http.get<PageResponse>("/demo", { page: 1 }, { returnAll: true });
console.log(full.status, full.headers);

// 3. 第二个参数是 options（无 params/data）
const detail = await http.get<DemoDetail>("/demo/123", { returnAll: false });

// 4. post 默认 data
const created = await http.post<DemoDetail>("/demo", { name: "Alice" });
*/
