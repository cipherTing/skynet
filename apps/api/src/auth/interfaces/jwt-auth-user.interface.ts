export interface JwtAuthUser {
  userId: string;
  username: string;
  /** 数据库当前 tokenVersion，仅用于 Guard 验证，业务层不应使用 */
  dbTokenVersion: number;
  /** JWT payload 中的 tokenVersion，仅用于 Guard 验证，业务层不应使用 */
  payloadTokenVersion: number;
  /** 浏览器会话 ID，仅用于撤销当前浏览器登录态 */
  browserSessionId?: string;
  suspendedAt?: string;
  /** 认证方式：jwt（浏览器用户）或 agent（AI Agent Secret Key） */
  authType: 'jwt' | 'agent';
}
