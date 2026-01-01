 "use strict";
//all images provided by Nintendo. (c. 2024), nintendo.com and some people from air riders community who take these images
let machineData = {};
let characterData = {};
let machinesLoaded = false;
let charactersLoaded = false;
//Bellow is a dictionary for using the JSON and displaying names of attributes
const statNames = {
        topSpeed: "Top Speed",
        boost: "Boost Power",
        charge: "Charge (s)",
        turn: "Turning (s)",
        grip: "Grip",
        lift: "Lift",
        flightSpeed: "Flight Speed",
        offense: "Offense",
        defense: "Defense",
        maxHP: "Max HP",
        weight: "Weight"
    };
let chartConversionValues = [
  2.272727273,
  2.777777778,
  108.301,
  210.6942572,
  5.2,
  14.7601476,
  2.040816327,
  3.225806452,
  1.346801347,
  0.7434944238
];

// HSL rainbow colors
let colorIndex = 0;
const rainbowColors = [
  "hsl(0, 100%, 70%)",   // red bright
  "hsl(0, 100%, 45%)",   // red dark

  "hsl(30, 100%, 70%)",  // orange bright
  "hsl(30, 100%, 35%)",  // orange dark

  "hsl(60, 100%, 70%)",  // yellow bright
  "hsl(60, 100%, 35%)",  // yellow dark

  "hsl(120, 100%, 65%)", // green bright
  "hsl(120, 100%, 30%)", // green dark

  "hsl(240, 100%, 70%)", // blue bright
  "hsl(240, 100%, 45%)", // blue dark

  "hsl(275, 100%, 70%)", // indigo bright
  "hsl(275, 100%, 40%)", // indigo dark

  "hsl(300, 100%, 70%)", // violet bright
  "hsl(300, 100%, 45%)"  // violet dark
];
//bonus function to change alternate colors
//checks if exists, then sets to value, then sets alt to appropriate value to get alt colors
let characterAltBool = localStorage.getItem("alt") === "true"; 
let characterAlt = characterAltBool ? "Alt1.webp" : ".webp";


$(document).ready(function () {    //runs when html is loaded and elements can be selected

  async function loadMachines() {  //async to use await for fetching to be done
  try {                             //error handling try block
    const response = await fetch("machines.json"); //sends request to machine json file and waits for response
    const machines = await response.json();        //Parses the response body as json and awaits the resulting promise.

    machineData = machines;       //stores response into global machines

    for (const key in machines) {  //loop through the data
      const machine = machines[key]; //sets machine to the current machine data on the machines key
      $("#machineDropdown").append(`<option value="${key}">${machine.name}</option>`); //adds the options to the machine dropdown
    }

    machinesLoaded = true; //sets the value to be true that machines have been loaded
  } catch (e) { //catches if error happens in previous block
    console.error("Failed to load machines.json", e);   //reports custom error and error data to console
  }
}

  async function loadCharacters() { // runs async to get json responses for characters
  try {                             //error handling try block  
    const response = await fetch("characters.json"); //sends request and awaits for fetching to be done
    const chars = await response.json(); //awaits response and parsing the json body

    characterData = chars; //variable for storing data

    //goes through each subject in the character json that was parsed, making key the subject then adding to dropdown options
    for (const key in chars) { 
      const char = chars[key]; //sets the opject of chars to char
      $("#characterDropdown").append(
        `<option value="${key}">${char.name}</option>`
      );
    }

    charactersLoaded = true; //for any future check
    } catch (e) { //catches if error happens in previous block
      console.error("Failed to load machines.json", e);   //reports custom error and error data to console
    }
  }


  async function init() {
    await Promise.all([loadMachines(), loadCharacters()]);  // Load both JSONs in parallel, only moves on after loaded
    tryRestoreLastCombo();   //tries to restore last combination
    populateGridDropdowns(); //populates other gird dropdowns
    createCarousel(); //populates and fills out the carousel
    initMachinesUI(); //fills out and builds accordion menu and functions(sorting)
  }

  init(); //activates the previous function

  // Load combo button
  $("#loadCombo").on("click", function () {
    //gets current values of what was selected
    const selectedMachine = $("#machineDropdown").val();   
    const selectedCharacter = $("#characterDropdown").val();

    //makes sure both are selected
    if (!selectedMachine || !selectedCharacter) {
      alert("Pick both!");
      return;
    }

    //sends out then gets back a machine rider stat combination
    const combinedStats = combineStats(
      machineData[selectedMachine],
      characterData[selectedCharacter]
    );

    //selects a current color then moves index up(below the storage) for next load chart
    const color = rainbowColors[colorIndex % rainbowColors.length];

    //draws to the chart then creates the block for displaying what the combo is for this color
    DrawChart(combinedStats, color);
    displayComboBlock(selectedCharacter, selectedMachine, color);

    //sets the current item into local storage
    localStorage.setItem(
      "lastCombo",
      JSON.stringify({
        character: selectedCharacter,
        machine: selectedMachine,
        colorIndex,
      })
    );
    colorIndex++;
  });



  // Clear button for clearing graph and combo blocks
  //gets and removes all drawings from canvas, resets color index, and clears local storage
  $("#clearCanvas").on("click", function() {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    $("#comboList").empty();
    colorIndex = 0;
    localStorage.removeItem("lastCombo");
     $("#comboGallery").html("");
  });
});

