import Cors from 'cors'
import initMiddleware from '../../lib/init-middleware'
import { web3, Program } from '@coral-xyz/anchor'
const idl = require('../wallet_tracker.json');

const programID = new web3.PublicKey('TRCKTiWtWCzCopm4mnR47n4v2vEvjRQ1q6rsDxRUbVR');

// Initialize the cors middleware
const cors = initMiddleware(
  // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
  Cors({
    // Only allow requests with GET, POST and OPTIONS
    methods: ['GET', 'POST', 'OPTIONS'],
  })
)

export default async function handler(req, res) {
  // Run cors
  await cors(req, res)

  const assets = await getAssetsByGroup(process.env.NEXT_PUBLIC_RPC_URL, "GGWenrFHkEqFuJpVSFQbcMsF88UF1ShoGGBAm6FzshZq");

  // const connection = new web3.Connection(process.env.RPC_URL);
  // const provider = { connection: connection };
  // const program = new Program(idl, programID, provider);
  // const proofs = await program.account.winProof.all();
  // console.log(proofs);
  let participants = {};
  for (const asset of assets) {
    const wallet = asset.ownership.owner;
    // console.log(wallet);
    if (participants[wallet] === undefined) {
      participants[wallet] = 1;
    } else {
      participants[wallet] += 1;
    }
  }
  console.log(participants);

  let participantScores = [];
  for (const participant of Object.keys(participants)) {
    // console.log(await getDomain(participant));
    // console.log(await getAllDomains(connection, new web3.PublicKey(participant)));
    const user = { id: participant, points: participants[participant] };
    participantScores.push(user);
  }

  // sort the scores from highest to lowest points
  participantScores = participantScores.sort((a, b) => (a.points < b.points ? 1 : -1))

  console.log(participantScores);
  res.json({ participantScores: participantScores })
}

const getAssetsByGroup = async (url, collectionMint) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'getAssetsByGroup',
      params: {
        groupKey: 'collection',
        groupValue: collectionMint,
        page: 1, // Starts at 1
        limit: 1000,
      },
    }),
  });
  const { result } = await response.json();
  console.log("Assets by Group: ", result.items);
  return result.items;
};