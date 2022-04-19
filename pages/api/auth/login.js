import mongoose from 'mongoose';
import connect from '../../../lib/mongodb';
import { withSessionRoute } from '../../../lib/iron';

export default withSessionRoute(
  async function loginRoute(req, res) {
    await connect();
    const { User } = mongoose.models;

    const user = await User.findOne({ _id: req.query.test });

    req.session.user = user;
    await req.session.save();
    res.send({ ok: true });
  }
)
