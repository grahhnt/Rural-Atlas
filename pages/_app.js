import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Container } from '@mui/material';

import { withSessionPage } from '../lib/iron';
import Navbar from '../components/Navbar';

function MyApp({ Component, pageProps }) {
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return <>
    <Head>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
      />
    </Head>

    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Navbar />
      <Container>
        <Component {...pageProps} />
      </Container>
    </ThemeProvider>
  </>
}

export default MyApp
