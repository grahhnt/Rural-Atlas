import mongoose from 'mongoose';
import connect from '../lib/mongodb';

export default function Random() {
  return <div>Redirecting</div>;
}

export async function getServerSideProps() {
  await connect();
  const { Word } = mongoose.models;

  const wordCount = await Word.count();
  const word = await Word.findOne().skip(Math.floor(Math.random() * wordCount));

  return {
    redirect: {
      destination: "/define/" + word.word.toLowerCase()
    }
  }
}
