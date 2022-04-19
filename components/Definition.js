import { useState, useEffect } from 'react';
import moment from 'moment';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Paper,
  Avatar,
  Stack,
  Chip,
  Button,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import StarIcon from '@mui/icons-material/Star';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useUser } from '../lib/api';

export default function Definition({ def, word, refresh, showActions, deleteDefinition, onClick, href, readOnly = false, highlight }) {
  const { user } = useUser();
  const [ myVote, setMyVote ] = useState("");
  const [ showModOptions, setShowModOptions ] = useState(false);

  useEffect(() => {
    if(def) {
      setMyVote(def.votes.find(a => a._id === user?._id)?.vote);
      setShowModOptions(def.owner._id === user?._id);
    }
  }, [ user, def ]);

  const vote = (vote) => new Promise(r => {
    fetch("/api/definition/" + def._id + "/vote", {
      method: myVote !== vote ? "PUT" : "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ vote })
    }).then(a => a.json()).then(() => {
      refresh();
    }).catch(e => {
      alert("Error: " + e);
      r();
    })
  })

  const ConditionalWrapper = ({ wrap, wrapper, children }) => {
    return wrap ? wrapper(children) : children
  }

  if(!def && word) {
    return <Card>
      <ConditionalWrapper wrap={!!onClick} wrapper={c => <CardActionArea onClick={onClick} href={href}>{c}</CardActionArea>}>
        <CardContent>
          <Typography variant="h5">
            {word.word}
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: "italic" }}>
            Original definition deleted
          </Typography>
        </CardContent>
      </ConditionalWrapper>
    </Card>
  }

  return <>
    <Card>
      <ConditionalWrapper wrap={!!onClick} wrapper={c => <CardActionArea onClick={onClick} href={href}>{c}</CardActionArea>}>
        <CardContent>
          <Typography variant="h5">
            {def.capitalization}
          </Typography>
          <Typography variant="body2">
            {def.definition}
          </Typography>
        </CardContent>
        <Grid container columnSpacing={2} component={Paper} elevation={2} sx={{ p: 2 }}>
          <Grid item>
            <Avatar src={def.owner.avatar} />
          </Grid>
          <Grid item xs container alignItems="center">
            <Stack spacing={0} sx={{ mr: 1 }}>
              <Typography>{def.owner.name}</Typography>
              <Typography color="text.secondary">{moment(def._createdAt).fromNow()}</Typography>
            </Stack>
            <Stack direction="row">
              {def.badges?.map(badge => (
                <Chip key={badge._id} icon={<StarIcon />} label={"First Definition"} />
              ))}
              {highlight && <Chip label={"Highlighted"} />}
            </Stack>
          </Grid>
          {showActions && (
            <Grid item>
              <Stack direction="row">
                {(showModOptions && !readOnly) && (
                  <Button startIcon={<DeleteOutlineIcon />} size="large" color="error" onClick={() => deleteDefinition(def)}>
                    Delete
                  </Button>
                )}
                <Button startIcon={myVote === "UP" ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />} size="large" sx={{ color: "text.secondary" }} onClick={() => vote("UP")} disabled={readOnly}>
                  {def.votes.filter(a => a.vote === "UP").length}
                </Button>
                <Button startIcon={myVote === "DOWN" ? <ThumbDownIcon /> : <ThumbDownOutlinedIcon />} size="large" sx={{ color: "text.secondary" }} onClick={() => vote("DOWN")} disabled={readOnly}>
                  {def.votes.filter(a => a.vote === "DOWN").length}
                </Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      </ConditionalWrapper>
    </Card>
  </>
}
