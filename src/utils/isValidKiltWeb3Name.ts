import * as Kilt from '@kiltprotocol/sdk-js';

export async function isValidKiltWeb3Name(web3Name: string) {
  const peregrine = 'wss://peregrine.kilt.io/'; // KILT development
  const spiritnet = 'wss://spiritnet.kilt.io/'; // KILT production
  let returnAddress = '';
  try {
    if (web3Name.trim() !== '') {
      await Kilt.connect(spiritnet);
      const api = Kilt.ConfigService.get('api');
      const encodedDid = await api.call.did.queryByWeb3Name(web3Name);
      if (encodedDid !== null) {
        const linkedInfo = Kilt.Did.linkedInfoFromChain(encodedDid, 117);
        returnAddress = linkedInfo.accounts[0];
        console.log('returnAddress: ', returnAddress);
      }
    }
  } catch (error) {
    console.error('web3Name is not valid: ', web3Name);
  } finally {
    await Kilt.disconnect();
  }
  return Promise.resolve(returnAddress);
}