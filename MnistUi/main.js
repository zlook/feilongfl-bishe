const electron = require('electron')
const jQuery = require('jquery')
const { exec } = require('child_process');
const fs = require('fs');

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1235, height: 800,
        autoHideMenuBar: true
    })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// Ipc
const ipcMain = require('electron').ipcMain
ipcMain.on('inimg', getImg)
ipcMain.on('train', train)

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
//globle var
global.sharedObject = {
    newTel: '000'
}

var python = "python "

function processErr(error, stdout, stderr)
{
    console.error(`exec error: ${error}`);
    ipcEvent.sender.send('error', error);
    ipcEvent.sender.send('errormsg', stderr);
}

function train(event, arg) {
    //var readPyname = '/python/mnist_read.py';
    var Pyname = '/python/mnist_deep_train.py --num ' + arg.toString();
    console.log(Pyname);
    
    exec(python + __dirname + Pyname, (error, stdout, stderr) => {
        if (error) {
            processErr(error)
            return;
        }
        ipcEvent.sender.send('trainFin', stdout);
        console.log(stdout)
    });
}

function verifyImage()
{
    //var readPyname = '/python/mnist_read.py';
    var readPyname = '/python/mnist_deep_read.py';

    exec(python + __dirname + readPyname, (error, stdout, stderr) => {
        if (error) {
            processErr(error)
            return;
        }
        ipcEvent.sender.send('verify', 'OK');
        ipcEvent.sender.send('finish', stdout);
        console.log(stdout)
    });
}

function cutImage()
{
    exec(python + __dirname + '/python/cut.py', (error, stdout, stderr) => {
        if (error) {
            processErr(error,stdout,stderr)
            return;
        }
        ipcEvent.sender.send('cut', 'OK');

        verifyImage()
    });
}

function preImg()
{
    exec(python + __dirname + '/python/remove_alpha.py', (error, stdout, stderr) => {
        if (error) {
            processErr(error, stdout, stderr)
            return;
        }
        ipcEvent.sender.send('binimg', 'OK');

        cutImage();
    });
}

function cutImage2() {
    exec(python + __dirname + '/python/cut.py', (error, stdout, stderr) => {
        if (error) {
            processErr(error, stdout, stderr)
            return;
        }
        ipcEvent.sender.send('cut', 'OK');

        //verifyImage()
    });
}

function preImg2() {
    exec(python + __dirname + '/python/remove_alpha.py', (error, stdout, stderr) => {
        if (error) {
            processErr(error, stdout, stderr)
            return;
        }
        ipcEvent.sender.send('binimg', 'OK');

        cutImage();
    });
}

function prepro() {
    exec('magick convert ./data/data.png -background white -alpha remove -trim -resize 28x28 -gravity center -extent 28x28 ./data/data.min.png', (error, stdout, stderr) => {
        if (error) {
            processErr(error, stdout, stderr)
            return;
        }
        ipcEvent.sender.send('cut', 'OK');
    });
}

function dataUri2png(imgdata)
{
    var regex = /^data:.+\/(.+);base64,(.*)$/;
    var matches = imgdata.match(regex);
    var ext = matches[1];
    var data = matches[2];
    var buffer = new Buffer(data, 'base64');
    //fs.writeFileSync('data.' + ext, buffer);
    fs.writeFile('./data/data.' + ext, buffer, prepro)
}

var ipcEvent;
//get image
function getImg(event, arg) {
    //console.log(arg)
    event.sender.send('inimg-reply', 'OK');

    ipcEvent = event;
    dataUri2png(arg)
}

//camera
