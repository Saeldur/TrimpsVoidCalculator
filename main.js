function Simulator(heirloomPrc, targetZone, voidMaxLevel, achievementBonus, arrGoldenUpgrades) {
	var textResultDropChance = document.getElementById("text_result_drop_chance");
	var textResultGoldenInterval = document.getElementById("text_result_golden_interval");
	var textResultFinalGoldenVoidPrc = document.getElementById("text_result_final_golden_void_prc");
	var textResultVoidMaxLevel = document.getElementById("text_result_void_max_level");
	var textResultTargetZone = document.getElementById("text_result_target_zone");
	var textResultRuns = document.getElementById("text_result_runs");
	var containerResult = document.getElementById("container_result");
	
	heirloomPrc = heirloomPrc / 100;
	
	var goldenInterval = -1;
	if(achievementBonus >= 1000)
		goldenInterval = 30;
	else if(achievementBonus >= 600)
		goldenInterval = 35;
	else if(achievementBonus >= 300)
		goldenInterval = 40;
	else if(achievementBonus >= 100)
		goldenInterval = 45;
	else if(achievementBonus >= 15)
		goldenInterval = 50;
	
	var h, i, j;
	var min, max;
	var drops, seed;
	var lastVoidMap = 0;
	var goldenBonus = 0;
	var total = 0;
	var minimum = Number.MAX_VALUE;
	var maximum = 0;
	var runsAmount = 0;
	var arrOfAmounts = {};
	
	voidMaxLevel = targetZone > voidMaxLevel ? targetZone : voidMaxLevel;
	max = voidMaxLevel > 200 ? 200 : voidMaxLevel;
	
	this.run = function(loops) {
		runsAmount += loops;
		
		for(h = 0; h < loops; h++) {
			lastVoidMap = 0;
			goldenBonus = 0;
			drops = 0;
			seed = Math.floor(Math.random() * 1000000);
			
			for(i = 1; i < targetZone; i++) {
				if(goldenInterval != -1 && i % goldenInterval == 0) {
					if(arrGoldenUpgrades[i / goldenInterval - 1]) {
						goldenBonus += 0.02 * (i / goldenInterval);
					}
				}
				
				for(j = 0; j < 100; j++) {
					min = (max > 80) ? (1000 + ((max - 80) * 13)) : 1000;
					min *= (1 - heirloomPrc);
					min *= (1 - goldenBonus);
					
					var chance = (Math.floor((lastVoidMap - min) / 10) / 50000);
					lastVoidMap++;
					if(chance < 0)
						continue;
					if(seededRandom(seed++) >= chance)
						continue;
					lastVoidMap = 0;
					drops++;
				}
			}
			
			total += drops;
			if(minimum > drops)
				minimum = drops;
			if(maximum < drops)
				maximum = drops;
			
			if(typeof arrOfAmounts[drops] == "undefined")
				arrOfAmounts[drops] = 1;
			else
				arrOfAmounts[drops]++;
		}
		
		this.updateSwitches();
	}
	
	this.updateSwitches = function() {
		textResultDropChance.innerHTML = ((1 - heirloomPrc) * (1 - goldenBonus));
		textResultGoldenInterval.innerHTML = goldenInterval ? goldenInterval : "none";
		textResultFinalGoldenVoidPrc.innerHTML = goldenBonus * 100;
		textResultVoidMaxLevel.innerHTML = max;
		textResultTargetZone.innerHTML = targetZone;
		textResultRuns.innerHTML = runsAmount;
		
		containerResult.innerHTML = "Average drops: " + total / runsAmount + "<br>(min: " + minimum + ", max: " + maximum + ")<br><br>";
		var i;
		for(i in arrOfAmounts)
			if(arrOfAmounts[i] > 0)
				containerResult.innerHTML += i + " VM's: " + arrOfAmounts[i] + " times<br>";
	}
	
	this.finalize = function() {
		this.updateSwitches();
	}
	
	function seededRandom(seed){
		var x = Math.sin(seed++) * 10000;
		return (x - Math.floor(x));
	}
}

