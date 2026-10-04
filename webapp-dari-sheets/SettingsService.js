function getAppSettings(){


  const ss =
    SpreadsheetApp
    .getActiveSpreadsheet();



  let sheet =
    ss.getSheetByName(
      CONFIG.SHEETS.SETTINGS
    );



  if(!sheet){


    sheet =
      ss.insertSheet(
        CONFIG.SHEETS.SETTINGS
      );


    sheet
    .getRange(
      1,
      1,
      3,
      2
    )
    .setValues([

      [
        "Key",
        "Value"
      ],

      [
        "LOCATION",
        CONFIG.LOCATION
      ],

      [
        "FREQUENCY",
        "MANUAL"
      ]

    ]);


    sheet.setFrozenRows(1);


  }




  const data =
    sheet
    .getDataRange()
    .getValues();



  let settings = {


    location:
      CONFIG.LOCATION,


    frequency:
      "MANUAL"


  };



  for(
    let i=1;
    i<data.length;
    i++
  ){



    if(
      data[i][0]==="LOCATION"
    ){


      settings.location =
        data[i][1];


    }



    if(
      data[i][0]==="FREQUENCY"
    ){


      settings.frequency =
        data[i][1];


    }


  }



  return settings;


}







function saveAppSettings(
  location,
  frequency
){



  const ss =
    SpreadsheetApp
    .getActiveSpreadsheet();



  let sheet =
    ss.getSheetByName(
      CONFIG.SHEETS.SETTINGS
    );



  if(!sheet){


    sheet =
      ss.insertSheet(
        CONFIG.SHEETS.SETTINGS
      );


  }





  const data =
    sheet
    .getDataRange()
    .getValues();



  let locationRow = -1;

  let frequencyRow = -1;




  for(
    let i=1;
    i<data.length;
    i++
  ){



    if(
      data[i][0]==="LOCATION"
    ){

      locationRow =
        i+1;

    }



    if(
      data[i][0]==="FREQUENCY"
    ){

      frequencyRow =
        i+1;

    }



  }





  if(locationRow>0){


    sheet
    .getRange(
      locationRow,
      2
    )
    .setValue(
      location
    );


  }
  else{


    sheet
    .appendRow([

      "LOCATION",

      location

    ]);


  }





  if(frequencyRow>0){


    sheet
    .getRange(
      frequencyRow,
      2
    )
    .setValue(
      frequency
    );


  }
  else{


    sheet
    .appendRow([

      "FREQUENCY",

      frequency

    ]);


  }





  updateScraperTrigger(
    frequency
  );




  return {


    success:true,


    message:
      "Settings berhasil disimpan"


  };


}








// ==============================
// AUTO SCRAPER TRIGGER
// ==============================


function updateScraperTrigger(
  frequency
){



  const triggers =
    ScriptApp
    .getProjectTriggers();



  triggers.forEach(t=>{


    if(
      t.getHandlerFunction()
      ===
      "runAutoScraperPipeline"
    ){


      ScriptApp
      .deleteTrigger(t);


    }


  });





  if(
    frequency==="HOURLY"
  ){


    ScriptApp
    .newTrigger(
      "runAutoScraperPipeline"
    )
    .timeBased()
    .everyHours(1)
    .create();


  }




  if(
    frequency==="DAILY"
  ){


    ScriptApp
    .newTrigger(
      "runAutoScraperPipeline"
    )
    .timeBased()
    .everyDays(1)
    .create();


  }



}







function runAutoScraperPipeline(){


  try{


    runLinkedInPipeline();


    runJobstreetPipeline();



  }
  catch(e){


    console.error(
      e
    );


  }


}