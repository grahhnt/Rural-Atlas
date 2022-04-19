import { withIronSessionApiRoute, withIronSessionSsr } from 'iron-session/next';

export const config = {
  cookieName: "rural_token",
  password: process.env.SESSION_PASSWORD,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production"
  }
}

/**
 * Wrap API routes with this for session access
 * @param  {Function} handler               API Route Function
 * @return {Function}         Next.js API Handler
 */
export function withSessionRoute(handler) {
  return withIronSessionApiRoute(handler, config);
}

/**
 * Wrap page SSR with this for session access
 * @param  {Function} handler               SSR Function
 * @return {Function}         Next.js SSR Handler
 */
export function withSessionPage(handler) {
  return withIronSessionSsr(handler, config);
}
