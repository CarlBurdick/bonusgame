let type = "WebGL"

//Aliases
let Application = PIXI.Application,
    loader = PIXI.Loader.shared,
    resources = loader.resources,
    Sprite = PIXI.Sprite,
	AnimatedSprite = PIXI.AnimatedSprite,
	Text = PIXI.Text,
	Container = PIXI.Container,
	Graphics = PIXI.Graphics
	
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}
//Create a Pixi Application
let app = new Application({ 
	width: 256,         // default: 800
	height: 256       // default: 600
});

app.renderer.resize(window.innerWidth, window.innerHeight);
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

//load an image and run the `setup` function when it's done
loader
  .add([
	"assets/images/background.png",
	//"assets/images/coin-anim.png",
	"assets/images/coin-anim.json",
	"assets/images/glow.png",
	"assets/images/sunburst.png",
	"assets/images/pointer.png",
	"assets/images/wheel-center.png",
	"assets/images/wheel-slice.png"
	])
  .load(loadSounds);
  
  function loadSounds() {

  //Load the sounds
	sounds.load([
	  "assets/sounds/credits-rollup.wav",
	  "assets/sounds/wheel-click.wav",
	  "assets/sounds/wheel-landing.wav"
	]);
	sounds.whenLoaded = setup;
	
}

//global variables
let title,
	wheel,
	pointer,
	startButton,
	spinButton,
	backButton,
	spinning = false,
	currentPosition,
	speed,
	radsLeft,
	winAmount,
	countAmount,
	coins = [],
    coinImages = [],
	gameState,
	debug = {}
//constants
const adjustment = 6
	  gravity = 0.098
	  scores = [5000, 200, 1000, 400, 2000, 200, 1000, 400]

//This `setup` function will run when the image has loaded
function setup() {
  //Create and apply bg sprite
  let bg = new Sprite(resources["assets/images/background.png"].texture);
  app.renderer.resize(bg.width, bg.height);
  
  //create gamesprites
  coinImages = resources["assets/images/coin-anim.json"].spritesheet
  
  title = new Text('BONUS GAME',{fontFamily : 'Arial Black', fontSize: 50, fill : 'Gold', align : 'center'});
  title.x = bg.width/2 - title.width/2
  title.y = bg.height/6 - title.height/2
  
  
  //create wheel
  wheel = createWheel()
  wheel.scale.set(0.8, 0.8)
  wheel.rotation = ((Math.PI*2)/scores.length)*0.5
  wheel.position.x = bg.width/2
  wheel.position.y = bg.height
  
  //create pointer
  pointer = new Sprite(resources["assets/images/pointer.png"].texture);
  pointer.scale.set(1.2, 1.2)
  pointer.position.x = bg.width/2 - pointer.width/2
  pointer.position.y = bg.height/2 -pointer.height
  
  
  //create coin counter
  counter = createCounter()
  counter.position.x = bg.width - counter.width
  counter.position.y = counter.height
  
  //create startButton
  startButton = createButton('START', function(){
    sounds["assets/sounds/wheel-landing.wav"].play()
	title.visible = false
	startButton.visible = false
	spinButton.visible = true
	gameState = gamePlay
  })
  startButton.position.x = bg.width/2 - startButton.width/2
  startButton.position.y = bg.height - bg.height/6
  
  //create spinButton
  spinButton = createButton('PRESS TO SPIN', function(){
		spinning = true
		currentPosition = 0
		spinButton.visible = false
		radsLeft = calcWinnings()
	})
	spinButton.position.x = bg.width/2 - spinButton.width/2
	spinButton.position.y = bg.height - bg.height/6
	spinButton.visible = false
	
  //create backButton
  backButton = createButton('GO BACK', function(){
	//cleanup coins
	for(let i = 0; i<coins.length; i++){
		coins[i].destroy()
	}
	coins = []
	
	//reset stage
	title.text = 'BONUS GAME'
	title.x = bg.width/2 - title.width/2
	wheel.rotation = ((Math.PI*2)/scores.length)*0.5
	backButton.visible = false
	startButton.visible = true
	let winText = counter.getChildAt(1)
	winText.text = '00000000'
	gameState = gameMenu
  })
  backButton.position.set(10, 10)
  backButton.visible = false
  
  //Add the objects to the stage
  app.stage.addChild(bg)
  app.stage.addChild(wheel)
  app.stage.addChild(pointer)
  app.stage.addChild(title)
  app.stage.addChild(startButton)
  app.stage.addChild(spinButton)
  app.stage.addChild(counter)
  app.stage.addChild(backButton)
  
  //set gamestate and start
  gameState = gameMenu
  app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta){
  //execute gameState
  gameState(delta)
}

function loopSprite(sprite, sheet, adj) {
}

function createButton (text, cb) {
	//create button components
	let label = new Text(text,{fontFamily : 'Arial Black', fontSize: 40, fill : 'green', align : 'center'})
	let bg = new Graphics()
	bg.beginFill(0xA9A9A9)
	bg.lineStyle(5, 0xA9A9A9)
	bg.drawRect(0, 0, label.width * 1.5, 40)
	
	//compose
	let button = new Container()
	button.interactive = true
	button.addChild(bg)
	label.x = bg.width/2 - label.width/2
	//label.y = bg.position.y //bg.height/2 - title.height/2
	button.addChild(label)
	
	//click animation
	button.on('pointerdown', function(){
		label.style.fill = 'red'
	})
	
	button.on('pointerup', function(){
		label.style.fill = 'green'
		cb()
	})
	return button
}

