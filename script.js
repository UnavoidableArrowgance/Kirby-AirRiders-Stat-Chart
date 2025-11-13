 
 let hue = 0; // starting hue for rainbow
 
 function DrawChart(stats){
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    
    let middleX = canvas.height/2;
    let middleY = canvas.width/2;
    // Stats (in clockwise order)

    // Convert stats to array for easy iteration
    const values = [
    stats.topSpeed,
    stats.boost,
    stats.charge,
    stats.turn,
    stats.grip,
    stats.Lift,
    stats.flightSpeed,
    stats.offense,
    stats.maxHP,
    stats.weight
    ];

    // Number of directions (10 evenly spaced)
    const total = values.length;
    const step = (2 * Math.PI) / total;  // 360° / 10 = 36°

    // Generate a rainbow color
    const color = `hsl(${hue}, 100%, 50%)`;
    hue = (hue + 36) % 360; // advance hue for next call (360/10 ≈ 36)

    ctx.beginPath();

    for (let i = 0; i < total; i++) {
    // Angle in radians — start with 0° at the top, move clockwise
    const angle = i * step;

    // X and Y multipliers
    const x = middleX + Math.sin(angle) * values[i];
    const y = middleY - Math.cos(angle) * values[i]; // minus because canvas Y grows downward

    if (i === 0) {
        ctx.moveTo(x, y);
    } else {
        ctx.lineTo(x, y);
    }
    }

    // Close the shape
    ctx.closePath();

    // Draw the outline
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Optionally fill it
     ctx.fillStyle = `hsla(${(hue + 180) % 360}, 100%, 50%, 0.3)`; // complementary translucent
    ctx.fill();
 }



const machineStats = {
    bulkStar:       { topSpeed: 300, boost: 150, charge: 210, turn: 120, grip: 195, Lift: 210, flightSpeed: 180, offense: 240, maxHP: 300, weight: 285 },
    compactStar:    { topSpeed: 180, boost: 195, charge: 150, turn: 255, grip: 240, Lift: 210, flightSpeed: 165, offense: 180, maxHP: 180, weight: 150 },
    formulaStar:    { topSpeed: 270, boost: 225, charge: 210, turn: 180, grip: 210, Lift: 240, flightSpeed: 255, offense: 210, maxHP: 210, weight: 195 },
    jetStar:        { topSpeed: 285, boost: 255, charge: 240, turn: 180, grip: 210, Lift: 255, flightSpeed: 300, offense: 225, maxHP: 210, weight: 180 },
    rexWheelie:     { topSpeed: 225, boost: 180, charge: 195, turn: 165, grip: 210, Lift: 180, flightSpeed: 150, offense: 255, maxHP: 240, weight: 270 },
    rocketStar:     { topSpeed: 240, boost: 210, charge: 240, turn: 195, grip: 225, Lift: 210, flightSpeed: 240, offense: 225, maxHP: 240, weight: 210 },
    shadowStar:     { topSpeed: 255, boost: 225, charge: 210, turn: 180, grip: 210, Lift: 240, flightSpeed: 255, offense: 210, maxHP: 210, weight: 195 },
    slickStar:      { topSpeed: 240, boost: 210, charge: 195, turn: 225, grip: 240, Lift: 210, flightSpeed: 180, offense: 195, maxHP: 195, weight: 180 },
    swerveStar:     { topSpeed: 225, boost: 195, charge: 180, turn: 240, grip: 225, Lift: 195, flightSpeed: 165, offense: 180, maxHP: 180, weight: 165 },
    turboStar:      { topSpeed: 270, boost: 240, charge: 225, turn: 210, grip: 225, Lift: 240, flightSpeed: 255, offense: 210, maxHP: 210, weight: 195 },
    wagonStar:      { topSpeed: 210, boost: 180, charge: 195, turn: 150, grip: 195, Lift: 210, flightSpeed: 165, offense: 180, maxHP: 240, weight: 225 },
    warpStar:       { topSpeed: 240, boost: 225, charge: 255, turn: 210, grip: 240, Lift: 225, flightSpeed: 255, offense: 225, maxHP: 240, weight: 210 },
    wheelieBike:    { topSpeed: 225, boost: 210, charge: 195, turn: 225, grip: 240, Lift: 195, flightSpeed: 180, offense: 210, maxHP: 210, weight: 180 },
    wheelieScooter: { topSpeed: 210, boost: 195, charge: 180, turn: 240, grip: 225, Lift: 180, flightSpeed: 165, offense: 195, maxHP: 195, weight: 165 },
    wingedStar:     { topSpeed: 210, boost: 180, charge: 225, turn: 270, grip: 195, Lift: 300, flightSpeed: 285, offense: 180, maxHP: 180, weight: 150 }
};


function handleSubmit() {
    const selection = document.getElementById("machineSelect").value;
    if (selection === "default") {
        alert("Please select a machine!");
        return;
    }

    // Pass the selected stats dictionary to DrawChart
    DrawChart(machineStats[selection]);
}

function clearCanvas() {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Add event listener for submit button
document.getElementById("submitBtn").addEventListener("click", handleSubmit);


// Add event listener
document.getElementById("clearBtn").addEventListener("click", clearCanvas);

