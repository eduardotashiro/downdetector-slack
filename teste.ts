import {checkPixStatus} from './src/pages/pix';

async function go() {
    const pixStatus =  await checkPixStatus();
    console.log("Status:", pixStatus)
    console.log("==============================================");
    console.log("reports data:", pixStatus.series.reports.data)
    console.log("==============================================");
    console.log("baseline data:", pixStatus.series.baseline.data)
    
}

go();