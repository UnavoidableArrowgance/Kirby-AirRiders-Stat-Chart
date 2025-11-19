 "use strict";

let machineData = {};
let characterData = {};
let colorIndex = 0;
let machinesLoaded = false;
let charactersLoaded = false;
const statNames = {
        topSpeed: "Top Speed",
        boost: "Boost Power",
        charge: "Charge Rate",
        turn: "Turning",
        grip: "Grip",
        lift: "Lift",
        flightSpeed: "Flight Speed",
        offense: "Offense",
        maxHP: "Max HP",
        weight: "Weight"
    };
 let actualStatValues = [0.2,    0.2,      1,        1,      1,      1,        .2,          .3,        .5,       .3];

// Smooth HSL rainbow colors
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

    characterData = chars;

    for (const key in chars) {
      const char = chars[key];
      $("#characterDropdown").append(
        `<option value="${key}">${char.name}</option>`
      );
    }

    charactersLoaded = true;
    } catch (e) { //catches if error happens in previous block
      console.error("Failed to load machines.json", e);   //reports custom error and error data to console
    }
  }

  // Load both JSONs in parallel
  async function init() {
    await Promise.all([loadMachines(), loadCharacters()]);
    tryRestoreLastCombo();   //tries to restore last combination
    populateGridDropdowns();
    createCarousel()
    initMachinesUI();
  }

  init();

  // Load combo button
  $("#loadCombo").on("click", function () {
    const selectedMachine = $("#machineDropdown").val();
    const selectedCharacter = $("#characterDropdown").val();

    if (!selectedMachine || !selectedCharacter) {
      alert("Pick both!");
      return;
    }

    const combinedStats = combineStats(
      machineData[selectedMachine],
      characterData[selectedCharacter]
    );

    const color = rainbowColors[colorIndex % rainbowColors.length];
    colorIndex++;

    DrawChart(combinedStats, color);
    displayComboBlock(selectedCharacter, selectedMachine, color);

    localStorage.setItem(
      "lastCombo",
      JSON.stringify({
        character: selectedCharacter,
        machine: selectedMachine,
        colorIndex,
      })
    );
  });



  // Clear button
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

function displayComboBlock(characterKey, machineKey, color) {
    // Fetch the actual data objects
    const charData = characterData[characterKey];
    const machData = machineData[machineKey];
    const $comboBlock = $(`
        <div class="combo-block">
            <div class="combo-images">
                <img src="images/KARS Resources/Character Renders/${charData.image}" 
                     alt="${charData.name}" class="combo-img">
                <img src="images/KARS Resources/Machine Renders/${machData.image}" 
                     alt="${machData.name}" class="combo-img">
                <div class="combo-color-box"></div>
            </div>
        </div>
    `);

    $comboBlock.find(".combo-color-box").css("background", color); // Apply the passed color
    $("#comboGallery").append($comboBlock); // Append to gallery
}


// Combine numeric stats only
function combineStats(machine, character) {
  const statKeys = ["topSpeed","boost","charge","turn","grip","lift","flightSpeed","offense","maxHP","weight"];
  const result = {};
  statKeys.forEach(k => { result[k] = machine[k] * (character[k]) *2; });
  return result;
}


function tryRestoreLastCombo() {
  if (!(machinesLoaded && charactersLoaded)) return;

  const saved = localStorage.getItem("lastCombo");
  if (!saved) return;

  const last = JSON.parse(saved);

  $("#characterDropdown").val(last.character);
  $("#machineDropdown").val(last.machine);
  colorIndex = last.colorIndex || 0;

  const combinedStats = combineStats(
    machineData[last.machine],
    characterData[last.character]
  );

  const color = rainbowColors[colorIndex % rainbowColors.length];
  DrawChart(combinedStats, color);
  displayComboBlock(last.character, last.machine, color);
  colorIndex+=1
}