//creates one square with character, machine, and color square
function displayComboBlock(characterKey, machineKey, color) {
    // Fetch the actual data objects
    const charData = characterData[characterKey];
    const machData = machineData[machineKey];
    //creates the block html that loads a character image, a machine image, and a blank div to style to a color block
    const $comboBlock = $(` 
        <div class="combo-block">
            <div class="combo-images">
                <img src="images/KARS_Resources/Character_Renders/${charData.image + characterAlt}"
                     alt="${charData.name}" class="combo-img">
                <img src="images/KARS_Resources/Machine_Renders/${machData.image}" 
                     alt="${machData.name}" class="combo-img">
                <div class="combo-color-box"></div>
            </div>
        </div>
    `);

    $comboBlock.find(".combo-color-box").css("background", color); // Apply the passed color by the class we just set
    $("#comboGallery").append($comboBlock); // Append to gallery, allowing for many combos
}


// Combine numeric stats only
function combineStats(machine, character) {
  const statKeys = ["topSpeed","boost","charge","turn","grip","lift","flightSpeed","offense","defense","maxHP","weight"];
  const result = {};

  statKeys.forEach(k => {
    let val = machine[k];

    // invert charge and turn using 1/value method
    if (k === "charge" || k === "turn") {
      val = val !== 0 ? 1 / val : 0; // avoid division by zero
    }

    // multiply by character modifier and can scale 
    result[k] = val * character[k]*2;
  });

  return result;
}



function tryRestoreLastCombo() { //restores the last loaded combo
  if (!(machinesLoaded && charactersLoaded)) return; //if no combo is stored, dont pull anything and just return

  const saved = localStorage.getItem("lastCombo"); //gets the last loaded combo
  if (!saved) return; //return if no combo found

  const last = JSON.parse(saved);// parses the data that was stored as json (it has character, machine, and colorIndex)

  //makes the dropdowns the same as the combo being loaded
  $("#characterDropdown").val(last.character);
  $("#machineDropdown").val(last.machine);
  colorIndex = last.colorIndex || 0; //sets color or as its starting hsl list value

  //gets the calculated combo values of the stats that are loaded
  const combinedStats = combineStats(
    machineData[last.machine],
    characterData[last.character]
  );

  const color = rainbowColors[colorIndex % rainbowColors.length]; //ensures the index never exceeds the length
  DrawChart(combinedStats, color); //draws the chart for loaded combo
  displayComboBlock(last.character, last.machine, color); //displays loaded combo
  colorIndex+=1; //moves index to the next from loaded index
}