function createWheel() {
	let colors = ['gold', 'black', 'purple', 'green', 'red', 'black', 'purple', 'green']
	let slices = []
	
	let fullWheel = new Container()
	
	//compose slices with labels
	for (let i = 0; i < 8; i++) {
		//use circle to rotate around the center of
		let rotator = new Container()
		let sizer = new Graphics();
		sizer.beginFill(0x9966FF);
		sizer.drawCircle(0, 0, resources["assets/images/wheel-slice.png"].texture.orig.height);
		sizer.endFill();
		sizer.position.x = sizer.width/2
		sizer.position.y = sizer.width/2
		rotator.addChild(sizer)
		
		//add label to wheel slice
		let slice = new Sprite(resources["assets/images/wheel-slice.png"].texture);
		let sliceLabel = new Text(scores[i],{fontFamily : 'Arial', fontSize: 60, fill : colors[i], align : 'center'});
		sliceLabel.position.set(
			slice.width/2 - sliceLabel.width/2, 
			slice.height/6 - sliceLabel.height/2
		)
		let fullSlice = new Container()
		fullSlice.addChild(slice)
		fullSlice.addChild(sliceLabel)
		
		//combine slice and rotate appropriately. (make circle invisible) 
		fullSlice.position.set(
			-(fullSlice.width/2), 
			-fullSlice.height
		)
		rotator.addChild(fullSlice)
		rotator.rotation = ((2*Math.PI)/scores.length) * i
		sizer.visible = false
		
		//combine slices
		fullWheel.addChild(rotator)
	}
	return fullWheel
}

function createCounter(){
	let label = new Text('00000000',{fontFamily : 'Arial Black', fontSize: 40, fill : 'gold', align : 'left'})
	let icon = new Sprite(coinImages.textures['coin-anim-02.png'])
	icon.width = 40
	icon.height = 40
	let ui = new Container()
	ui.addChild(icon)
	label.position.x = icon.width
	label.position.y -= icon.height/2
	ui.addChild(label)
	return ui
}
function gameMenu() {
}
function gamePlay() {
	if(spinning){
		let speed = 0.1
		if(radsLeft < 7){
			//get smooth deceleration 
			speed = ((radsLeft/7) * 0.1) + 0.003
		}
		if(radsLeft <= 0){
			speed = 0
			countAmount = 0
			title.visible = true
			title.text = `YOU WON ${winAmount} CREDITS!`
			title.x = app.stage.width/2 - title.width/2
			title.y = app.stage.height/6 - title.height/2
			spinning = false
			sounds["assets/sounds/wheel-landing.wav"].play()
			gameState = gameWin
		}
		
		//play clicks at approximate intervals to when slices pass pointer
		if(wheel.rotation < ((2*Math.PI)/scores.length)*currentPosition){
			currentPosition--
		 sounds["assets/sounds/wheel-click.wav"].play()
		}
		wheel.rotation -= speed
		radsLeft -= speed
	}
}
function gameWin() {
  
  let winText = counter.getChildAt(1)
  if(countAmount%5 == 0 && countAmount < winAmount ) {
      //spawn coins
	  let newCoin = new AnimatedSprite(coinImages.animations["coin-anim"])
	  newCoin.animationSpeed = 0.4
	  newCoin.gotoAndPlay(Math.floor(6*Math.random()))
	  newCoin.scale.set(0.2,0.2)
	  newCoin.x = pointer.position.x + pointer.width/2
	  newCoin.y = pointer.position.y
	  newCoin.vy = -5
	  newCoin.vx = (Math.random() - 0.5)*10
	  //newCoin.alpha = 0.5
	  app.stage.addChild(newCoin)
	  coins.push(newCoin)
	  
	  //animate counter
      sounds["assets/sounds/credits-rollup.wav"].play()
	  if(winText.style.fill === 'gold'){
		winText.style.fill = 'red'
	  } else {
		winText.style.fill = 'gold'
	  }
  }
  
  //Animate coins
  for (let i = 0; i < coins.length; i++) {
	//gravity
	coins[i].vy += gravity
	//apply velocity
	coins[i].x += coins[i].vx;
	coins[i].y += coins[i].vy;
  }
  
  if(countAmount < winAmount){
	countAmount++
	let str = '00000000' + countAmount
	winText.text = str.substring(str.length-8)
	
  } else {
	backButton.visible = true
  }
}

function calcWinnings(){
	let w = Math.random()*354
	let outcome
	switch(true) {
		case (w < 4): outcome = 0; break;
		case (w < 104): outcome = 1; break;
		case (w < 124): outcome = 2; break;
		case (w < 174): outcome = 3; break;
		case (w < 184): outcome = 4; break;
		case (w < 284): outcome = 5; break;
		case (w < 304): outcome = 6; break;
		case (w < 354): outcome = 7; break;
		default: outcome = 'error'
	}
	if(debug.set) {
		outcome = debug.index
		debug.set = false
	}
	winAmount = scores[outcome]
	//at least 2 spins then stop at a random position within the outcome slice
	let slice = ((Math.PI*2)/scores.length)
	let rads = (Math.random()*slice) + slice*outcome + (Math.PI*4)
	return rads
}

function winAtIndex(index){
	if(Number.isInteger(index) && index < scores.length) {
		debug.set = true
		debug.index = index
		console.log('set debug at index ' + index)
	} else {
		console.log('invalid index')
	}
}
PIXI.utils.sayHello(type)