(function() {
	var loopsPerFrame = 100;

	var btnAddGolden = document.getElementById("btn_add_golden");
	var btnCalculate = document.getElementById("btn_calculate");
	var btnSavePull = document.getElementById("btn_save_pull");
	var btnSaveClear = document.getElementById("btn_save_clear");
	var progressCalculate = document.getElementById("progress_calculate");
	var textProgressCalculate = document.getElementById("text_progress_calculate");
	var textSelectedGoldenVoidPrc = document.getElementById("text_selected_golden_void_prc");
	var containerGolden = document.getElementById("container_golden");
	var inputSaveExport = document.getElementById("input_save_export");
	var inputHeirloomDrop = document.getElementById("input_heirloom_drop");
	var inputAchievementBonus = document.getElementById("input_achievement_bonus");
	var inputHighestZone = document.getElementById("input_highest_zone");
	var inputVoidMaxLevel = document.getElementById("input_void_max_level");
	var inputTargetZone = document.getElementById("input_target_zone");
	var inputRuns = document.getElementById("input_runs");
	var inputGoldenArr = [];
	
	var mainTimeout = null;
	var simulator = null;
	
	(function() {
		try {
			var save = JSON.parse(localStorage.getItem("cache"));
			var i, l;
			if(save) {
				inputHeirloomDrop.value = save.heirloomDrop;
				inputAchievementBonus.value = save.achievementBonus;
				inputHighestZone.value = save.highestZone;
				inputVoidMaxLevel.value = save.voidMaxLevel;
				inputTargetZone.value = save.targetZone;
				inputRuns.value = save.runs;
				
				l = save.arrGoldenUpgrades.length;
				for(i = l - 1; i >= 0; i--) {
					if(save.arrGoldenUpgrades[i]) {
						save.arrGoldenUpgrades = save.arrGoldenUpgrades.slice(0, i + 1);
						break;
					}
					if(i == 0) {
						save.arrGoldenUpgrades = [];
						break;
					}
				}
					
				l = save.arrGoldenUpgrades.length;
				for(i = 0; i < l; i++)
					onAddGolden(null, save.arrGoldenUpgrades[i]);
				
				if(l < 6)
					for(i = l; i < 6; i++)
						onAddGolden(null, false);
			}
			else {
				for(i = 0; i < 6; i++) {
					onAddGolden(null, false);
				}
			}
		}
		catch(e) {
			console.warn(e);
		}
	})();
	
	textSelectedGoldenVoidPrc.innerHTML = getSelectedTotalGoldenVoidPercentage() + "%";
	
	btnAddGolden.onclick = onAddGolden;
	btnCalculate.onclick = onCalculate;
	
	btnSavePull.onclick = function(e) {
		var i, j, l, temp;
		var game = JSON.parse(LZString.decompressFromBase64(inputSaveExport.value));
		
		temp = 0;
		l = game.global.ShieldEquipped.mods.length;
		for(i = 0; i < l; i++) {
			if(game.global.ShieldEquipped.mods[i][0] === "voidMaps") {
				temp = Number(game.global.ShieldEquipped.mods[i][1]);
				break;
			}
		}
		inputHeirloomDrop.value = temp;
		inputAchievementBonus.value = Number(game.global.achievementBonus);
		//inputHighestZone.value = Number(game.global.highestLevelCleared + 1);
		inputVoidMaxLevel.value = Number(game.global.voidMaxLevel);
		inputTargetZone.value = Number(game.global.world);
		
		l = inputGoldenArr.length;
		for(i = 0; i < l; i++) {
			inputGoldenArr[i].checked = false;
		}
		
		l = game.goldenUpgrades.Void.purchasedAt.length;
		for(i = 0; i < l; i++) {
			for(j = 0; j < 10; j++) {
				if(inputGoldenArr[game.goldenUpgrades.Void.purchasedAt[i]] !== undefined) {
					inputGoldenArr[game.goldenUpgrades.Void.purchasedAt[i]].checked = true;
				}
				else {
					onAddGolden(e, false);
				}
			}
		}
		
		onGoldenStateChange(e);
		
	}
	
	btnSaveClear.onclick = function() {
		inputSaveExport.value = "";
	}
	
	function getSelectedTotalGoldenVoidPercentage() {
		var i, l = inputGoldenArr.length, total = 0;
		for(i = 0; i < l; i++) {
			if(inputGoldenArr[i].checked)
				total += (i + 1) * 2;
		}
		return total;
	}
	
	function onGoldenStateChange(e) {
		var total = getSelectedTotalGoldenVoidPercentage();
		
		if(e.target.checked && total > 60)
			e.target.checked = false;
		
		textSelectedGoldenVoidPrc.innerHTML = getSelectedTotalGoldenVoidPercentage() + "%";
	}
	
	function onAddGolden(e, isPreselect) {
		var prc = ((inputGoldenArr.length + 1) * 2);
		if(prc > 60)
			return;
		
		var span = document.createElement("span");
		var input = document.createElement("input");
		var br = document.createElement("br");
		
		span.innerHTML = prc + "% ";
		input.type = "checkbox";
		
		if(isPreselect)
			input.checked = true;
		
		inputGoldenArr.push(input);
		
		input.onchange = onGoldenStateChange;
		
		containerGolden.appendChild(span);
		containerGolden.appendChild(input);
		containerGolden.appendChild(br);
	}
	
	function onCalculate(e) {
		if(mainTimeout) {
			clearTimeout(mainTimeout);
			mainTimeout = null;
			onFinalize();
			
			btnCalculate.innerHTML = "Calculate";
			return;
		}
		btnCalculate.innerHTML = "Stop";
		
		var heirloomDrop 		= Number(inputHeirloomDrop.value);
		var achievementBonus 	= Number(inputAchievementBonus.value);
		var highestZone 		= parseInt(inputHighestZone.value);
		var voidMaxLevel 		= parseInt(inputVoidMaxLevel.value);
		var targetZone 			= parseInt(inputTargetZone.value);
		var runs 				= parseInt(inputRuns.value);
		var arrGoldenUpgrades = [];
		(function() {
			var i, l = inputGoldenArr.length;
			for(i = 0; i < l; i++) {
				arrGoldenUpgrades[i] = inputGoldenArr[i].checked;
			}
		})();
		
		try {
			localStorage.setItem("cache", JSON.stringify({
				heirloomDrop : heirloomDrop,
				achievementBonus : achievementBonus,
				highestZone : highestZone,
				voidMaxLevel : voidMaxLevel,
				targetZone : targetZone,
				runs : runs,
				arrGoldenUpgrades : arrGoldenUpgrades
			}));
		} 
		catch(e) {
			console.warn(e);
		}
		
		simulator = new Simulator(heirloomDrop, targetZone, voidMaxLevel, achievementBonus, arrGoldenUpgrades);
		
		function onNextFrame(loops) {
			simulator.run(loops);
		}
		function onFinalize() {
			resetProgressBar();
			mainTimeout = null;
			if(simulator) {
				simulator.finalize();
				simulator = null;
			}
			btnCalculate.innerHTML = "Calculate";
		}
		function resetProgressBar() {
			progressCalculate.style.width = "0%";
			textProgressCalculate.innerHTML = "0%";
		}
		
		(function() {
			var i = runs;
				
			onTimeout(i >= loopsPerFrame ? loopsPerFrame : i);
			
			function onTimeout(loops) {
				onNextFrame(loops);
				var prc = Math.round((1 - i / runs) * 100);
				progressCalculate.style.width = prc + "%";
				textProgressCalculate.innerHTML = prc + "%";

				i -= loopsPerFrame;
				
				if(i > 0) {
					mainTimeout = setTimeout(
						(function(loops) {
							return function() {
								onTimeout(loops);
							}
						})(i >= loopsPerFrame ? loopsPerFrame : i)
					, 0);
				}
				else {
					onFinalize();
				}
			}
		})();
	}
})();

(function() {
	var btnHelp = document.getElementById("btn_help");
	var colLeft = document.getElementById("col_left");
	var colRight = document.getElementById("col_right");
	var descHelp = document.getElementById("desc_help");
	
	var isHelp = false;
	
	function onHelp() {
		if(isHelp) {
			colRight.className = "col-md-2";
			colLeft.className = "col-md-2";
			descHelp.style.display = "none";
			isHelp = false;
		}
		else {
			colRight.className = "col-md-4";
			colLeft.className = "";
			descHelp.style.display = "inherit";
			isHelp = true;
		}
	}
	
	btnHelp.onclick = onHelp;
})();