// DrawChart safely using fixed numeric stats
function DrawChart(stats, color="blue") {
  const canvas = document.getElementById("myCanvas"); //gets canvas
  const ctx = canvas.getContext("2d"); //2d canvas

  //gets the center of the graph image to start chart
  const middleX = canvas.width / 2; 
  const middleY = canvas.height / 2;

  //maps the values we will use, using a created array, in the order we will map them
  const statKeys = ["topSpeed","boost","charge","turn","grip","lift","flightSpeed","offense","maxHP","weight"];
  const values = statKeys.map(k => stats[k]);

  const total = values.length; //gets the amount of angles we will use
  const step = (2 * Math.PI) / total; //Radians for each angle

  ctx.beginPath();
  //does math to translate a directional value along the angled directions for each value
  //plots the points to the line and moves to the next one

  for (let i = 0; i < total; i++) {
    const angle = i * step;
    const x = middleX + Math.sin(angle) * values[i] * chartConversionValues[i];
    const y = middleY - Math.cos(angle) * values[i] * chartConversionValues[i];

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  //closes the path, adds the stroke values
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // HSL transparency, for the color, then adds outline and fill
  ctx.fillStyle = color.replace(")", ", 0.2)").replace("hsl", "hsla");
  ctx.stroke();
  ctx.fill();
}





//adds dropdown values for direct comparison menu
function populateGridDropdowns() {
  //shortcut to select the dropdowns into an array
  const riderSelects = ['rider1','rider2'].map(id => document.getElementById(id));
  const machineSelects = ['machine1','machine2'].map(id => document.getElementById(id));

  // Add characters to rider dropdowns
  for (const key in characterData) {
    const char = characterData[key];
    riderSelects.forEach(sel => {
      sel.innerHTML += `<option value="${key}">${char.name}</option>`;
    });
  }

  // Add machines to machine dropdowns
  for (const key in machineData) {
    const machine = machineData[key];
    machineSelects.forEach(sel => {
      sel.innerHTML += `<option value="${key}">${machine.name}</option>`;
    });
  }
}







// Compute stats for direct comparison grid
function getDirectStats(riderId, machineId) {
    //gets the values from the class of the id for riders and machines
    const riderKey = $('#' + riderId).val();
    const machineKey = $('#' + machineId).val();
    //checks the value or returns null
    const rider = riderKey ? characterData[riderKey] : null;
    const machine = machineKey ? machineData[machineKey] : null;
    //if both boxes have values, returns combined stats, else returns a false boolean
    if (rider && machine) {
        const combined = {};
        const statKeys = ["topSpeed","boost","charge","turn","grip","lift","flightSpeed","offense","defense","maxHP","weight"];
        statKeys.forEach(stat => {
            if(stat=="charge"||stat == "turn"){
                combined[stat] = ((1/rider[stat]) * (machine[stat]));
            }else{
                combined[stat] = (rider[stat]) * (machine[stat]);
            }
        });
        return combined;
    } else {
        return false;
    }
}


$("#gridCompareBtn").on("click", function() {
    // Get combined stats for Choice 1 and Choice 2
    const choice1 = getDirectStats('rider1', 'machine1');
    const choice2 = getDirectStats('rider2', 'machine2');

    //makes sure all 4 boxes were selected
    if (!(choice1 && choice2)){
      alert("Pick all four");
      return;
    }
    //gets all values and places in icons and names
    const rider1Key = $('#rider1').val();
    const machine1Key = $('#machine1').val();
    $("#firstChoice").html(`
        <div>
            <img src="images/KARS_Resources/Character_Icons/${characterData[rider1Key].image}.webp" alt="">
            ${characterData[rider1Key].name}
        </div>
        <div>
            <img src="images/KARS_Resources/Machine_Icons/${machineData[machine1Key].image}" alt="">
            ${machineData[machine1Key].name}
        </div>
    `);

    const rider2Key = $('#rider2').val();
    const machine2Key = $('#machine2').val();
    $("#secondChoice").html(`
        <div>
            <img src="images/KARS_Resources/Character_Icons/${characterData[rider2Key].image}.webp" alt="">
            ${characterData[rider2Key].name}
        </div>
        <div>
            <img src="images/KARS_Resources/Machine_Icons/${machineData[machine2Key].image}" alt="">
            ${machineData[machine2Key].name}
        </div>
    `);

    // List of stats to display
    const statKeys = ["topSpeed", "boost", "charge", "turn", "grip", "lift", "flightSpeed", "offense", "defense", "maxHP", "weight"];
    //base index
    let i=0;
    //conversion units
    let speedUnits = $("#kmOrMi").val() == "mi"? 0.6213711922:1;
    //goes through to fill in the grid
    statKeys.forEach(stat => {
        let speedStat = (stat=="topSpeed"||stat=="flightSpeed")? speedUnits:1        //checks if conversion units needed, otherwise keeps value of 1 modifier (doesn't change values)
        //multiplies to get direct value from json
        const val1 = choice1[stat] !== undefined ? choice1[stat] * speedStat : undefined;
        const val2 = choice2[stat] !== undefined ? choice2[stat] * speedStat : undefined;
        $('#' + stat + '1').text(val1 !== undefined ? val1.toFixed(2) : '—');
        $('#' + stat + '2').text(val2 !== undefined ? val2.toFixed(2) : '—');
        //checks and calculates the number difference
        //based on first input for differences and percentages
        $('#' + stat + 'Diff').text((val1 !== undefined && val2 !== undefined)? (val2 - val1).toFixed(2) : '—');
        //wont return a difference value if too low, otherwise calculates percent
        if(val1 > .001 && val2 >.001){
            $('#' + stat + 'DiffPercent').text(((val2/val1)*100).toFixed(1) +"%");
        }else{
            $('#' + stat + 'DiffPercent').text("NA");
        }
    });
});

//starting global variable to have carousel auto-cycle
let carouselAutoPlay = true

function createCarousel() {
    //gets the keys of the character data
    const keys = Object.keys(characterData);

    // Build the thumbnail carousel
    keys.forEach(key => {
        //gets the dictionary from the key
        const char = characterData[key];
        //sets div to append to the carousel div
        $(".characterCarousel").append(`
            <div>
                <img src="images/KARS_Resources/Character_Renders/${char.image + characterAlt}" alt="${char.name}">
            </div>
        `);
    });

    // Initialize thumbnail carousel
    $('.characterCarousel').slick({
        slidesToShow: 5,
        centerMode: true,
        focusOnSelect: true,
        slidesToScroll: 1,
        autoplay: carouselAutoPlay,
        autoplaySpeed: 5000,
    });
    //arrows for sliding carrousel
    $(".slick-prev").text("\u2190")
    $(".slick-next").text("\u2192")
    // Update main display when a thumbnail is clicked / slide changes
    $('.characterCarousel').on('afterChange', function(event, slick, currentSlide) {
        const charKey = keys[currentSlide % keys.length]; // wrap safely
        updateCharacterInfo(characterData[charKey]);
    });

    //update info on initial load
    updateCharacterInfo(characterData[keys[0]]);
}

// Function to update main display (#characterDisplay)
function updateCharacterInfo(char) {
    if (!char) return; // safety check

    //for the main display
    $("#charImage").attr("src", `images/KARS_Resources/Character_Renders/${char.image + characterAlt}`);
    $("#charName").text(char.name);
    $("#charDescription").text(char.description);

    // Stats table
    const statKeys = ["topSpeed","boost","charge","turn","grip","lift","flightSpeed","offense","defense","maxHP","weight"];
    
    //table of info and stats
    let statsHTML = '<table class="char-stats">';
    statKeys.forEach(stat => {
        statsHTML += `<tr>
                        <td class="charStatName">${statNames[stat]}</td>
                        <td class="charStatValue">${char[stat]}</td>
                      </tr>`;
    });
    statsHTML += '</table>';

    $("#charStats").html(statsHTML);
}

//determines if the carousel scrolls or not, a toggle
$("#carouselAutoplayBtn").on("click", function () {
    //determines if it is on
    const isOn = $(this).text().includes("ON");
    //toggle class and auto-scrolling or not
    if (isOn) {
        $('.characterCarousel').slick('slickPause');
        $(this).text("Autoplay: OFF").addClass("off");
    } else {
        $('.characterCarousel').slick('slickPlay');
        $(this).text("Autoplay: ON").removeClass("off");
    }
});






// --- GLOBAL for the vehicle display / accordion---
let currentSortProp = null;
let currentSortDir = 1; // 1 = ascending, -1 = descending

//stores the settings of sort and direction from global variables
function saveSortSettings() {
    localStorage.setItem("machineSortProp", currentSortProp);
    localStorage.setItem("machineSortDir", currentSortDir);
}

//loads the settings to the global variables
function loadSortSettings() {
    currentSortProp = localStorage.getItem("machineSortProp") || "";
    currentSortDir = Number(localStorage.getItem("machineSortDir") || 1);
}

function buildMachineSortControls() {
    //declaring a jquery variable to the controls, and empties
    const $controls = $("#machineSortControls");
    $controls.empty();

    //if no machines, return
    if (Object.keys(machineData).length === 0) return;

    //adds alphabetical forward and backward options
    let html = `
        <label for="machineSortSelect">Sort by:</label>
        <select id="machineSortSelect">
            <option value="">-- Select a sort --</option>
            <option value="alpha">Alphabetical (A → Z)</option>
            <option value="alphaRev">Alphabetical (Z → A)</option>
    `;

    // Add all stats to options to sort by
    Object.keys(statNames).forEach(stat => {
        html += `<option value="${stat}">${statNames[stat]}</option>`;
    });

    //ascending and descending buttons
    html += `</select>

             <button id="sortAsc">Asc</button>
             <button id="sortDesc">Desc</button>
            `;
    //adds the values to the dropdown.
    $controls.append(html);

    // Events
    //when changes, sorts
    $("#machineSortSelect").on("change", () => {
        currentSortProp = $("#machineSortSelect").val();
        updateMachineSort();
    });

    //selecting ascending or descending, sets sort value and adds classes

    $("#sortAsc").on("click", () => {
        currentSortDir = 1;
        $("#sortAsc, #sortDesc").removeClass("active"); // remove active from both
        $("#sortAsc").addClass("active");              // set active on this one
        updateMachineSort();
    });

    $("#sortDesc").on("click", () => {

        currentSortDir = -1;
        $("#sortAsc, #sortDesc").removeClass("active"); // remove active from both
        $("#sortDesc").addClass("active");             // set active on this one
        updateMachineSort();
    });


    // Load saved selection into UI
    $("#machineSortSelect").val(currentSortProp);
    if (currentSortDir === 1) {
        $("#sortAsc").addClass("active");
    } else {
        $("#sortDesc").addClass("active");
    }


    $("#kmOrMi2").on("change", () => {
        updateMachineSort();
    })
}



function updateMachineSort() {

    // Save current settings
    saveSortSettings();

    const keys = Object.keys(machineData);
    //if current sort isn't selected/has a value, goes to build accordion with given order
    if (!currentSortProp) {
        buildMachineAccordion(keys);
        return;
    }

    //sorted variable for storing
    let sortedKeys;


    //sorting algorithms
    if (currentSortProp === "alpha") {
        sortedKeys = keys.sort((a, b) =>
            machineData[a].name.localeCompare(machineData[b].name)
        );
    }
    else if (currentSortProp === "alphaRev") {
        sortedKeys = keys.sort((a, b) =>
            machineData[b].name.localeCompare(machineData[a].name)
        );
    }
    //forward or reverses by multiplying by 1 or -1 in algorithm
    else {
        sortedKeys = keys.sort((a, b) => {
            const A = machineData[a][currentSortProp];
            const B = machineData[b][currentSortProp];
            return (A > B ? 1 : A < B ? -1 : 0) * currentSortDir;
        });
    }
    //builds accordion with newly sorted values
    buildMachineAccordion(sortedKeys, currentSortProp);
}




function buildMachineAccordion(keysOverride = null, sortProp = null) {
    //setting the jquery variable to the empty accordion div
    const $acc = $("#accordion");
    
    //if it is a built accordion, remove everything
    if ($acc.hasClass("ui-accordion")) {
        $acc.accordion("destroy");
    }
    $acc.empty();
    //if no objects in machine data, return
    if (Object.keys(machineData).length === 0) return;

    //sets the first value thats truthy(in this case, if keysOverride is null, will set normal keys order)
    const keys = keysOverride || Object.keys(machineData);

    //goes through all keys in order passed above
    //builds the accordion for each machine
    keys.forEach(id => {
        //sets current object
        const m = machineData[id];

        
        // Get the stat value if sortProp is provided
        let statDisplay = "";
        if (sortProp && m[sortProp] !== undefined) {
            let units = (sortProp === "topSpeed" || sortProp === "flightSpeed")
                        ? ($("#kmOrMi2").val() === "mi" ? " mi/hr" : " km/hr")
                        : "";
            units = (sortProp === "charge" || sortProp === "turn")
                      ? " seconds": units;
            let unitsMod = units == " mi/hr"? 0.6213711922:1;
            statDisplay = ` - ${(Number(m[sortProp]*unitsMod.toFixed(2)))}${units}`;
        }

        // Section Header, icon and name
        const $header = $(`
            <h3>
                <img src="images/KARS_Resources/Machine_Icons/${m.image}">
                ${m.name} 
                \t ${statDisplay}

            </h3>
        `);

        // Content block
        const $content = $("<div></div>");

        

        // Inside Header
        const $insideHeader = $(`
            <h4>${m.name}</h4>
        `);

        // Main image
        const $img = $(`
            <img src="images/KARS_Resources/Machine_Renders/${m.image}">
        `);

        // Description
        const $desc = $(`<p>${m.description}</p>`);

    //creates stat block with header and table for setting values
    let statsHTML = `  
          <h4>Stat Values</h4>
          <table class="machine-stats-table">
              <thead>
                  <tr>
                  </tr>
              </thead>
              <tbody>
      `;
    //i for actual stat value array looping
    let i=0
    //loops through the values of the machine object and sets the table values
    Object.keys(m).forEach(prop => {
          if (["name", "image", "description"].includes(prop)) return; //excludes the values that aren't what we want to use
          //adds units to top speed
         let units = (prop === "topSpeed" || prop === "flightSpeed")
                        ? ($("#kmOrMi2").val() === "mi" ? " (mi / hr)" : " (km / hr)")
                        : "";
          
          //let units = prop=="topSpeed"||"flightSpeed"?" (km / hr)":"";
          let unitsMultiplier =  units == " (mi / hr)"? 0.6213711922:1;
          //adds stat title and values
          statsHTML += `
              <tr>
                  <td>${statNames[prop] + units}</td>
                  <td>${(Number((m[prop]) *unitsMultiplier).toFixed(2)) }</td>
              </tr>
          `;
          //next array value actuator
          i++
      });
      //adds closing tags
      statsHTML += `
              </tbody>
          </table>
      `;

      //gets element as variable then appends the accordions that are finished
      const $stats = $(statsHTML);

      $content.append($insideHeader, $img, $desc, $stats);

      $acc.append($header, $content);
    });

    //ACCORDION and builder
    $("#accordion").accordion({
          heightStyle: "content",  // panel height = content height
          collapsible: true,       // allows panels to be closed
          animate: 200             // optional animation in ms
      });
}


//initializes the accordion in order
function initMachinesUI() {
    loadSortSettings();
    buildMachineSortControls();
    buildMachineAccordion();
}

//bonus function to change alternate colors
$("#secret").on("click", function(){
    characterAltBool = !characterAltBool; //toggle
    characterAlt = characterAltBool? "Alt1.webp" : ".webp"; //toggle, have webp for redundancy reduction and ease of use

    //keeps if the alt was pressed
    localStorage.setItem("alt", characterAltBool);

    
    //refresh the page to get alts, otherwise loads only new renders of alts
    /*
    setTimeout(() => {
        location.reload();
    }, 500);
    */

    
})






