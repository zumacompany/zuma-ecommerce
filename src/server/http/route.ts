import type { NextRequest } from 'next/server'
import { errorResponse } from './response'

type RouteContext<TParams extends Record<string, string> = Record<string, string>> = {
  request: NextRequest | Request
  params: TParams
}

type RouteHandler<TParams extends Record<string, string> = Record<string, string>> = (
  context: RouteContext<TParams>
) => Promise<Response>

export function withRoute<TParams extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<TParams>
) {
  return async (request: NextRequest | Request, routeContext?: { params?: TParams }) => {
    try {
      return await handler({
        request,
        params: routeContext?.params ?? ({} as TParams),
      })
    } catch (error) {
      return errorResponse(error)
    }
  }
}
