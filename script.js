 "use strict";

let machineData = {};
let characterData = {};
let colorIndex = 0;
let machinesLoaded = false;
let charactersLoaded = false;

// Smooth HSL rainbow colors
const rainbowColors = [
  "hsl(0, 100%, 50%)",    // red
  "hsl(30, 100%, 50%)",   // orange
  "hsl(60, 100%, 50%)",   // yellow
  "hsl(120, 100%, 40%)",  // green
  "hsl(240, 100%, 50%)",  // blue
  "hsl(275, 100%, 50%)",  // indigo
  "hsl(300, 100%, 50%)"   // violet
];

$(document).ready(function() {
  // Load machines
  $.getJSON("machines.json", function(machines) {
  machineData = machines;
  for (const key in machines) {
    const machine = machines[key]
    $("#machineDropdown").append(`<option value="${key}">${machine.name}</option>`);
  }

  machinesLoaded = true;
  tryRestoreLastCombo();
});

// Load characters
$.getJSON("characters.json", function(chars) {
  characterData = chars;
  for (const key in chars) {
    const char = chars[key]
    $("#characterDropdown").append(`<option value="${key}">${char.name}</option>`);
  }

  charactersLoaded = true;
  tryRestoreLastCombo();
  populateGridDropdowns();
});

  // Load combo button
  $("#loadCombo").on("click", function() {
    const selectedMachine = $("#machineDropdown").val();
    const selectedCharacter = $("#characterDropdown").val();
    if (!selectedMachine || !selectedCharacter) { alert("Pick both!"); return; }

    const combinedStats = combineStats(machineData[selectedMachine], characterData[selectedCharacter]);
    const color = rainbowColors[colorIndex % rainbowColors.length];
    colorIndex++;

    DrawChart(combinedStats, color);
    displayComboBlock(selectedCharacter, selectedMachine, color);



    localStorage.setItem("lastCombo", JSON.stringify({
      character: selectedCharacter,
      machine: selectedMachine,
      colorIndex
    }));
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
  const statKeys = ["topSpeed","boost","charge","turn","grip","Lift","flightSpeed","offense","maxHP","weight"];
  const result = {};
  statKeys.forEach(k => { result[k] = machine[k] * (character[k] || 1) *2; });
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

  const statKeys = ["topSpeed","boost","charge","turn","grip","Lift","flightSpeed","offense","maxHP","weight"];
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
            combined[stat] = (rider[stat] || 1) * (machine[stat] || 1);
        });
        return combined;
    } else if (rider) {
        return rider;
    } else if (machine) {
        return machine;
    } else {
        return {};
    }
}

$('#rider1, #rider2, #machine1, #machine2').on('change', function() {
    getDirectStats();
});


$("#gridCompareBtn").on("click", function() {
    // Get combined stats for Choice 1 and Choice 2
    const choice1 = getDirectStats('rider1', 'machine1');
    const choice2 = getDirectStats('rider2', 'machine2');


    const rider1Key = $('#rider1').val();
    const machine1Key = $('#machine1').val();

    
    $("#firstChoice").html(`
        <div>
            <img src="images/KARS Resources/Character icons/${characterData[rider1Key].image}" alt="">
            ${characterData[rider1Key].name}
        </div>
        <div>
            <img src="images/KARS Resources/Machine icons/${machineData[machine1Key].image}" alt="">
            ${machineData[machine1Key].name}
        </div>
    `);

    const rider2Key = $('#rider2').val();
    const machine2Key = $('#machine2').val();

    $("#secondChoice").html(`
        <div>
            <img src="images/KARS Resources/Character icons/${characterData[rider2Key].image}" alt="">
            ${characterData[rider2Key].name}
        </div>
        <div>
            <img src="images/KARS Resources/Machine icons/${machineData[machine2Key].image}" alt="">
            ${machineData[machine2Key].name}
        </div>
    `);

    // List of stats to display
    const statKeys = ["topSpeed", "boost", "charge", "turn", "grip", "lift", "flightSpeed", "offense", "maxHP", "weight"];

    let actualStatValues = [0.2,    0.2,      1,        1,      1,      1,        .2,          .3,        .5,       .3];
    let i=0;
    statKeys.forEach(stat => {
        const val1 = choice1[stat] !== undefined ? choice1[stat] *  actualStatValues[i] : undefined;
        const val2 = choice2[stat] !== undefined ? choice2[stat] *  actualStatValues[i] : undefined;

        $('#' + stat + '1').text(val1 !== undefined ? val1.toFixed(2) : '—');
        $('#' + stat + '2').text(val2 !== undefined ? val2.toFixed(2) : '—');
        $('#' + stat + 'Diff').text((val1 !== undefined && val2 !== undefined)? (val1 - val2).toFixed(2) : '—');
        if(val1 != 0 && val2 !=0){
            $('#' + stat + 'DiffPercent').text(((val1/val2)*100).toFixed(1) +"%");
        }else{
            $('#' + stat + 'DiffPercent').text("NA");
        }
    });
});



