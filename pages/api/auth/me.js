import { withSessionRoute } from '../../../lib/iron';

export default withSessionRoute(
  function userRoute(req, res) {
    res.send({ user: req.session.user });
  }
)
