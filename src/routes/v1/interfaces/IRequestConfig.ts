export interface IRequestConfig {
  method: string
  auth: {
    username: string
    password: string
  }
  data: {
    jsonrpc: string
    id?: any
    method?: any
    params?: any
  }
}
