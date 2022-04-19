import mongoose from 'mongoose';
import connect from '../../../lib/mongodb';
import { withSessionRoute } from '../../../lib/iron';

async function sendWebhook(type, { user, word, definition }) {
  if(!process.env.ENABLE_DISCORD_WEBHOOKS) return;

  switch(type.toLowerCase()) {
    case "new_word":
      fetch(process.env.WEBHOOK_NEW_WORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: "<@" + user.accounts.discord._id + "> created a new word [" + word.word + "](" + process.env.HOST + "/define/" + word.word + ")"
        })
      });
    break;
    case "new_def":
      fetch(process.env.WEBHOOK_NEW_DEFINITION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: "<@" + user.accounts.discord._id + "> created a new definition for [" + word.word + "](" + process.env.HOST + "/define/" + word.word + "?definition=" + definition._id + ")"
        })
      });
    break;
  }
}

export default withSessionRoute(async function handle(req, res) {
  await connect();
  const { Definition, Word } = mongoose.models;
  const { param } = req.query;

  if(!param) {
    switch(req.method) {
      case "POST":
        if(!req.session.user?._id) {
          return res.status(401).json({ success: false, error: "Not authenticated" });
        }
        const { word, capitalization, definition } = req.body;

        var wor = await Word.findOne({ word: word.toLowerCase() });
        const isNew = !wor;
        if(!wor) {
          wor = new Word({
            word: word.toLowerCase()
          });
          await wor.save();
          sendWebhook("new_word", { user: req.session.user, word: wor });
        }

        const def = new Definition({
          word: wor,
          capitalization,
          definition,
          owner: req.session.user._id
        })
        if(isNew) {
          def.badges = [
            {
              _id: "FIRST",
              _createdAt: new Date()
            }
          ]
        } else {
          sendWebhook("new_def", { user: req.session.user, word: wor, definition: def });
        }
        await def.save();

        wor.firstDefinition = def;
        await wor.save();

        return res.json({ success: true });
      break;
    }

    return res.status(400).json({ success: false, error: "Unsupported method" });
  }

  const definition = await Definition.findOne({ _id: param[0] });
  if(!definition) return res.status(404).json({ success: false, error: "Definition not found" });

  if(param.length == 1) {
    switch(req.method) {
      case "GET":
        return res.json({ success: true, definition });
      break;
      case "PUT":
        // moderation or editing
      break;
      case "DELETE":
        if(definition.owner._id.toString() !== req.session.user._id.toString()) {
          return res.status(401).json({ success: false, error: "You don't own this definition" });
        }

        await definition.remove();
        res.json({ success: true });
      break;
    }
  } else {
    switch(param[1]) {
      case "vote":
        switch(req.method) {
          case "PUT":
            if(!req.session.user?._id) {
              return res.status(401).json({ success: false, error: "Not authenticated" });
            }

            const { vote } = req.body;
            if(!vote || (vote !== "UP" && vote !== "DOWN")) {
              return res.status(400).json({ success: false, error: "Invalid vote" });
            }

            const existingDef = definition.votes.find(a => a._id.toString() === req.session.user._id.toString());
            if(existingDef) {
              existingDef.vote = vote;
              existingDef._updatedAt = new Date();
            } else {
              definition.votes.push({
                _id: req.session.user._id,
                vote,
                _createdAt: new Date()
              })
            }

            await definition.save();
            return res.json({ success: true });
          break;
          case "DELETE":
            if(!req.session.user?._id) {
              return res.status(401).json({ success: false, error: "Not authenticated" });
            }

            definition.votes.splice(definition.votes.indexOf(definition.votes.find(a => a._id === req.session.user._id)), 1);
            await definition.save();
            return res.json({ success: true });
          break;
        }
      break;
    }
  }

  res.status(400).json({ success: false, error: "Unsupported method" });
});
