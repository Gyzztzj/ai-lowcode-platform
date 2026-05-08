export enum ErrorCode {
  SUCCESS = 0,

  /**
   * 系统错误
   */
  SYSTEM_ERROR = 10000, // 系统错误
  INTERNAL_SERVER_ERROR = 10001, // 内部服务器错误
  SERVICE_UNAVAILABLE = 10002, // 服务不可用
  GATEWAY_TIMEOUT = 10003, // 网关超时

  /**
   * 认证错误
   */
  UNAUTHORIZED = 20000, // 未授权
  INVALID_TOKEN = 20001, // 无效的token
  TOKEN_EXPIRED = 20002, // token过期
  MISSING_TOKEN = 20003, // 缺少token
  INVALID_CREDENTIALS = 20004, // 无效的凭据
  ACCOUNT_DISABLED = 20005, // 账号已禁用
  PERMISSION_DENIED = 20006, // 拒绝访问
  INVALID_API_KEY = 20007, // 无效的API密钥
  API_KEY_EXPIRED = 20008, // API密钥过期

  /**
   * 业务错误
   */
  BUSINESS_ERROR = 30000, // 业务错误
  VALIDATION_ERROR = 30001, // 验证错误
  DUPLICATE_ENTRY = 30002, // 重复条目
  RESOURCE_NOT_FOUND = 30003, // 资源未找到
  OPERATION_FAILED = 30004, // 操作失败
  INVALID_REQUEST = 30005, // 无效的请求
  RATE_LIMIT_EXCEEDED = 30006, // 超过速率限制

  /**
   * 数据错误
   */
  DATA_ERROR = 40000, // 数据错误
  DATA_INTEGRITY_ERROR = 40001, // 数据完整性错误
  DATA_NOT_FOUND = 40002, // 数据未找到
  DATA_CONFLICT = 40003, // 数据冲突
  INVALID_DATA_FORMAT = 40004, // 无效的数据格式
}
