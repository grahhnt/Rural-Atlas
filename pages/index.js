import mongoose from 'mongoose';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Grid,
  Stack,
  Card,
  CardActionArea,
  CardContent,
  Alert
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import connect from '../lib/mongodb';
import DefinitionComponent from '../components/Definition';

export default function Home({ topDef, newWords }) {
  const router = useRouter();
  const { error } = router.query;
  const [ errorComponent, setErrorComponent ] = useState(null);

  useEffect(() => {
    switch(error) {
      case "NOT_IN_GUILD":
        setErrorComponent(<Alert severity="error">Failed to login; You are not in the guild required.</Alert>)
      break;
    }
  }, []);

  return (
    <Container>
      {errorComponent}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="h3">Top Definitions</Typography>
          <Stack spacing={2}>
            {topDef.map(def => (
              <Link href={"/define/" + def.word.word} passHref key={def._id}>
                <DefinitionComponent def={def} showActions={true} readOnly={true} />
              </Link>
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h3">New Words</Typography>
          <Stack spacing={2}>
            {newWords.map(word => (
              <Link href={"/define/" + word.word} passHref key={word._id}>
                <DefinitionComponent def={word.firstDefinition} word={word} showActions={true} readOnly={true} />
              </Link>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  )
}

export async function getServerSideProps() {
  await connect();
  const { Definition, Word } = mongoose.models;

  var topDef = await Definition.aggregate([
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
    },
    {
      $limit: 5
    }
  ]);
  await Definition.populate(topDef, { path: "owner" });
  await Definition.populate(topDef, { path: "word" });

  const newWords = await Word.find({}).sort({ _createdAt: -1 }).populate("firstDefinition");

  return {
    props: JSON.parse(JSON.stringify({
      topDef,
      newWords
    }))
  }
}
