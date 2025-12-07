import {checkPixStatus} from './src/down-detector/pages/pix';

async function go() {
    const pixStatus =  await checkPixStatus();
    console.log("Status:", pixStatus)
}

go();