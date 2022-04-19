import Router, { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import mongoose from 'mongoose';
import moment from 'moment';
import {
  Typography,
  Stack,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardActionArea,
  Avatar,
  IconButton,
  Button,
  Grid,
  Paper,
  Chip,
  Modal,
  TextField,
  Backdrop,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { red } from '@mui/material/colors';
import MoreVertIcon from '@mui/icons-material/MoreVert';

import connect from '../../lib/mongodb';
import { useUser } from '../../lib/api';
import Definition from '../../components/Definition';

export default function DefineWord({ word, definitions }) {
  const { user } = useUser();
  const router = useRouter();
  const { definition } = router.query;
  const [ showNewDef, setShowNewDef ] = useState(false);
  const [ showConfirmDeleteDefinition, setShowConfirmDeleteDefinition ] = useState(false);
  const [ deleteDefinition, setDeleteDefinition ] = useState({});

  const handleDefClose = () => {
    setShowNewDef(false);
    refresh();
  }

  const refresh = () => {
    router.replace(router.asPath);
  }

  const handleDeleteDefinition = (definition) => {
    setShowConfirmDeleteDefinition(true);
    setDeleteDefinition(definition);
  }

  return <>
    <Grid container spacing={2} mt={2}>
      <Grid item md={8} xs={12}>
        <Stack spacing={2}>
          {definitions.length ?
            definitions.map(def => (
              <Definition key={def._id} def={def} refresh={refresh} showActions={true} deleteDefinition={handleDeleteDefinition} highlight={def._id === definition} />
            )
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h5">No Definitions!</Typography>
                <Typography>
                  You could be the first!
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Grid>
      <Grid item md={4} xs={12} sx={{
        order: {
          xs: -1,
          md: 0
        }
      }}>
        <Card>
          <CardContent>
            <Button onClick={() => setShowNewDef(true)}>New Definition</Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    <NewDefinitionModal open={showNewDef} onClose={handleDefClose} word={word || { word: router.query.word.toLowerCase() }} />
    <DeleteDefinitionDialog show={showConfirmDeleteDefinition} onClose={() => setShowConfirmDeleteDefinition(false) && setDeleteDefinition({})} definition={deleteDefinition} refresh={refresh} />
  </>
}

function DeleteDefinitionDialog({ show, onClose, definition, refresh }) {
  const [ loading, setLoading ] = useState(false);

  const confirmDeleteDefinition = () => {
    setLoading(true);
    fetch("/api/definition/" + definition._id, {
      method: "DELETE"
    }).then(a => a.json()).then(data => {
      if(data.success) {
        refresh();
      } else {
        alert("Error: " + data.error);
      }
    }).catch(e => {
      alert("Error: " + e);
    }).finally(() => {
      setLoading(false);
    })
  }

  return <Dialog
    sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
    maxWidth="xs"
    open={show}
  >
    <DialogTitle>Are you sure?</DialogTitle>
    <DialogContent dividers>
      <Typography mb={1}>Are you sure you want to delete the definition?</Typography>
      <Definition def={definition} showActions={false} />
    </DialogContent>
    <DialogActions>
      <Button autoFocus onClick={() => onClose()}>
        Cancel
      </Button>
      <Button onClick={() => confirmDeleteDefinition()}>Ok</Button>
    </DialogActions>

    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
      open={loading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  </Dialog>
}

function NewDefinitionModal({ word, ...props }) {
  const [ cap, setCap ] = useState(word.word);
  const [ capValid, setCapValid ] = useState(true);
  const [ def, setDef ] = useState("");
  const [ defValid, setDefValid ] = useState(false);
  const [ canSave, setCanSave ] = useState(false);

  const [ loading, setLoading ] = useState(false);

  useEffect(() => {
    setCapValid(cap.toLowerCase() === word.word);
  }, [ cap ]);

  useEffect(() => {
    setDefValid(def.length > 10);
  }, [ def ]);

  useEffect(() => {
    setCanSave(capValid && defValid);
  }, [ capValid, defValid ]);

  const handleSave = () => {
    setLoading(true);
    fetch("/api/definition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        word: word.word,
        capitalization: cap,
        definition: def
      })
    }).then(a => a.json()).then(data => {
      if(data.success) {
        props.onClose();
      } else {
        alert("Error: " + data.error);
      }
    }).finally(() => {
      setLoading(false);
    })
  }

  return <>
    <Modal {...props}>
      <Paper elevation={4} sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        p: 3
      }}>
        <Typography variant="h5" mb={2}>New Definition</Typography>
        <Stack spacing={2}>
          <TextField label="Capitalization" helperText="Change the capitalization of the word" fullWidth error={!capValid} value={cap} onChange={e => setCap(e.target.value)} disabled={loading} />

          <TextField label="Definition" helperText="Definition of the word" fullWidth multiline error={!defValid} value={def} onChange={e => setDef(e.target.value)} disabled={loading} />

          <Stack direction="row" spacing={2}>
            <Button disabled={loading} onClick={props.onClose}>Cancel</Button>
            <Button variant="contained" disabled={!canSave || loading} onClick={handleSave}>Create</Button>
          </Stack>
        </Stack>
      </Paper>
    </Modal>

    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
      open={loading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  </>
}

export async function getServerSideProps({ params, query }) {
  await connect();

  const { Word, Definition } = mongoose.models;
  const word = await Word.findOne({ word: params.word.toLowerCase() });
  if(!word) {
    return {
      props: {
        word: null,
        definitions: []
      }
    }
  }

  var m = { word: word._id };
  if(query.definition) {
    m._id = { $ne: query.definition };
  }

  var definitions = await Definition.aggregate([
    {
      $match: m
    },
    {
      $addFields: {
        score: {
          $subtract: [
            {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "v",
                  cond: { $eq: [ "$$v.vote", "UP" ] }
                }
              }
            },
            {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "v",
                  cond: { $eq: [ "$$v.vote", "DOWN" ] }
                }
              }
            }
          ]
        }
      }
    },
    {
      $sort: { score: -1 }
    }
  ]);
  if(query.definition) definitions = definitions.filter(a => a._id.toString() !== query.definition.toString());
  await Definition.populate(definitions, { path: "owner" });
  if(query.definition) definitions = [await Definition.findOne({ word: word._id, _id: query.definition }).populate("owner"), ...definitions];

  return {
    props: JSON.parse(JSON.stringify({
      word: word,
      definitions: definitions
    }))
  }
}
