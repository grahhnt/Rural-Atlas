import mongoose from 'mongoose';
import connect from '../../../lib/mongodb';
import { withSessionRoute } from '../../../lib/iron';

export default withSessionRoute(
  async function loginRoute(req, res) {
    await connect();
    const { User } = mongoose.models;
    const { code } = req.query;

    const token = await fetch("https://discord.com/api/v9/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        "client_id": process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
        "client_secret": process.env.DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        code,
        "redirect_uri": process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI
      })
    }).then(a => a.json());

    const discordUser = await fetch("https://discord.com/api/v9/users/@me", {
      headers: {
        Authorization: "Bearer " + token.access_token
      }
    }).then(a => a.json());

    if(!discordUser.id) {
      console.log(discordUser);
      res.send("something went wrong");
      return;
    }

    // check if they're in the discord specified by env variables

    if(process.env.NEXT_PUBLIC_DISCORD_GUILD_REQUIRED) {
      const guilds = await fetch("https://discord.com/api/v9/users/@me/guilds", {
        headers: {
          Authorization: "Bearer " + token.access_token
        }
      }).then(a => a.json());

      if(!guilds.find(a => a.id === process.env.NEXT_PUBLIC_DISCORD_GUILD_REQUIRED)) {
        return res.redirect("/?error=NOT_IN_GUILD");
      }
    }

    var user = await User.findOne({ "accounts.discord._id": discordUser.id });
    if(!user) {
      user = new User({
        name: discordUser.username,
        avatar: "https://cdn.discordapp.com/avatars/" + discordUser.id + "/" + discordUser.avatar + "." + (discordUser.avatar.startsWith("a_") ? "gif" : "png"),
        accounts: {
          discord: {
            _id: discordUser.id,
            tag: discordUser.username + "#" + discordUser.discriminator,
            avatar: discordUser.avatar, // TODO: Grab discord specific avatar
          }
        }
      })

      await user.save();
    }
    user.accounts.discord.tag = discordUser.username + "#" + discordUser.discriminator;
    user.accounts.discord.avatar = discordUser.avatar;
    user.avatar = "https://cdn.discordapp.com/avatars/" + discordUser.id + "/" + discordUser.avatar + "." + (discordUser.avatar.startsWith("a_") ? "gif" : "png");
    await user.save();

    req.session.user = user;
    await req.session.save();
    res.redirect("/");
  }
)
