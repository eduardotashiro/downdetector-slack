import {checkPixStatus} from './src/pages/pix';

async function go() {
    const pixStatus =  await checkPixStatus();
    console.log("Status:", pixStatus)
}

go();