// DrawChart safely using fixed numeric stats
function DrawChart(stats, color="blue") {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");

  const middleX = canvas.width / 2;
  const middleY = canvas.height / 2;

  const statKeys = ["topSpeed","boost","charge","turn","grip","lift","flightSpeed","offense","maxHP","weight"];
  const values = statKeys.map(k => stats[k]);

  const total = values.length;
  const step = (2 * Math.PI) / total;

  ctx.beginPath();
  for (let i=0;i<total;i++){
    const angle = i*step;
    const x = middleX + Math.sin(angle)*values[i];
    const y = middleY - Math.cos(angle)*values[i];
    if(i===0){
        ctx.moveTo(x,y);
    }else {
        ctx.lineTo(x,y);
    }
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // HSL transparency works the same as hex + "33"
  ctx.fillStyle = color.replace(")", ", 0.2)").replace("hsl", "hsla");
  ctx.stroke();
  ctx.fill();
}






function populateGridDropdowns() {
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


  for (const key in characterData) {
    const char = characterData[key];
    riderSelects.forEach(sel => {
      sel.innerHTML += `<option value="${key}">${char.name}</option>`;
    });
  }
}







// Compute stats for direct comparison grid
function getDirectStats(riderId, machineId) {
    const riderKey = $('#' + riderId).val();
    const machineKey = $('#' + machineId).val();

    const rider = riderKey ? characterData[riderKey] : null;
    const machine = machineKey ? machineData[machineKey] : null;

    if (rider && machine) {
        const combined = {};
        const statKeys = ["topSpeed","boost","charge","turn","grip","lift","flightSpeed","offense","maxHP","weight"];
        statKeys.forEach(stat => {
            combined[stat] = (rider[stat]) * (machine[stat]);
        });
        return combined;
    } else {
        return false;
    }
}

$('#rider1, #rider2, #machine1, #machine2').on('change', function() {
    getDirectStats();
});


$("#gridCompareBtn").on("click", function() {
    // Get combined stats for Choice 1 and Choice 2
    const choice1 = getDirectStats('rider1', 'machine1');
    const choice2 = getDirectStats('rider2', 'machine2');
    if (!(choice1 && choice2)){
      alert("Pick all four");
      return;
    }

    const rider1Key = $('#rider1').val();
    const machine1Key = $('#machine1').val();

    
    $("#firstChoice").html(`
        <div>
            <img src="images/KARS Resources/Character Icons/${characterData[rider1Key].image}" alt="">
            ${characterData[rider1Key].name}
        </div>
        <div>
            <img src="images/KARS Resources/Machine Icons/${machineData[machine1Key].image}" alt="">
            ${machineData[machine1Key].name}
        </div>
    `);

    const rider2Key = $('#rider2').val();
    const machine2Key = $('#machine2').val();

    $("#secondChoice").html(`
        <div>
            <img src="images/KARS Resources/Character Icons/${characterData[rider2Key].image}" alt="">
            ${characterData[rider2Key].name}
        </div>
        <div>
            <img src="images/KARS Resources/Machine Icons/${machineData[machine2Key].image}" alt="">
            ${machineData[machine2Key].name}
        </div>
    `);

    // List of stats to display
    const statKeys = ["topSpeed", "boost", "charge", "turn", "grip", "lift", "flightSpeed", "offense", "maxHP", "weight"];

    let i=0;
    let speedUnits = $("#kmOrMi").val() == "mi"? 0.6213711922:1;
    statKeys.forEach(stat => {
        let speedStat = stat=="topSpeed"? speedUnits:1
        const val1 = choice1[stat] !== undefined ? choice1[stat] *  actualStatValues[i] * speedStat : undefined;
        const val2 = choice2[stat] !== undefined ? choice2[stat] *  actualStatValues[i] * speedStat : undefined;
        $('#' + stat + '1').text(val1 !== undefined ? val1.toFixed(2) : '—');
        $('#' + stat + '2').text(val2 !== undefined ? val2.toFixed(2) : '—');
        $('#' + stat + 'Diff').text((val1 !== undefined && val2 !== undefined)? (val1 - val2).toFixed(2) : '—');
        if(val1 > 1 && val2 >1){
            $('#' + stat + 'DiffPercent').text(((val1/val2)*100).toFixed(1) +"%");
        }else{
            $('#' + stat + 'DiffPercent').text("NA");
        }
    });
});


let carouselAutoPlay = true

function createCarousel() {
    const keys = Object.keys(characterData);

    // Build the thumbnail carousel
    keys.forEach(key => {
        const char = characterData[key];

        $(".characterCarousel").append(`
            <div>
                <img src="images/KARS Resources/Character Renders/${char.image}" alt="${char.name}">
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
    
    $(".slick-prev").text("\u2190")
    $(".slick-next").text("\u2192")
    // Update main display when a thumbnail is clicked / slide changes
    $('.characterCarousel').on('afterChange', function(event, slick, currentSlide) {
        const charKey = keys[currentSlide % keys.length]; // wrap safely
        updateCharacterInfo(characterData[charKey]);
    });

    // Optional: update info on initial load
    updateCharacterInfo(characterData[keys[0]]);
}

// Function to update main display (#characterDisplay)
function updateCharacterInfo(char) {
    if (!char) return; // safety check

    $("#charImage").attr("src", `images/KARS Resources/Character Renders/${char.image}`);
    $("#charName").text(char.name);
    $("#charDescription").text(char.description);

    // Stats table
    const statKeys = ["topSpeed","boost","charge","turn","grip","lift","flightSpeed","offense","maxHP","weight"];
    

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


$("#carouselAutoplayBtn").on("click", function () {
    const isOn = $(this).text().includes("ON");

    if (isOn) {
        $('.characterCarousel').slick('slickPause');
        $(this).text("Autoplay: OFF").addClass("off");
    } else {
        $('.characterCarousel').slick('slickPlay');
        $(this).text("Autoplay: ON").removeClass("off");
    }
});






// --- GLOBAL ---
let currentSortProp = null;
let currentSortDir = 1; // 1 = ascending, -1 = descending

function saveSortSettings() {
    localStorage.setItem("machineSortProp", currentSortProp);
    localStorage.setItem("machineSortDir", currentSortDir);
}

function loadSortSettings() {
    currentSortProp = localStorage.getItem("machineSortProp") || "";
    currentSortDir = Number(localStorage.getItem("machineSortDir") || 1);
}

function buildMachineSortControls() {
    const $controls = $("#machineSortControls");
    $controls.empty();

    if (Object.keys(machineData).length === 0) return;

    let html = `
        <label for="machineSortSelect">Sort by:</label>
        <select id="machineSortSelect">
            <option value="">-- Select a sort --</option>
            <option value="alpha">Alphabetical (A → Z)</option>
            <option value="alphaRev">Alphabetical (Z → A)</option>
    `;

    // Add all stats
    Object.keys(statNames).forEach(stat => {
        html += `<option value="${stat}">${statNames[stat]}</option>`;
    });

    html += `</select>

             <button id="sortAsc">Asc</button>
             <button id="sortDesc">Desc</button>
            `;

    $controls.append(html);

    // Events
    $("#machineSortSelect").on("change", () => {
        currentSortProp = $("#machineSortSelect").val();
        updateMachineSort();
    });

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

}



function updateMachineSort() {

    // Save current settings
    saveSortSettings();

    const keys = Object.keys(machineData);

    if (!currentSortProp) {
        buildMachineAccordion(keys);
        return;
    }

    let sortedKeys;

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
    else {
        sortedKeys = keys.sort((a, b) => {
            const A = machineData[a][currentSortProp];
            const B = machineData[b][currentSortProp];
            return (A > B ? 1 : A < B ? -1 : 0) * currentSortDir;
        });
    }

    buildMachineAccordion(sortedKeys);
}




function buildMachineAccordion(keysOverride = null) {
    const $acc = $("#accordion");
    
    if ($acc.hasClass("ui-accordion")) {
        $acc.accordion("destroy");
    }

    $acc.empty();

    if (Object.keys(machineData).length === 0) return;

    const keys = keysOverride || Object.keys(machineData);

    keys.forEach(id => {
        const m = machineData[id];

        // HEADER
        const $header = $(`
            <h3>
                <img src="images/KARS Resources/Machine Icons/${m.image}">
                ${m.name}
            </h3>
        `);

        // CONTENT
        const $content = $("<div></div>");

        

        // Main image
        const $insideHeader = $(`
            <h4>${m.name}</h4>
        `);

        // Main image
        const $img = $(`
            <img src="images/KARS Resources/Machine Renders/${m.image}">
        `);

        // Description
        const $desc = $(`<p>${m.description}</p>`);


      let statsHTML = `
          <h4>Stat Values</h4>
          <table class="machine-stats-table">
              <thead>
                  <tr>
                  </tr>
              </thead>
              <tbody>
      `;
      let i=0
      Object.keys(m).forEach(prop => {
          if (["name", "image", "description"].includes(prop)) return;
          let units = "";
          if (prop=="topSpeed"){
            units = " (km / hr)"
          }
          statsHTML += `
              <tr>
                  <td>${statNames[prop] + units}</td>
                  <td>${Number((m[prop] *  actualStatValues[i]).toFixed(2)) }</td>
              </tr>
          `;
          i++
      });

      statsHTML += `
              </tbody>
          </table>
      `;

      const $stats = $(statsHTML);

      $content.append($insideHeader, $img, $desc, $stats);

      $acc.append($header, $content);
    });

    //ACCORDION
    $("#accordion").accordion({
          heightStyle: "content",  // panel height = content height
          collapsible: true,       // allows panels to be closed
          animate: 200             // optional animation in ms
      });
}



function initMachinesUI() {
    loadSortSettings();
    buildMachineSortControls();
    buildMachineAccordion();
}









/** 
function buildMachineAccordion() {
    const $accordion = $("#accordion");
    $accordion.empty();   // remove example skeleton

    Object.keys(machineData).forEach(key => {
        const m = machineData[key];
        let section = ""
        section += `<h3><img src = "images/KARS Resources/Machine Icons/${m.image}">  ${m.name} </h3>
                    <div>
                    <img src = "images/KARS Resources/Machine Renders/${m.image}">
                    <p> ${m.name} </p>
                    <p> ${m.description}</p>
                    `;
        Object.keys(statNames).forEach(key => {
          section += `<tr>
                        <td class="charStatName">${statNames[key]}</td>
                        <td class="charStatValue">${m[key]}</td>
                      </tr>
                      `;
      })
      section += "</div>"
      $accordion.append(section);
    })


    // Reinitialize jQuery UI accordion
    $( "#accordion" ).accordion();

  }


*/
