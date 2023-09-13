import useSWR from 'swr'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { Spinner } from '@chakra-ui/react'
import { Image, SimpleGrid, Box } from '@chakra-ui/react'
import { Text } from '@chakra-ui/react'
import { Divider } from '@chakra-ui/react'
import { Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption } from '@chakra-ui/react'
import { IconButton } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { useColorMode } from '@chakra-ui/react'
import styles from '../styles/Home.module.css'
import Countdown from 'react-countdown'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, fetchDigitalAsset, fetchAllDigitalAssetByOwner, fetchDigitalAssetWithTokenByMint, fetchJsonMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { mplToolbox, fetchAllTokenByOwner } from '@metaplex-foundation/mpl-toolbox'
import { getParsedAccountByMint, decodeTokenMetadata, getSolanaMetadataAddress } from '@nfteyez/sol-rayz';

const PRIZE_WALLET = "PR1ZEsoReSCT8qo24zjwKh83RAPceTM3Jb6JykxYwo6";

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode()
  const { data, error } = useSWR('/api/holder', fetcher)
  const [images, setImages] = useState([]);
  const endDate = new Date('9/19/2023 10:00:00 PM UTC');


  useEffect(() => {
    fetchImages().then((result) => { setImages(result); });
  }, []);

  if (error) return <div>Failed to load</div>
  if (!data) {
    return (
      <div className={styles.loading}>
        <Spinner size="xl" />
        <Text as="h2">Fetching data...</Text>
        <Text as="h4">This can take up to 20 seconds</Text>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Bread Heads Gaming Challenge #1: Mazes</title>
        <meta name="description" content="Bread Heads Gaming Challenge #1: Mazes" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <IconButton onClick={toggleColorMode}>{colorMode === 'light' ? <MoonIcon /> : <SunIcon />}</IconButton>
        <Image
          boxSize="300px"
          src="/logo.png"
          alt="Bread Heads Logo"
        />
        <div className={styles.description}>
          <Countdown date={endDate} />
          <h2>Remaining</h2>
        </div>
        <h1 className={styles.title}>Leaderboard</h1>
        {/* <p className={styles.description}>Check the unofficial leaderboard right below 🐱‍💻</p> */}
        <Divider />
        <Table variant="striped" size="sm">
          <TableCaption placement="top">
            Congrats to all participants!
          </TableCaption>
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Wallet Address</Th>
              <Th isNumeric># of Mazes Completed</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.participantScores.map((user, index) => (
              <Tr key={user.id}>
                <Td>{++index}</Td>
                <Td>{user.id}</Td>
                <Td isNumeric>{user.points}</Td>
              </Tr>
            ))}
          </Tbody>
          <Tfoot>
            <Tr>
              <Th>Rank</Th>
              <Th>Wallet Address</Th>
              <Th isNumeric># of Mazes Completed</Th>
            </Tr>
          </Tfoot>
        </Table>
      </main>
      <h1 className={styles.title}>Prize Pool</h1>
      <Divider />
      <SimpleGrid minChildWidth={100} spacing={25}>
        {images.map((image, index) => (
          <Box key={index}>
            <Image
              width={100}
              height={100}
              key={index}
              src={image.src}
              alt=""
            />
            <Text width={100} className={styles.nft}>{image.caption}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </div>
  )
}

async function fetchImages() {
  const umi = createUmi(process.env.NEXT_PUBLIC_RPC_URL)
    .use(mplTokenMetadata())
    .use(mplToolbox());

  const tokenList = await (await fetch("https://token.jup.ag/all")).json();
  // console.log(tokenList);

  let images = []

  const assets = await fetchAllTokenByOwner(umi, PRIZE_WALLET);
  // console.log(assets);
  for (const asset of assets) {
    try {
      console.log("Asset:", asset);
      const metadata = await fetchDigitalAsset(umi, asset.mint);
      console.log("Metadata: ", metadata);
      const json = await fetchJsonMetadata(umi, metadata.metadata.uri);
      console.log("JSON: ", json);
      let caption = json.name;
      if (asset.amount > 1) {
        caption = metadata.metadata.symbol + ": " + (Number(asset.amount) / Math.pow(10, metadata.mint.decimals));
      }

      images.push({
        src: json.image,
        caption,
      });
    } catch (e) {
      console.log("Error:", JSON.stringify(e));
      if (e.name === "AccountNotFoundError") {
        for (const entry of tokenList) {
          if (entry.address === asset.mint) {
            // console.log(entry);
            images.push({
              src: entry.logoURI,
              caption: entry.symbol + ": " + (Number(asset.amount) / Math.pow(10, entry.decimals)),
            });
          }
        }
      } else if (e.name === "UnexpectedAccountError") {
      }
    }
  }

  const balance = await umi.rpc.getBalance(PRIZE_WALLET);
  // console.log(balance);
  images.push({
    src: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png",
    caption: "SOL: " + (Number(balance.basisPoints) / 1000000000),
  })

  console.log(images);
  return images;
}