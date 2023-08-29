import Cors from 'cors'
import initMiddleware from '../../lib/init-middleware'
import { web3, Program } from '@coral-xyz/anchor'
import { getAllDomains, reverseLookup } from "@bonfida/spl-name-service";
const { Octokit } = require('@octokit/rest')
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

// Initialize octokit github api
const octokit = new Octokit({
  auth: process.env.github_token,
})

export default async function handler(req, res) {
  // Run cors
  await cors(req, res)

  const connection = new web3.Connection("https://solana-mainnet.rpc.extrnode.com");
  const provider = { connection: connection };
  const program = new Program(idl, programID, provider);
  const proofs = await program.account.winProof.all();
  // console.log(proofs);
  let participants = {};
  for (const proof of proofs) {
    const wallet = proof.account.winnerWallet.toString();
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
    const user = { id: await getDomain(connection, participant), points: participants[participant] };
    participantScores.push(user);
  }

  // sort the scores from highest to lowest points
  participantScores = participantScores.sort((a, b) => (a.points < b.points ? 1 : -1))

  console.log(participantScores);
  res.json({ participantScores: participantScores })
}

async function getDomain(connection, address) {
  // try {
  const pubKey = new web3.PublicKey(address);
  const domains = await getAllDomains(connection, pubKey);
  if (domains.length === 0) {
    return address;
  } else {
    console.log("Domains:", domains);
    const reqs = domains.map((x) => reverseLookup(connection, x));
    console.log("Reqs:", reqs);
    const resolvedNames = await Promise.all(reqs);
    console.log("Resolved Names:", resolvedNames);

    return resolvedNames[0];
  }
  // } catch (e) {
  //   return address;
  // }
}