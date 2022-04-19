import { withSessionRoute } from '../../../lib/iron';

export default withSessionRoute(
  function logoutRoute(req, res, session) {
    req.session.destroy();
    res.send({ ok: true });
  }
)
