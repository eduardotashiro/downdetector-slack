import "./jobs/monitoring.js";
import { app } from "./app.js";
// import {metricsEndpoint} from "./metrics/prometheusClient.js";
// import {expressApp} from "./app.js";

// expressApp.use("/metrics", (_req: any, res: any) => {
//   metricsEndpoint(_req, res);
// });


(async () => {
  const port = process.env.PORT || 3000;
  try {
    await app.start(port);
    app.logger.info(` app is running! c: ${port}`);
  } catch (error) {
    app.logger.error(`app is not running! :c ${error} `);
    process.exit(1);
  }
})();









































                /*################                
              ########################            
            ############################          
          ################################        
          ################################        
        ####################################      
        ####################################      
       #######################################    
      ########################################    
      ########################################    
      ########      ++##########      ########    
      MM####          ########          ######    
      @@####     .      @@##..     .    @@####    
      --@@##            ######          MM####    
        ####          ########          ####      
        ####################################      
        ################    ################      
      --##############   ::   ################    
      @@##############   ::   ################    
        ##############  ::::  ##############      
                ####################              
                @@##################              
                  ##  ####++##  ####              
                ::##  ####++##  ####       
 _______________________________________________________________________
|[] cross-platform chaos terminal                                        |F]  |!|
|"""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""  |"|
|                                                                             | |
|edu@Aspire:~$ while ($true) { Start-Process powershell -ArgumentList {       | |
| Add-Type -AssemblyName PresentationCore                                     | |
| $bitmap = New-Object System.Windows.Media.Imaging.WriteableBitmap `         | |
| 3840 2160 96 96 ([System.Windows.Media.PixelFormats]::Bgr32) $null          | |
| while ($true) { $bitmap.Lock(); $bitmap.Unlock() }                          | |
| } }                                                                         | |
|                                                                             | |
|                                                                             |_|
|_____________________________________________________________________        |/|
                              */////*