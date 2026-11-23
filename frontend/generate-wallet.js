const { ethers } = require('ethers');

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log('🔑 NEW WALLET GENERATED');
console.log('========================');
console.log('Private Key:', wallet.privateKey);
console.log('Address:', wallet.address);
console.log('Mnemonic:', wallet.mnemonic.phrase);
console.log('');
console.log('📝 ENVIRONMENT VARIABLE:');
console.log('SYSTEM_WALLET_PRIVATE_KEY=' + wallet.privateKey);
console.log('');
console.log('⚠️  SECURITY WARNING:');
console.log('- Keep this private key secure');
console.log('- Only use for development');
console.log('- Never commit to version control');
console.log('- Fund this wallet with test tokens'); 